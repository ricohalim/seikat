-- FIX: Manually link Pending User to existing Master Member ID AND Verify Status AND Clear Temp Registration
-- ID: 39c6e628-3d9b-4164-a742-b68b5415f265
-- Target Member ID: DBP01000018

-- 1. Update Profile to Active & Linked
UPDATE profiles
SET 
  member_id = 'DBP01000018',
  account_status = 'Active'
WHERE 
  id = '39c6e628-3d9b-4164-a742-b68b5415f265';

-- 2. Update Temp Registration to 'Approved' so it disappears from Pending List
-- (Assuming the ID in temp_registrations matches or we find by email if ID is different)
UPDATE temp_registrations
SET status = 'Approved'
WHERE email = 'hetrooutlet2005@gmail.com'; 
