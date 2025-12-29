-- Migration to exclude 'Pending' status users from Directory and Admin User Management

-- 1. UPDATE: PUBLIC DIRECTORY
-- Now strictly requires account_status = 'Active' (was commented out before)
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
    id, full_name, generation, photo_url, linkedin_url,
    university, major, company_name, job_position
  from profiles
  where account_status = 'Active'
  order by full_name asc;
$$;

-- 2. UPDATE: ADMIN USERS LIST
-- Exclude 'Pending' users because they are handled in the 'Verification' page.
-- 'Active' and 'Blocked' users remain visible here.
create or replace function public.get_all_profiles_for_admin()
returns setof profiles
language sql
security definer
stable
as $$
  -- Only admins can run this
  select *
  from profiles
  where public.is_admin_check() = true
  and account_status != 'Pending'
  order by created_at desc;
$$;
