-- RPC to get active alumni count for Public Landing Page
-- Security Definer allows it to bypass RLS to count rows, but only returns a single integer.

create or replace function public.get_active_alumni_count()
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer
  from profiles
  where account_status = 'Active';
$$;

-- Grant execute to anon (public) and authenticated users
grant execute on function public.get_active_alumni_count() to anon, authenticated, service_role;
