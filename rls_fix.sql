-- RPC FIX (Best Practice for Public Data vs RLS)
-- Views still respect the underlying table's RLS. If we restrict table access to "Owner Only", the View becomes empty for others.
-- SOLUTION: Use a Secure Function (RPC) to fetch directory data.

-- 1. Create the RPC Function
create or replace function get_directory_members()
returns table (
  id uuid,
  full_name text,
  generation text,
  photo_url text,
  linkedin_url text,
  university text,
  major text,
  company_name text,
  job_position text
) 
language sql
security definer -- This runs with Admin privileges, BYPASSING RLS
stable
as $$
  select 
    id,
    full_name,
    generation,
    photo_url,
    linkedin_url,
    university,
    major,
    company_name,
    job_position
  from profiles
  where account_status = 'Active' -- Only show active members
  order by full_name asc;
$$;

-- 2. Clean up previous attempts (Optional but good for hygiene)
drop view if exists public_profiles_view;

-- 3. Ensure Strict RLS on Profiles (Keep your data safe)
alter table profiles enable row level security;

-- Remove old permissive policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Members can view active profiles" on profiles;

-- Ensure these 2 Main Policies exist:
-- A. Users see only their own data
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
on profiles for select
using ( auth.uid() = id );

-- B. Admins see everything
drop policy if exists "Super Admin Access" on profiles;
create policy "Super Admin Access"
on profiles for all
using ( 
  -- Check if user is admin/superadmin (using our helper function from before)
  (select role from profiles where id = auth.uid()) in ('admin', 'superadmin')
);
