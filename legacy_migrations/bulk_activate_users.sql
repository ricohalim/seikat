-- 1. CEK JUMLAH DATA PER STATUS (Jalankan ini dulu untuk melihat kondisi)
-- SELECT account_status, COUNT(*) FROM profiles GROUP BY account_status;


-- 2. OPSIONAL: BULK ACTIVATE (Hanya jika ingin mengaktifkan SEMUA Pendings)
-- Hati-hati: Ini akan memberi akses login & direktori ke semua user Pending.

UPDATE profiles 
SET account_status = 'Active' 
WHERE account_status = 'Pending';
-- AND member_id IS NOT NULL; -- (Opsional: Hanya yang punya Member ID)

-- 3. VERIFIKASI LAGI
-- SELECT account_status, COUNT(*) FROM profiles GROUP BY account_status;
