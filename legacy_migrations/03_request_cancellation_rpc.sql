-- ============================================================
-- SQL Script: Request Event Cancellation RPC
-- Description: Allows users to securely request cancellation 
-- without needing full UPDATE privileges via RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION request_event_cancellation(
    p_event_id UUID,
    p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INT;
BEGIN
    UPDATE event_participants
    SET 
        cancellation_reason = p_reason,
        cancellation_status = 'pending'
    WHERE event_id = p_event_id 
      AND user_id = auth.uid()
      AND status NOT IN ('Cancelled', 'Permitted', 'Rejected', 'Absent');

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
        RETURN json_build_object('success', false, 'message', 'Record tidak ditemukan atau tidak valid untuk dibatalkan.');
    END IF;

    RETURN json_build_object('success', true, 'message', 'Permohonan izin dikirim. Menunggu persetujuan admin.');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Terjadi kesalahan: ' || SQLERRM);
END;
$$;
