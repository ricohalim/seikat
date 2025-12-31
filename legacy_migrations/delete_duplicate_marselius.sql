-- PENTING: Pilih SALAH SATU command di bawah ini (Hapus tanda -- di depan baris DELETE)
-- Tergantung email mana yang ingin ANDA HAPUS.

-- OPSI 1: Hapus yang emailnya 'marselius.aronggear19@gmail.com'
-- DELETE FROM profiles WHERE email = 'marselius.aronggear19@gmail.com';

-- OPSI 2: Hapus yang emailnya 'aronggear.marselius19@gmail.com'
-- DELETE FROM profiles WHERE email = 'aronggear.marselius19@gmail.com';

-- Command Cek Data (Untuk memastikan sisa tinggal 1)
SELECT email, full_name, phone, job_current_role FROM profiles WHERE full_name ILIKE '%Marselius Aronggear%';
