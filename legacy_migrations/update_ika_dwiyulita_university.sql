-- 1. Verifikasi user sebelum update (Pastikan hanya 1 user yang muncul)
SELECT id, email, full_name, university 
FROM profiles 
WHERE full_name ILIKE '%Ika Dwiyulita%';

-- 2. Lakukan Update
UPDATE profiles
SET university = 'UNIVERSITAS HASANUDDIN'
WHERE full_name ILIKE '%Ika Dwiyulita%';

-- 3. Verifikasi setelah update
SELECT id, email, full_name, university 
FROM profiles 
WHERE full_name ILIKE '%Ika Dwiyulita%';
