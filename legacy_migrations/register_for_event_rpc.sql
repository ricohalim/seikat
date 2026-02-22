-- ============================================================
-- RPC: register_for_event
-- Menangani pendaftaran event secara atomik di level DB.
-- Mencegah race condition ketika banyak user daftar bersamaan.
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

    -- 5. Tentukan status: sanksi aktif ATAU kuota penuh → Waiting List
    IF v_absences >= 2 OR (v_event_quota > 0 AND v_active_count >= v_event_quota) THEN
        v_status := 'Waiting List';
    ELSE
        v_status := 'Registered';
    END IF;

    -- 6. Insert peserta dengan status yang sudah ditentukan secara atomik
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

-- Berikan akses ke authenticated users
GRANT EXECUTE ON FUNCTION register_for_event(UUID, UUID) TO authenticated;
