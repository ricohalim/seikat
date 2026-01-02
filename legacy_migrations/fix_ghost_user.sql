-- FIX Ghost User: Delete from Auth.Users
-- Run this ONLY if the user is missing from 'profiles' but exists in 'auth.users'.

DO $$
DECLARE
    v_email TEXT := 'tanfeliii19@gmail.com';
    v_user_id UUID;
BEGIN
    -- Find ID in Auth
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User % not found in auth.users. Nothing to delete.', v_email;
        RETURN;
    END IF;

    -- Safety Check: Ensure no profile exists
    PERFORM 1 FROM public.profiles WHERE id = v_user_id;
    IF FOUND THEN
        RAISE NOTICE 'STOP! User % has a valid profile. Do not delete via this script.', v_email;
        RETURN;
    END IF;

    -- Delete from Auth (this will cascade if configured, but likely safe if no profile)
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Ghost user % (ID: %) has been DELETED from auth.users.', v_email, v_user_id;
    RAISE NOTICE 'User should now be able to register again.';
END;
$$;
