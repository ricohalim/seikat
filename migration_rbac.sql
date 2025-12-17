-- Migration to add Role-Based Access Control (RBAC)
-- Run this in Supabase SQL Editor

-- 1. Add 'role' column to profiles
alter table profiles 
add column if not exists role text default 'member'; -- 'member', 'admin', 'superadmin'

-- 2. Add 'is_verifier' column (Optional helper, mainly redundant if using role='admin')
-- But requested in context of "Admin (Verifikator)"
alter table profiles
add column if not exists is_verifier boolean default false;

-- 3. Update Policy: Admins can view ALL profiles
-- Existing policy: "Public profiles are viewable by everyone" (already covers viewing)
-- We need a policy for UPDATING/MANAGING profiles (Super Admin only for certain fields)

-- Policy: Only Super Admin or the User themselves can update role (actually user shouldn't update role)
-- We'll rely on server-side checks or secure RLS.

-- Policy: Admin can view temp_registrations (needed for verifier)
-- Currently temp_registrations has RLS but no policy.
create policy "Admins can view all temp registrations"
on temp_registrations
for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role in ('admin', 'superadmin'))
  )
);

-- Policy: Admins can update temp_registrations (Approve/Reject)
create policy "Admins can update temp registrations"
on temp_registrations
for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role in ('admin', 'superadmin'))
  )
);

-- Policy: Admins can delete temp registrations (Cleanup)
create policy "Admins can delete temp registrations"
on temp_registrations
for delete
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and (profiles.role in ('admin', 'superadmin'))
  )
);
