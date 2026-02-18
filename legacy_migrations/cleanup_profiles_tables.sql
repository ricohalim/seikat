-- cleanup_profiles_tables.sql

-- Drop views/tables if they exist, cascading to triggers
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP TABLE IF EXISTS public.public_profiles CASCADE;

DROP VIEW IF EXISTS public.profiles_lookup CASCADE;
DROP TABLE IF EXISTS public.profiles_lookup CASCADE;

-- Also try the name from the error message
DROP VIEW IF EXISTS public.profiles_public CASCADE;
DROP TABLE IF EXISTS public.profiles_public CASCADE;

-- If there are specific triggers left on 'profiles' that fail, we might need to find them.
-- Use a safely guarded block to drop known potential triggers if they aren't removed by CASCADE.
DROP TRIGGER IF EXISTS on_profile_update_public ON public.profiles;
DROP TRIGGER IF EXISTS sync_profiles_public ON public.profiles;

-- Ensure 'profiles' is healthy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
