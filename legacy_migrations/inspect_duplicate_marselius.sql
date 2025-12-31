-- Cek detail kedua user untuk menentukan mana yang harus dihapus
SELECT 
    id, 
    email, 
    full_name, 
    created_at, 
    last_sign_in_at, 
    job_current_role, 
    university 
FROM profiles 
WHERE full_name ILIKE '%Marselius Aronggear%';
