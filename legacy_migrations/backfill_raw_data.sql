-- Backfill script to sync raw_data from temp_registrations to profiles
-- needed for members verified BEFORE the code fix was applied.

UPDATE profiles p
SET
    -- Basic Sync
    full_name = COALESCE(p.full_name, t.raw_data->>'full_name'),
    phone = COALESCE(p.phone, t.raw_data->>'whatsapp'),
    
    -- Academic
    university = t.raw_data->>'university',
    major = t.raw_data->>'major',
    generation = t.raw_data->>'generation',
    
    -- Personal
    gender = t.raw_data->>'gender',
    birth_place = t.raw_data->>'birth_place',
    birth_date = (NULLIF(t.raw_data->>'birth_date', ''))::date,
    domicile_city = t.raw_data->>'domicile_city',
    domicile_province = t.raw_data->>'domicile_province',
    linkedin_url = t.raw_data->>'linkedin_url',
    
    -- Job
    job_position = t.raw_data->>'job_position',
    company_name = t.raw_data->>'company_name',
    industry_sector = t.raw_data->>'industry_sector'

FROM temp_registrations t
WHERE p.email = t.email;

-- Output checking
SELECT count(*) as updated_count FROM profiles WHERE university IS NOT NULL;
