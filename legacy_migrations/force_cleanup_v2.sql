-- force_cleanup_v2.sql

-- 1. Try to drop as Materialized View (just in case)
DROP MATERIALIZED VIEW IF EXISTS public.profiles_public CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.public_profiles CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.profiles_lookup CASCADE;

-- 2. Try to drop as Foreign Table
DROP FOREIGN TABLE IF EXISTS public.profiles_public CASCADE;

-- 3. Try to drop as Table again
DROP TABLE IF EXISTS public.profiles_public CASCADE;
DROP TABLE IF EXISTS public.public_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles_lookup CASCADE;

-- 4. Dynamic Trigger Cleanup
-- Find any triggers on 'profiles' that mention 'profiles_public' or 'public_profiles' and drop them.
DO $$
DECLARE
    t_rec RECORD;
BEGIN
    FOR t_rec IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'profiles' 
        AND event_object_schema = 'public'
    LOOP
        -- We just drop ALL triggers on profiles that are not system triggers? 
        -- No, that's dangerous.
        -- Let's try to identify them by name pattern or content.
        -- Since we can't easily see content here without pg_proc join, 
        -- let's drop specific known suspects if the CASCADE above didn't catch them.
        
        IF t_rec.trigger_name IN ('on_profile_update_public', 'sync_profiles_public', 'sync_profile_to_public') THEN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(t_rec.trigger_name) || ' ON public.profiles';
        END IF;
    END LOOP;
END $$;

-- 5. Force Drop Triggers by Name (if dynamic block missed)
DROP TRIGGER IF EXISTS "on_profile_update_public" ON public.profiles;
DROP TRIGGER IF EXISTS "sync_profiles_public" ON public.profiles;
DROP TRIGGER IF EXISTS "sync_profile_to_public" ON public.profiles;

-- 6. Ensure Base Table RLS is clean
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
