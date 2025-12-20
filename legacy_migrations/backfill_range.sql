-- Backfill script specfically for a range of Member IDs
-- Target: DBP02000919 to DBP02000926

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
    birth_date = t.raw_data->>'birth_date',
    domicile_city = t.raw_data->>'domicile_city',
    domicile_province = t.raw_data->>'domicile_province',
    linkedin_url = t.raw_data->>'linkedin_url',
    
    -- Job
    job_position = t.raw_data->>'job_position',
    company_name = t.raw_data->>'company_name',
    industry_sector = t.raw_data->>'industry_sector'

FROM temp_registrations t
WHERE p.email = t.email
AND p.member_id BETWEEN 'DBP02000919' AND 'DBP02000926';

-- Verification output
SELECT member_id, full_name, university, job_position 
FROM profiles 
WHERE member_id BETWEEN 'DBP02000919' AND 'DBP02000926';
