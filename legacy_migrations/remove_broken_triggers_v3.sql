-- remove_broken_triggers_v3.sql

DO $$
DECLARE
    t_name text;
    f_name text;
    fn_oid oid;
    fn_src text;
BEGIN
    FOR t_name, f_name IN 
        SELECT tgname, proname 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE tgrelid = 'public.profiles'::regclass
    LOOP
        -- Check function source
        SELECT pg_get_functiondef(to_regproc('public.' || f_name)) INTO fn_src;
        
        -- If the function source mentions the deleted table, drop it.
        IF fn_src ILIKE '%profiles_public%' OR fn_src ILIKE '%public_profiles%' OR fn_src ILIKE '%profiles_lookup%' THEN
            RAISE NOTICE 'Dropping broken trigger % calling %', t_name, f_name;
            
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(t_name) || ' ON public.profiles';
            EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(f_name) || '() CASCADE';
        END IF;
    END LOOP;
END $$;
