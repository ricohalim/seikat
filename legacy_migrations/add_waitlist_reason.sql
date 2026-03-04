-- ============================================================
-- MIGRATION: add_waitlist_reason
-- Membedakan Waiting List karena kuota penuh vs. sanksi absensi
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom waitlist_reason pada event_participants
ALTER TABLE event_participants
ADD COLUMN IF NOT EXISTS waitlist_reason TEXT
    CHECK (waitlist_reason IN ('quota_full', 'sanction'));

-- ============================================================
-- 2. Update RPC register_for_event: isi waitlist_reason saat insert
-- ============================================================
CREATE OR REPLACE FUNCTION register_for_event(
    p_event_id UUID,
    p_user_id  UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_quota     INT;
    v_active_count    INT;
    v_absences        INT;
    v_status          TEXT;
    v_waitlist_reason TEXT;
    v_already_exists  BOOLEAN;
BEGIN
    -- 1. Cek sudah terdaftar sebelumnya (bukan Cancelled/Permitted)
    SELECT EXISTS (
        SELECT 1 FROM event_participants
        WHERE event_id = p_event_id
          AND user_id   = p_user_id
          AND status NOT IN ('Cancelled', 'Permitted')
    ) INTO v_already_exists;

    IF v_already_exists THEN
        RETURN json_build_object('success', false, 'message', 'Anda sudah terdaftar di event ini.');
    END IF;

    -- 2. Lock & baca kuota event (FOR UPDATE mencegah race condition)
    SELECT quota INTO v_event_quota
    FROM events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Event tidak ditemukan.');
    END IF;

    -- 3. Hitung peserta aktif saat ini
    SELECT COUNT(*) INTO v_active_count
    FROM event_participants
    WHERE event_id = p_event_id
      AND status NOT IN ('Cancelled', 'Permitted', 'Waiting List');

    -- 4. Ambil data sanksi user
    SELECT COALESCE(consecutive_absences, 0) INTO v_absences
    FROM profiles
    WHERE id = p_user_id;

    -- 5. Tentukan status & alasan waiting list
    IF v_absences >= 2 THEN
        -- Sanksi: masuk WL karena sanksi, bukan karena kuota
        v_status          := 'Waiting List';
        v_waitlist_reason := 'sanction';
    ELSIF v_event_quota > 0 AND v_active_count >= v_event_quota THEN
        -- Kuota penuh
        v_status          := 'Waiting List';
        v_waitlist_reason := 'quota_full';
    ELSE
        v_status          := 'Registered';
        v_waitlist_reason := NULL;
    END IF;

    -- 6. Insert peserta dengan status + alasan WL secara atomik
    INSERT INTO event_participants (event_id, user_id, status, waitlist_reason)
    VALUES (p_event_id, p_user_id, v_status, v_waitlist_reason);

    RETURN json_build_object(
        'success',        true,
        'status',         v_status,
        'waitlist_reason', v_waitlist_reason,
        'message', CASE
            WHEN v_status = 'Waiting List' AND v_waitlist_reason = 'sanction'
                THEN 'Anda masuk Waiting List karena sanksi absensi aktif.'
            WHEN v_status = 'Waiting List'
                THEN 'Kuota penuh. Anda masuk Waiting List.'
            ELSE
                'Berhasil mendaftar kegiatan!'
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Terjadi kesalahan: ' || SQLERRM);
END;
$$;

-- Berikan akses ke authenticated users
GRANT EXECUTE ON FUNCTION register_for_event(UUID, UUID) TO authenticated;

-- ============================================================
-- 3. Update trigger: hanya promote WL dengan waitlist_reason = 'quota_full'
--    Peserta WL karena sanksi TIDAK otomatis naik saat kuota dinaikkan
-- ============================================================
CREATE OR REPLACE FUNCTION process_waitlist_on_quota_increase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_count    INT;
    v_available_slots INT;
    v_waitlist_row    RECORD;
BEGIN
    -- Hanya proses kalau quota benar-benar naik
    IF NEW.quota <= OLD.quota THEN
        RETURN NEW;
    END IF;

    -- Jika quota baru = 0 artinya tidak terbatas, tidak perlu proses waitlist
    IF NEW.quota = 0 THEN
        RETURN NEW;
    END IF;

    -- Hitung peserta aktif saat ini (exclude Cancelled, Permitted, Waiting List)
    SELECT COUNT(*) INTO v_active_count
    FROM event_participants
    WHERE event_id = NEW.id
      AND status NOT IN ('Cancelled', 'Permitted', 'Waiting List', 'Absent', 'Rejected');

    -- Hitung slot tersedia
    v_available_slots := NEW.quota - v_active_count;

    -- Jika tidak ada slot baru, selesai
    IF v_available_slots <= 0 THEN
        RETURN NEW;
    END IF;

    -- Loop approve waiting list HANYA yang karena kuota penuh (bukan sanksi), FIFO
    FOR v_waitlist_row IN
        SELECT id, user_id
        FROM event_participants
        WHERE event_id = NEW.id
          AND status = 'Waiting List'
          AND (waitlist_reason = 'quota_full' OR waitlist_reason IS NULL) -- IS NULL untuk data lama
        ORDER BY id ASC
        LIMIT v_available_slots
    LOOP
        UPDATE event_participants
        SET status = 'Registered',
            waitlist_reason = NULL  -- bersihkan setelah promoted
        WHERE id = v_waitlist_row.id;

        v_available_slots := v_available_slots - 1;
        EXIT WHEN v_available_slots <= 0;
    END LOOP;

    RETURN NEW;
END;
$$;

-- Re-attach trigger (tidak perlu drop karena CREATE OR REPLACE function)
DROP TRIGGER IF EXISTS trg_auto_approve_waitlist ON events;
CREATE TRIGGER trg_auto_approve_waitlist
AFTER UPDATE OF quota ON events
FOR EACH ROW
EXECUTE FUNCTION process_waitlist_on_quota_increase();

-- ============================================================
-- 4. Backfill data lama (opsional tapi direkomendasikan)
-- Coba tebak reason berdasarkan kondisi saat record dibuat
-- ============================================================
-- Peserta WL yang user-nya punya sanksi aktif → sanction
UPDATE event_participants ep
SET waitlist_reason = 'sanction'
FROM profiles p
WHERE ep.user_id = p.id
  AND ep.status = 'Waiting List'
  AND ep.waitlist_reason IS NULL
  AND p.consecutive_absences >= 2;

-- Sisanya → quota_full
UPDATE event_participants
SET waitlist_reason = 'quota_full'
WHERE status = 'Waiting List'
  AND waitlist_reason IS NULL;

-- Verifikasi
SELECT waitlist_reason, COUNT(*) 
FROM event_participants 
WHERE status = 'Waiting List'
GROUP BY waitlist_reason;
