-- Query to find users who likely have titles (Gelar) in their names
-- Patterns looked for:
-- 1. Contains a comma (",") - usually separates name from suffix titles (e.g. ", S.Kom")
-- 2. Starts with a word ending in "." (e.g. "Dr. ", "Ir. ") - common for prefix titles
-- 3. Excludes common single initials if possible (optional, but kept simple here)

SELECT 
    id,
    email,
    full_name,
    CASE 
        WHEN full_name LIKE '%,%' THEN 'Has Suffix (Back)'
        WHEN full_name ~ '^[A-Za-z]{2,}\.' THEN 'Has Prefix (Front)'
        ELSE 'Potential Title'
    END as potential_type
FROM 
    profiles
WHERE 
    full_name LIKE '%,%'  -- Comma is a strong indicator of suffix titles
    OR full_name ~ '^[A-Za-z]{2,}\.' -- Starts with 2+ chars followed by dot (e.g. Dr., Ir.) to avoid "M. Yamin" single letter initials
ORDER BY 
    full_name;

-- Summary Count
SELECT 
    COUNT(*) as count_with_titles
FROM 
    profiles
WHERE 
    full_name LIKE '%,%' 
    OR full_name ~ '^[A-Za-z]{2,}\.';
