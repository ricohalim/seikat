-- ============================================================
-- MIGRATION: event_activity_logging
-- Mencatat semua aktivitas event_participants ke activity_logs:
--   - Daftar event (INSERT)
--   - Perubahan status (Registered, Waiting List, Cancelled, Permitted, Absent, dll)
--   - Check-in (check_in_time di-set)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Trigger function: tangani semua perubahan di event_participants
CREATE OR REPLACE FUNCTION public.trigger_log_event_participant_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_title TEXT;
    v_user_name   TEXT;
    v_action      TEXT;
    v_details     JSONB;
BEGIN
    -- Ambil judul event dan nama user untuk konteks yang readable
    SELECT title INTO v_event_title FROM events WHERE id = COALESCE(NEW.event_id, OLD.event_id);
    SELECT full_name INTO v_user_name FROM profiles WHERE id = COALESCE(NEW.user_id, OLD.user_id);

    IF TG_OP = 'INSERT' THEN
        -- Daftar event baru
        v_action  := 'EVENT_REGISTER';
        v_details := jsonb_build_object(
            'event_id',       NEW.event_id,
            'event_title',    v_event_title,
            'user_id',        NEW.user_id,
            'user_name',      v_user_name,
            'status',         NEW.status,
            'waitlist_reason', NEW.waitlist_reason
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Check-in
        IF OLD.check_in_time IS NULL AND NEW.check_in_time IS NOT NULL THEN
            v_action  := 'EVENT_CHECKIN';
            v_details := jsonb_build_object(
                'event_id',    NEW.event_id,
                'event_title', v_event_title,
                'user_id',     NEW.user_id,
                'user_name',   v_user_name,
                'check_in_time', NEW.check_in_time
            );

        -- Perubahan status (WL naik, batal, izin, dll)
        ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
            v_action  := 'EVENT_STATUS_CHANGE';
            v_details := jsonb_build_object(
                'event_id',    NEW.event_id,
                'event_title', v_event_title,
                'user_id',     NEW.user_id,
                'user_name',   v_user_name,
                'old_status',  OLD.status,
                'new_status',  NEW.status,
                'waitlist_reason', NEW.waitlist_reason
            );

        ELSE
            -- Perubahan lain (tidak relevan untuk di-log)
            RETURN NEW;
        END IF;
    END IF;

    -- Tulis ke activity_logs
    -- actor: user itu sendiri (self-action) atau admin yang trigger dari server
    INSERT INTO public.activity_logs (user_id, action, details)
    VALUES (COALESCE(NEW.user_id, OLD.user_id), v_action, v_details);

    RETURN NEW;
END;
$$;

-- Pasang trigger ke event_participants
DROP TRIGGER IF EXISTS on_event_participant_change_log ON public.event_participants;

CREATE TRIGGER on_event_participant_change_log
    AFTER INSERT OR UPDATE ON public.event_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_log_event_participant_changes();

-- ============================================================
-- Update get_activity_logs RPC agar bisa search berdasarkan:
-- - nama/email actor (sudah ada)
-- - nama event (baru)
-- - nama target user di details (baru)
-- ============================================================
DROP FUNCTION IF EXISTS public.get_activity_logs(text);

CREATE OR REPLACE FUNCTION public.get_activity_logs(
    search_text text DEFAULT NULL
)
RETURNS TABLE (
    id          uuid,
    action      text,
    actor_name  text,
    actor_email text,
    details     jsonb,
    created_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Access Denied: Superadmin Only';
    END IF;

    RETURN QUERY
    SELECT
        l.id,
        l.action,
        p.full_name  AS actor_name,
        p.email      AS actor_email,
        l.details,
        l.created_at
    FROM public.activity_logs l
    LEFT JOIN public.profiles p ON l.user_id = p.id
    WHERE
        CASE
            WHEN search_text IS NOT NULL AND search_text <> '' THEN
                -- Cari di nama/email actor
                p.full_name  ILIKE '%' || search_text || '%'
                OR p.email   ILIKE '%' || search_text || '%'
                -- Cari di dalam details JSONB (event title, user name, email)
                OR l.details::text ILIKE '%' || search_text || '%'
            ELSE TRUE
        END
    ORDER BY l.created_at DESC
    LIMIT 200; -- Naikkan dari 100 ke 200
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_activity_logs(text) TO authenticated;

-- Verifikasi trigger terpasang
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_event_participant_change_log';
