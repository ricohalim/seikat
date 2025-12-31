-- Mencari Member ID yang 'longkap' (missing)
-- Start dari: DBP01000001 (Angka: 1000001)

WITH existing_ids AS (
    SELECT CAST(SUBSTRING(member_id, 4) AS BIGINT) as num
    FROM profiles
    WHERE member_id LIKE 'DBP%' 
    AND member_id ~ '^DBP\d+$' -- Validasi format angka
),
stats AS (
    -- Kita set start awal sesuai request user
    SELECT 1000001 as start_num, MAX(num) as max_id 
    FROM existing_ids
)
SELECT 
    'DBP' || LPAD(s.i::text, 8, '0') as missing_member_id
FROM stats,
     generate_series(stats.start_num, stats.max_id) s(i)
WHERE NOT EXISTS (
    SELECT 1 FROM existing_ids WHERE num = s.i
);
