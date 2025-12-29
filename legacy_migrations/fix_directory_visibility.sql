-- FIX: Show ALL members EXCEPT Pending
-- Replaces previous logic to be more inclusive (Active, suspended, nulls, etc are visible)

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
  where account_status IS DISTINCT FROM 'Pending' -- SHOW EVERYTHING EXCEPT PENDING
  order by full_name asc;
$$;

-- Grant execution again just to be sure
grant execute on function public.get_directory_members to authenticated;
