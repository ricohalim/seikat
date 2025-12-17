-- ROBUST RLS FIX (Security Definer Functions) + SECURE VIEW
-- This approach prevents "Infinite Recursion" AND protects sensitive data (PII).

-- 1. Create Helper Functions (Bypass RLS)
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role = 'superadmin'
  );
$$;

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

-- 2. Reset Policies on PROFILES (Restrictive)
alter table profiles enable row level security;

-- Drop all existing 'permissive' policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Super Admins can view all profiles" on profiles;
drop policy if exists "Super Admin Access" on profiles;
drop policy if exists "Members can view active profiles" on profiles;

-- STRICT POLICIES:
-- A. VIEW/UPDATE OWN (Users see EVERYTHING only for themselves)
create policy "Users can view own profile"
on profiles for select
using ( auth.uid() = id );

create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );

-- B. ADMIN FULL ACCESS (Admins see EVERYTHING)
create policy "Super Admin Access"
on profiles for all
using ( public.is_admin() );

-- 3. Create SECURE VIEW for Directory (Hides PII like Phone/Email)
drop view if exists public_profiles_view;

create view public_profiles_view as
select 
  id,
  full_name,
  generation,
  photo_url,
  linkedin_url,
  university,
  major,
  company_name,
  job_position,
  account_status
from profiles
where account_status = 'Active';

-- Grant access to the view
grant select on public_profiles_view to authenticated;
grant select on public_profiles_view to service_role;

-- 4. Temp Registration Policies (Admin View)
drop policy if exists "Admins can view temp registrations" on temp_registrations;
drop policy if exists "Admins can update temp registrations" on temp_registrations;

create policy "Admins can view temp registrations"
on temp_registrations for select
using ( public.is_admin() );

create policy "Admins can update temp registrations"
on temp_registrations for update
using ( public.is_admin() );
