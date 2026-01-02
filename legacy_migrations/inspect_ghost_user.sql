-- Inspect User Status for 'tanfeliii19@gmail.com'
-- Cek keberadaan user di 3 tabel utama.

DO $$
DECLARE
    v_email TEXT := 'tanfeliii19@gmail.com';
    v_auth_id UUID;
    v_profile_id UUID;
    v_temp_id UUID;
BEGIN
    RAISE NOTICE 'Inspecting status for: %', v_email;

    -- 1. Check Auth.Users (Private Schema)
    -- We can Select from auth.users (requires permission)
    SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email;
    
    IF v_auth_id IS NOT NULL THEN
        RAISE NOTICE '[AUTH] User FOUND in auth.users. UUID: %', v_auth_id;
    ELSE
        RAISE NOTICE '[AUTH] User NOT FOUND in auth.users.';
    END IF;

    -- 2. Check Public.Profiles
    SELECT id INTO v_profile_id FROM public.profiles WHERE email = v_email;
    
    IF v_profile_id IS NOT NULL THEN
        RAISE NOTICE '[PROFILE] User FOUND in public.profiles. UUID: %', v_profile_id;
    ELSE
        RAISE NOTICE '[PROFILE] User NOT FOUND in public.profiles.';
    END IF;

    -- 3. Check Temp Registrations
    SELECT id INTO v_temp_id FROM public.temp_registrations WHERE email = v_email;
    
    IF v_temp_id IS NOT NULL THEN
        RAISE NOTICE '[TEMP] User FOUND in temp_registrations. UUID: %', v_temp_id;
    ELSE
        RAISE NOTICE '[TEMP] User NOT FOUND in temp_registrations.';
    END IF;

    -- Diagnosis
    IF v_auth_id IS NOT NULL AND v_profile_id IS NULL THEN
        RAISE NOTICE 'CONCLUSION: Ghost User! Exists in Auth but missing Profile. Need to delete from Auth to allow re-registration.';
    ELSIF v_auth_id IS NOT NULL AND v_profile_id IS NOT NULL THEN
        RAISE NOTICE 'CONCLUSION: Normal User. Maybe typo in Check Status?';
    ELSE
        RAISE NOTICE 'CONCLUSION: Clean. User should be able to register.';
    END IF;
END;
$$;
