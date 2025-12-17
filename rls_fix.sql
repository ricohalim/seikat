-- ABSOLUTE FINAL FIX (Simplified)

-- 1. Helper Function (Admin Check only)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('admin', 'superadmin')
  );
$$;

-- 2. Directory RPC (Keep this, it works well)
create or replace function public.get_directory_members()
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
security definer
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
  where account_status = 'Active'
  order by full_name asc;
$$;

-- 3. RESET EVERYTHING ON PROFILES
alter table profiles enable row level security;

-- Drop ALL policies to be safe
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Members can view active profiles" on profiles;
drop policy if exists "Super Admin Access" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can update users" on profiles;

-- 4. RE-APPLY POLICIES (Simple & Robust)

-- A. USER ACCESS (The most critical one for Dashboard)
-- Simple ID check. No subqueries. No recursion possible.
create policy "Users can view own profile"
on profiles for select
using ( auth.uid() = id );

create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );

-- B. ADMIN ACCESS (Uses is_admin helper)
create policy "Super Admin Access"
on profiles for all
using ( public.is_admin() );

-- 5. GRANTS (Ensure 'authenticated' role actually has permission to select)
grant select, update on table profiles to authenticated;
grant select on table profiles to service_role;
