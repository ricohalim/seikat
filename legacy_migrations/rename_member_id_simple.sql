-- Rename Member ID (Simple)
-- Use this if 'DBP01000070' does NOT exist yet.

UPDATE profiles 
SET member_id = 'DBP01000070' 
WHERE member_id = 'DBP02000744';

-- If you get a "duplicate key value violates unique constraint" error,
-- it means 'DBP01000070' ALREADY EXISTS.
-- In that case, you MUST use the merge script (merge_user_data_dbp.sql).
