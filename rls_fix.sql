-- FINAL RLS FIX: PREVENT RECURSION & SECURE DATA

-- 1. Helper Functions (Security Definer = Bypass RLS)
-- We MUST use these in policies to avoid infinite loops (Recursion).
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

-- 2. Reset Policies
alter table profiles enable row level security;

-- Drop problematic policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Members can view active profiles" on profiles;
drop policy if exists "Super Admin Access" on profiles;
drop policy if exists "Users can view own profile" on profiles;

-- 3. Apply Correct Policies

-- A. USER OWN ACCESS (No Recursion: straight ID check)
create policy "Users can view own profile"
on profiles for select
using ( auth.uid() = id );

create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );

-- B. ADMIN ACCESS (Uses is_admin() to avoid Recursion)
create policy "Super Admin Access"
on profiles for all
using ( public.is_admin() );

-- 4. Grant access to RPC
grant execute on function public.get_directory_members to authenticated;
grant execute on function public.get_directory_members to service_role;
grant execute on function public.is_admin to authenticated;
grant execute on function public.is_admin to service_role;
