-- POLICY: Super Admins can SELECT ALL profiles
-- This fixes the issue where User Management list is incomplete.

create policy "Super Admins can view all profiles"
on profiles
for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'superadmin'
  )
);

-- POLICY: Members/Admins can view Active profiles (for Directory)
create policy "Members can view active profiles"
on profiles
for select
using (
  auth.role() = 'authenticated' AND account_status = 'Active'
);
