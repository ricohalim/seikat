-- Patch: tambah universitas yang missing dari seed awal + fix nama salah
-- Jalankan di Supabase SQL Editor

-- Tambah yang missing
INSERT INTO master_universities (name) VALUES
('UNIVERSITAS INDONESIA'),
('UNIVERSITAS GADJAH MADA'),
('UNIVERSITAS SEBELAS MARET'),
('UNIVERSITAS PELITA HARAPAN'),
('UNIVERSITAS TELKOM'),
('UNIVERSITAS PERTAMINA'),
('UNIVERSITAS MULTIMEDIA NUSANTARA')
ON CONFLICT (name) DO NOTHING;

-- Fix nama salah: "UNIVERSITAS NEGERI SEBELAS MARET" → hapus jika duplikat dengan yang baru
-- (UNS bukan LPTK, tidak berhak menyandang "Negeri" dalam konteks ini)
DELETE FROM master_universities
WHERE name = 'UNIVERSITAS NEGERI SEBELAS MARET'
  AND EXISTS (
    SELECT 1 FROM master_universities WHERE name = 'UNIVERSITAS SEBELAS MARET'
  );
