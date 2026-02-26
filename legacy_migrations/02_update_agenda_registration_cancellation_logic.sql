-- ============================================================
-- SQL Script: Update Agenda Logic
-- Description: 
-- 1. Mencegah pendaftaran untuk event di hari yang sama.
-- 2. Meng-approve otomatis dari Waiting List ketika izin disetujui.
-- ============================================================

-- 1. Modified RPC: register_for_event
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
    v_already_exists  BOOLEAN;
    v_same_day_exists BOOLEAN;
    v_event_date      DATE;
BEGIN
    -- 1. Cek sudah terdaftar sebelumnya di event ini (bukan Cancelled/Permitted/Rejected)
    SELECT EXISTS (
        SELECT 1 FROM event_participants
        WHERE event_id = p_event_id
          AND user_id   = p_user_id
          AND status NOT IN ('Cancelled', 'Permitted', 'Rejected', 'Absent')
    ) INTO v_already_exists;

    IF v_already_exists THEN
        RETURN json_build_object('success', false, 'message', 'Anda sudah terdaftar di event ini.');
    END IF;

    -- 2. Lock & baca kuota event dan tanggal event
    SELECT quota, date_start::DATE INTO v_event_quota, v_event_date
    FROM events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Event tidak ditemukan.');
    END IF;

    -- 3. Cek apakah user sudah terdaftar di event lain pada HARI YANG SAMA
    -- Ceknya di event aktif yg belum dibatalkan (bukan 'Cancelled', 'Permitted', 'Rejected', 'Absent')
    SELECT EXISTS (
        SELECT 1 
        FROM event_participants ep
        JOIN events e ON ep.event_id = e.id
        WHERE ep.user_id = p_user_id
          AND ep.event_id != p_event_id
          AND ep.status NOT IN ('Cancelled', 'Permitted', 'Rejected', 'Absent')
          AND e.date_start::DATE = v_event_date
    ) INTO v_same_day_exists;

    IF v_same_day_exists THEN
        RETURN json_build_object('success', false, 'message', 'Anda hanya bisa mendaftar 1 agenda pada hari yang sama.');
    END IF;

    -- 4. Hitung peserta aktif saat ini (exclude Waitlist/Cancelled dll)
    SELECT COUNT(*) INTO v_active_count
    FROM event_participants
    WHERE event_id = p_event_id
      AND status NOT IN ('Cancelled', 'Permitted', 'Waiting List', 'Absent', 'Rejected');

    -- 5. Ambil data sanksi user
    SELECT COALESCE(consecutive_absences, 0) INTO v_absences
    FROM profiles
    WHERE id = p_user_id;

    -- 6. Tentukan status: sanksi aktif ATAU kuota penuh → Waiting List
    IF v_absences >= 2 OR (v_event_quota > 0 AND v_active_count >= v_event_quota) THEN
        v_status := 'Waiting List';
    ELSE
        v_status := 'Registered';
    END IF;

    -- 7. Insert peserta dengan status yang sudah ditentukan
    INSERT INTO event_participants (event_id, user_id, status)
    VALUES (p_event_id, p_user_id, v_status);

    RETURN json_build_object(
        'success', true,
        'status',  v_status,
        'message', CASE
            WHEN v_status = 'Waiting List' AND v_absences >= 2
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


-- 2. Modified RPC: approve_cancellation
CREATE OR REPLACE FUNCTION approve_cancellation(
  p_event_id UUID,
  p_user_id UUID,
  p_approve BOOLEAN -- true = approve, false = reject
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_waitlist_id UUID;
    v_event_quota INT;
    v_active_count INT;
BEGIN
    IF p_approve THEN
        -- 1. Setujui izin (Ganti status jadi 'Permitted')
        UPDATE event_participants
        SET 
            status = 'Permitted', 
            cancellation_status = 'approved'
        WHERE event_id = p_event_id AND user_id = p_user_id;

        -- 2. Cek apakah ada slot kosong
        SELECT quota INTO v_event_quota
        FROM events
        WHERE id = p_event_id FOR SHARE;

        SELECT COUNT(*) INTO v_active_count
        FROM event_participants
        WHERE event_id = p_event_id
          AND status NOT IN ('Cancelled', 'Permitted', 'Waiting List', 'Absent', 'Rejected');

        -- 3. Jika slot tersedia (atau kuota 0 / tidak terbatas), ambil 1 orang dari Waiting List
        IF v_event_quota = 0 OR v_active_count < v_event_quota THEN
            SELECT id INTO v_waitlist_id
            FROM event_participants
            WHERE event_id = p_event_id AND status = 'Waiting List'
            ORDER BY registered_at ASC
            LIMIT 1;

            -- 4. Jika ada yg di antrian, otomatis jadikan 'Registered'
            IF FOUND THEN
                UPDATE event_participants
                SET status = 'Registered'
                WHERE id = v_waitlist_id;
            END IF;
        END IF;
    ELSE
        -- Jika ditolak, kembalikan ke Registered (jadi harus hadir atau dapat Alpha)
        UPDATE event_participants
        SET 
            status = 'Registered', 
            cancellation_status = 'rejected'
        WHERE event_id = p_event_id AND user_id = p_user_id;
    END IF;
END;
$$;
