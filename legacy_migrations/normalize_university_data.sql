-- Normalisasi data profiles.university
-- Jalankan di Supabase SQL Editor
-- Memetakan semua variasi kotor ke nama kanonik di master_universities

-- ============================================================
-- STEP 1: Tambah ke master_universities yang belum ada
-- ============================================================
INSERT INTO master_universities (name) VALUES
('UNIVERSITAS LANGLANGBUANA'),
('UNIVERSITAS ISLAM NUSANTARA'),
('UNIVERSITAS MUHAMMADIYAH SURAKARTA'),
('UNIVERSITAS 17 AGUSTUS 1945 SEMARANG'),
('UIN SIBER SYEKH NURJATI CIREBON'),
('INSTITUT KESEHATAN RAJAWALI BANDUNG')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- STEP 2: Set NULL untuk data yang tidak bisa dipulihkan
-- ============================================================
UPDATE profiles SET university = NULL
WHERE TRIM(university) IN (
  'UNIVERSITAS',     -- hanya kata "universitas" tanpa nama
  'SEMARANG',        -- hanya nama kota
  'UNIVERSITAS SULTA', -- terpotong, tidak jelas
  'UNIVERSITAS KATOLIK WI' -- terpotong, ambigu
)
OR university = ''
OR TRIM(university) = '';


-- ============================================================
-- STEP 3: Normalisasi singkatan
-- ============================================================
UPDATE profiles SET university = 'UNIVERSITAS MURIA KUDUS'
WHERE TRIM(university) = 'UMK';

UPDATE profiles SET university = 'UNIVERSITAS NEGERI GORONTALO'
WHERE TRIM(university) IN ('UNG', 'UNIVERSITASNEGERIGORONTALO');

UPDATE profiles SET university = 'UNIVERSITAS KATOLIK PARAHYANGAN'
WHERE TRIM(university) = 'UNPAR';

UPDATE profiles SET university = 'UNIVERSITAS KATOLIK INDONESIA ATMA JAYA'
WHERE TRIM(university) = 'UNIKA ATMA JAYA';

UPDATE profiles SET university = 'IAIN KUDUS'
WHERE TRIM(university) IN ('UIN SUNAN KUDUS', 'UIN KUDUS', 'STAIN KUDUS');

UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI SUNAN KALIJAGA'
WHERE TRIM(university) = 'UIN SUNAN KALIJAGA YOGYAKARTA';

UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI WALISONGO'
WHERE TRIM(university) = 'UIN WALISONGO SEMARANG';

UPDATE profiles SET university = 'UIN SIBER SYEKH NURJATI CIREBON'
WHERE TRIM(university) IN ('UIN SIBER SYEKH NURJATI CIREBON');


-- ============================================================
-- STEP 4: Normalisasi typo & nama terpotong
-- ============================================================
UPDATE profiles SET university = 'UNIVERSITAS JENDERAL SOEDIRMAN'
WHERE TRIM(university) = 'UNIVERSITAN JENDERAL SOEDIRMAN';

UPDATE profiles SET university = 'UNIVERSITAS NEGERI YOGYAKARTA'
WHERE TRIM(university) = 'UNIVERSITAS NEGERI YOGYA';

UPDATE profiles SET university = 'UNIVERSITAS MUHAMMADIYAH JEMBER'
WHERE TRIM(university) = 'UNIVERSITAS MUHAMMADIYAH J EMBER';

UPDATE profiles SET university = 'UNIVERSITAS ISLAM BANDUNG'
WHERE TRIM(university) = 'UNISVERSITAS ISLAM BANDUNG';

UPDATE profiles SET university = 'INSTITUT TEKNOLOGI SEPULUH NOPEMBER'
WHERE TRIM(university) = 'INSTITUT TEKNILOGI SEPULUH NOPEMBER';

UPDATE profiles SET university = 'UNIVERSITAS DIPONEGORO'
WHERE TRIM(university) = 'DIPONEGORO';

UPDATE profiles SET university = 'UNIVERSITAS NAHDATUL ULAMA'
WHERE TRIM(university) IN ('UNIVERSITAS NAHDHATUL ULAMA', 'UNIVERSITAS NAHDATUL ULAMA');

UPDATE profiles SET university = 'UNIVERSITAS SAM RATULANGI'
WHERE TRIM(university) IN ('SAM RATULAMGI', 'SAM RATULANGI');

UPDATE profiles SET university = 'UNIVERSITAS SWADAYA GUNUNG JATI'
WHERE TRIM(university) IN (
  'UNIVERSITAS SWADAYA GUNUNG DJATI CIREBON',
  'UNIVERSITAS SWADAYA GUNUNG DJATI',
  'UNIVERSITAS SWADAYA GUNUNG JATI CIREBON'
);

UPDATE profiles SET university = 'SEKOLAH TINGGI ILMU EKONOMI MALANGKUCECWARA'
WHERE TRIM(university) = 'STIE MALANGKUCECWARA';

UPDATE profiles SET university = 'UNIVERSITAS BRAWIJAYA'
WHERE TRIM(university) = 'BRAWIJAYA';

UPDATE profiles SET university = 'UNIVERSITAS GADJAH MADA'
WHERE TRIM(university) IN (
  'UNIVERSITAS GADJAHMADA YOGYAKARTA',
  'UNIVERSITAS GADJAH MADA YOGYAKARTA'
);

UPDATE profiles SET university = 'UNIVERSITAS CENDRAWASIH'
WHERE TRIM(university) IN ('UNIVERSITAS CENDERAWASIH', 'UNIVERSITAS CENDRAWASIH');

UPDATE profiles SET university = 'UNIVERSITAS 17 AGUSTUS 1945 SEMARANG'
WHERE TRIM(university) = 'UNIVERSITAS 17 AGUSTUS 1045 SEMARANG';


-- ============================================================
-- STEP 5: Normalisasi suffix kota berlebih
-- ============================================================
UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI SUNAN KALIJAGA'
WHERE TRIM(university) = 'UNIVERSITAS ISLAM NEGERI SUNAN KALIJAGA YOGYAKARTA';

UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI SUNAN AMPEL'
WHERE TRIM(university) = 'UNIVERSITAS ISLAM NEGERI SUNAN AMPEL SURABAYA';

UPDATE profiles SET university = 'UNIVERSITAS TRUNOJOYO'
WHERE TRIM(university) = 'UNIVERSITAS TRUNOJOYO MADURA';

UPDATE profiles SET university = 'UNIVERSITAS PALANGKARAYA'
WHERE TRIM(university) IN ('UNIVERSITAS PALANGKA RAYA', 'UNIVERSITAS PALANGKA RAYA');

UPDATE profiles SET university = 'UNIVERSITAS NASIONAL KARANGTURI SEMARANG'
WHERE TRIM(university) = 'UNIVERSITAS NASIONAL KARANGTURI';

UPDATE profiles SET university = 'UNIVERSITAS MERDEKA'
WHERE TRIM(university) = 'UNIVERSITAS MERDEKA MALANG';

UPDATE profiles SET university = 'INSTITUT SENI INDONESIA YOGYAKARTA'
WHERE TRIM(university) = 'INSTITUT SENI INDONESIA';


-- ============================================================
-- STEP 6: TRIM semua trailing/leading space (jalankan terakhir)
-- ============================================================
UPDATE profiles
SET university = TRIM(university)
WHERE university IS NOT NULL
  AND university != TRIM(university);


-- ============================================================
-- STEP 7: Verifikasi hasil — cek yang masih belum match master
-- ============================================================
SELECT DISTINCT p.university, COUNT(*) as jumlah_alumni
FROM profiles p
WHERE p.account_status = 'Active'
  AND p.university IS NOT NULL
  AND TRIM(p.university) != ''
  AND NOT EXISTS (
    SELECT 1 FROM master_universities mu
    WHERE mu.name = TRIM(p.university)
  )
GROUP BY p.university
ORDER BY jumlah_alumni DESC;
