-- BULK PASSWORD RESET SCRIPT
-- Reset password menjadi '123123' untuk range Member ID: DBP02000080 s.d DBP02000918

-- Pastikan extension crypto aktif untuk hashing password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Lakukan Update
UPDATE auth.users
SET encrypted_password = crypt('123123', gen_salt('bf'))
FROM public.profiles p
WHERE auth.users.id = p.id
AND p.member_id >= 'DBP02000080' 
AND p.member_id <= 'DBP02000918';
