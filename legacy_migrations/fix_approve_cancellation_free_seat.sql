-- ============================================================
-- FIX: approve_cancellation — Bebaskan seat saat izin disetujui
-- Masalah: setelah izin di-ACC, seat tidak dibebaskan sehingga
--          pendaftar berikutnya masuk Waiting List padahal ada slot kosong.
-- Solusi: setelah status jadi 'Permitted', cek slot lalu promosikan
--         1 orang dari Waiting List (urut registered_at ASC = daftar pertama).
-- Jalankan di Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION approve_cancellation(
  p_event_id UUID,
  p_user_id  UUID,
  p_approve  BOOLEAN   -- true = setujui izin, false = tolak
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_waitlist_id    UUID;
    v_event_quota    INT;
    v_active_count   INT;
BEGIN
    IF p_approve THEN
        -- 1. Setujui izin → status jadi 'Permitted' (tidak menghitung seat)
        UPDATE event_participants
        SET
            status              = 'Permitted',
            cancellation_status = 'approved'
        WHERE event_id = p_event_id
          AND user_id  = p_user_id;

        -- 2. Baca kuota event
        SELECT quota INTO v_event_quota
        FROM events
        WHERE id = p_event_id
        FOR SHARE;

        -- 3. Hitung peserta aktif sekarang (SETELAH approve, jadi person di atas sudah tidak terhitung)
        SELECT COUNT(*) INTO v_active_count
        FROM event_participants
        WHERE event_id = p_event_id
          AND status NOT IN ('Cancelled', 'Permitted', 'Waiting List', 'Absent', 'Rejected');

        -- 4. Jika kuota tidak terbatas (0) ATAU ada slot kosong → promosikan dari Waiting List
        IF v_event_quota = 0 OR v_active_count < v_event_quota THEN
            SELECT id INTO v_waitlist_id
            FROM event_participants
            WHERE event_id = p_event_id
              AND status   = 'Waiting List'
            ORDER BY registered_at ASC  -- yang daftar duluan dipromosikan duluan
            LIMIT 1;

            IF FOUND THEN
                UPDATE event_participants
                SET status = 'Registered'
                WHERE id = v_waitlist_id;
            END IF;
        END IF;

    ELSE
        -- Jika ditolak → kembalikan ke Registered (harus hadir atau dapat Alpha)
        UPDATE event_participants
        SET
            status              = 'Registered',
            cancellation_status = 'rejected'
        WHERE event_id = p_event_id
          AND user_id  = p_user_id;
    END IF;
END;
$$;
