-- Mencari ID yang 'longkap' (missing/skipped) di tabel master_universities
-- Ini terjadi biasanya karena ada DELETE atau FAILED INSERT.

SELECT s.i AS missing_id
FROM generate_series(
       (SELECT MIN(id) FROM master_universities),
       (SELECT MAX(id) FROM master_universities)
     ) s(i)
WHERE NOT EXISTS (SELECT 1 FROM master_universities WHERE id = s.i);
