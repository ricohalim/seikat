DO $$
DECLARE
    target_email TEXT := 'pratamawilly39@gmail.com';
    user_id UUID;
    temp_reg RECORD;
BEGIN
    -- 1. Ambil ID dari auth.users (harus run sebagai Superuser/Dashboard)
    SELECT id INTO user_id FROM auth.users WHERE email = target_email LIMIT 1;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User dengan email % tidak ditemukan di auth.users. User harus register ulang.', target_email;
    END IF;

    -- 2. Ambil data dari temp_registrations
    SELECT * INTO temp_reg FROM public.temp_registrations 
    WHERE email = target_email 
    ORDER BY submitted_at DESC 
    LIMIT 1;

    IF temp_reg.id IS NULL THEN
         RAISE EXCEPTION 'Data registrasi sementara tidak ditemukan untuk %', target_email;
    END IF;

    -- 3. Insert/Restore ke table Profiles
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        phone, 
        generation, 
        university, 
        major, 
        job_position, 
        company_name, 
        industry_sector,
        domicile_city, 
        domicile_province, 
        linkedin_url,
        gender,
        birth_place,
        birth_date,
        account_status
    )
    VALUES (
        user_id,
        target_email,
        temp_reg.raw_data->>'full_name',
        temp_reg.whatsapp,
        temp_reg.raw_data->>'generation',
        temp_reg.raw_data->>'university',
        temp_reg.raw_data->>'major',
        temp_reg.raw_data->>'job_position',
        temp_reg.raw_data->>'company_name',
        temp_reg.raw_data->>'industry_sector',
        temp_reg.raw_data->>'domicile_city',
        temp_reg.raw_data->>'domicile_province',
        temp_reg.raw_data->>'linkedin_url',
        temp_reg.raw_data->>'gender',
        temp_reg.raw_data->>'birth_place',
        (temp_reg.raw_data->>'birth_date')::date,
        'Pending' -- Set Pending dulu biar bisa di-Approve via Admin Panel normal
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'SUCCESS: Profile untuk % berhasil dipulihkan (Linked ID: %). Silakan refresh Admin Panel.', target_email, user_id;

END $$;
