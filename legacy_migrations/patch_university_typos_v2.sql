-- Patch: Perbaikan typo universitas berdasarkan data aktual
-- Jalankan di Supabase SQL Editor

-- ============================================================
-- STEP 1: Tambah ke master yang masih belum ada
-- ============================================================
INSERT INTO master_universities (name) VALUES
('UNIVERSITAS INDONESIA'),
('UNIVERSITAS SEBELAS MARET'),
('INSTITUT SENI INDONESIA YOGYAKARTA'),
('UNIVERSITAS KOMPUTER INDONESIA'),
('UIN SIBER SYEKH NURJATI CIREBON')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- STEP 2: Set NULL untuk yang tidak bisa dipulihkan
-- ============================================================
UPDATE profiles SET university = NULL
WHERE TRIM(university) = 'LAINNYA';  -- 49 entries: bukan nama universitas


-- ============================================================
-- STEP 3: Fix singkatan
-- ============================================================
UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI SUNAN KALIJAGA'
WHERE TRIM(university) IN (
  'UIN SUNAN KALIJAGA',
  'UNIVERSITAS ISLAM SUNANKALIJAGA YOGYAKARTA'
);

UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI SYARIF HIDAYATULLAH'
WHERE TRIM(university) = 'UIN SYARIF HIDAYATULLAH JAKARTA';

UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI SUNAN AMPEL'
WHERE TRIM(university) = 'UIN SUNAN AMPEL SURABAYA';

UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI SUNAN GUNUNG DJATI'
WHERE TRIM(university) IN (
  'UIN SUNAN GUNUNG DJATI BANDUNG',
  'UNIVERSITAS ISLAM NEGERI SUNAN GUNUNG DJATI BANDUNG'
);

UPDATE profiles SET university = 'UNIVERSITAS ISLAM NEGERI WALISONGO'
WHERE TRIM(university) = 'IAIN WALISONGO SEMARANG';

UPDATE profiles SET university = 'IAIN KUDUS'
WHERE TRIM(university) = 'IAIN KUDUS/UIN SUNAN KUDUS';

UPDATE profiles SET university = 'UIN SIBER SYEKH NURJATI CIREBON'
WHERE TRIM(university) IN (
  'IAIN SYEKH NURJATI CIREBON',
  'STAIN CIREBON (UIN SYEKH NURJATI CIREBON)',
  'UIN SYEKH NURJATI CIREBON'
);

UPDATE profiles SET university = 'UNIVERSITAS DIPONEGORO'
WHERE TRIM(university) = 'UNDIP';

UPDATE profiles SET university = 'UNIVERSITAS NEGERI YOGYAKARTA'
WHERE TRIM(university) = 'UNY';

UPDATE profiles SET university = 'UNIVERSITAS MUHAMMADIYAH MALANG'
WHERE TRIM(university) = 'UMM';

UPDATE profiles SET university = 'UNIVERSITAS PEMBANGUNAN NASIONAL VETERAN YOGYAKARTA'
WHERE TRIM(university) = 'UPN VETERAN YOGYAKARTA';

UPDATE profiles SET university = 'UNIVERSITAS PEMBANGUNAN NASIONAL VETERAN JAWA TIMUR'
WHERE TRIM(university) IN (
  'UPN VETERAN JAWA TIMUR',
  'UNIVERSITAS PEMBANGUNAN NASIONAL VETERAN JAWA'
);

UPDATE profiles SET university = 'UNIVERSITAS KATOLIK SOEGIJAPRANATA'
WHERE TRIM(university) IN (
  'UNIKA SOEGIJAPRANATA SEMARANG',
  'UNIKA SOEGIJAPRANATA'
);


-- ============================================================
-- STEP 4: Fix typo nama
-- ============================================================
UPDATE profiles SET university = 'UNIVERSITAS KATOLIK INDONESIA ATMA JAYA'
WHERE TRIM(university) = 'UNIVERSITAS KATOLIK ATMA JAYA JAKARTA';

UPDATE profiles SET university = 'UNIVERSITAS BORNEO TARAKAN'
WHERE TRIM(university) = 'BORNEO TARAKAN';

UPDATE profiles SET university = 'UNIVERSITAS KHAIRUN'
WHERE TRIM(university) = 'KHAIRUN';

UPDATE profiles SET university = 'INSTITUT TEKNOLOGI SEPULUH NOPEMBER'
WHERE TRIM(university) = 'INSTINSTITUT TEKNOLOGI SEPULUH NOPEMBER';

UPDATE profiles SET university = 'UNIVERSITAS PATTIMURA'
WHERE TRIM(university) = 'UNIVERSITA PATTIMURA';

UPDATE profiles SET university = 'UNIVERSITAS KOMPUTER INDONESIA'
WHERE TRIM(university) = 'UNIVERSITAS KOMPUTER INDINESIA';

UPDATE profiles SET university = 'UNIVERSITAS JEMBER'
WHERE TRIM(university) = 'UNIVERSITAS NEGERI JEMBER';  -- tidak ada "Negeri" di Jember

UPDATE profiles SET university = 'UNIVERSITAS KATOLIK WIDYA MANDALA SURABAYA'
WHERE TRIM(university) = 'UNIVERSITAS WIDYA MANDALA SURABAYA';

UPDATE profiles SET university = 'UNIVERSITAS NAHDATUL ULAMA'
WHERE TRIM(university) = 'UNIVERSITAS NAHDATUL ULAMA YOGYAKARTA';

UPDATE profiles SET university = 'UNIVERSITAS PADJADJARAN'
WHERE TRIM(university) = 'UNIVERISTAS PADJADJARAN';

UPDATE profiles SET university = 'UNIVERSITAS PASUNDAN'
WHERE TRIM(university) = 'UNIPERSITAS PASUNDAN';

UPDATE profiles SET university = 'SEKOLAH TINGGI ILMU EKONOMI YKPN'
WHERE TRIM(university) = 'STIE YKPN YOGYAKARTA';

UPDATE profiles SET university = 'UNIVERSITAS MUHAMMADIYAH KUDUS'
WHERE TRIM(university) = 'UNVIVERSITAS MUHAMMADIYAH KUDUS';

UPDATE profiles SET university = 'UNIVERSITAS JENDERAL SOEDIRMAN'
WHERE TRIM(university) = 'UNUVERSITAS JENDERAL SOEDIRMAN';

UPDATE profiles SET university = 'INSTITUT TEKNOLOGI NASIONAL'
WHERE TRIM(university) = 'INSTITUT TEKNOLOGI NASIONAL BANDUNG';


-- ============================================================
-- STEP 5: Verifikasi sisa yang belum match
-- ============================================================
SELECT 
  TRIM(university) AS university_kotor,
  COUNT(*) AS jumlah_alumni
FROM profiles
WHERE account_status = 'Active'
  AND university IS NOT NULL
  AND TRIM(university) != ''
  AND NOT EXISTS (
    SELECT 1 FROM master_universities
    WHERE name = TRIM(profiles.university)
  )
GROUP BY TRIM(university)
ORDER BY jumlah_alumni DESC;
