-- Enforce Hybrid Uppercase Strategy on Existing Data
-- RUN THIS SCRIPT TO FIX EXISTING RECORDS

BEGIN;

-- 1. IDENTITY & ACADEMIC
UPDATE profiles SET
    full_name = UPPER(full_name),
    birth_place = UPPER(birth_place),
    university = UPPER(university),
    -- current_university = UPPER(current_university), -- Uncomment if column exists
    faculty = UPPER(faculty),
    major = UPPER(major);

-- 2. JOB & PROFESSIONAL
UPDATE profiles SET
    job_position = UPPER(job_position),
    company_name = UPPER(company_name),
    industry_sector = UPPER(industry_sector);

-- 3. DOMICILE (LOCATION)
UPDATE profiles SET
    domicile_province = UPPER(domicile_province),
    domicile_city = UPPER(domicile_city),
    domicile_country = UPPER(domicile_country);

-- 4. BUSINESS (ENTREPRENEURSHIP)
UPDATE profiles SET
    business_name = UPPER(business_name),
    business_field = UPPER(business_field),
    business_position = UPPER(business_position),
    business_location = UPPER(business_location);

-- NOTE:
-- Hobbies, Interests, Business Description, and Bio are PRESERVED (Not uppercased).
-- Email and URL fields are PRESERVED (Lowercase recommended).

COMMIT;
