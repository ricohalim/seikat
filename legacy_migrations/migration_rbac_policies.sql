-- ROBUST RLS FIX (Security Definer Functions)
-- This approach prevents "Infinite Recursion" by isolating the Role Check from RLS.

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

-- 2. Reset Policies
alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Super Admins can view all profiles" on profiles;
drop policy if exists "Super Admins can select all" on profiles;
drop policy if exists "Super Admins can update all" on profiles;
drop policy if exists "Super Admin Access" on profiles;
drop policy if exists "Members can view active profiles" on profiles;
drop policy if exists "Admins can update users" on profiles;

-- 3. Create Simplified Policies using Functions

-- A. VIEW OWN
create policy "Users can view own profile"
on profiles for select
using ( auth.uid() = id );

-- B. UPDATE OWN
create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );

-- C. VIEW ACTIVE MEMBERS (Directory)
-- Only for authenticated users who are Active themselves (optional constraint)
create policy "Members can view active profiles"
on profiles for select
using (
  auth.role() = 'authenticated' 
  AND account_status = 'Active'
);

-- D. SUPER ADMIN FULL ACCESS
create policy "Super Admin Access"
on profiles for all
using ( public.is_super_admin() );

-- 4. Temp Registration Policies (Admin View)
drop policy if exists "Admins can view temp registrations" on temp_registrations;
drop policy if exists "Admins can update temp registrations" on temp_registrations;

create policy "Admins can view temp registrations"
on temp_registrations for select
using ( public.is_admin() );

create policy "Admins can update temp registrations"
on temp_registrations for update
using ( public.is_admin() );
