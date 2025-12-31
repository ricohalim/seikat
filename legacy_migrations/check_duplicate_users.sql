-- Query untuk mencari user dengan Nama Lengkap yang sama (Case Insensitive)
SELECT 
    UPPER(full_name) as duplicate_name,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails,
    STRING_AGG(id::text, ', ') as ids
FROM profiles
GROUP BY UPPER(full_name)
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Jika ingin melihat detail lengkapnya:
/*
SELECT * FROM profiles 
WHERE UPPER(full_name) IN (
    SELECT UPPER(full_name) 
    FROM profiles 
    GROUP BY UPPER(full_name) 
    HAVING COUNT(*) > 1
)
ORDER BY full_name;
*/
