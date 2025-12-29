-- FIX: STANDARDIZE ACCOUNT STATUS
-- Problem: Data mixed between 'Active' (English) and 'Aktif' (Indonesian).
-- Solution: Standardize everything to 'Active' to match system logic.

BEGIN;

-- 1. Migrate 'Aktif' -> 'Active'
UPDATE profiles 
SET account_status = 'Active' 
WHERE account_status = 'Aktif';

-- 2. Migrate 'pending' (lowercase) -> 'Pending' (Capitalized) just in case
UPDATE profiles 
SET account_status = 'Pending' 
WHERE account_status = 'pending';

COMMIT;

-- VERIFICATION
-- SELECT account_status, COUNT(*) FROM profiles GROUP BY account_status;
