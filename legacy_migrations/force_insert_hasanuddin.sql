-- Force Insert just in case it was skipped
INSERT INTO master_universities (name) 
VALUES ('UNIVERSITAS HASANUDDIN')
ON CONFLICT (name) DO NOTHING;

-- Check if it exists now
SELECT * FROM master_universities WHERE name = 'UNIVERSITAS HASANUDDIN';
