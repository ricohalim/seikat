-- SOLUSI FINAL & BERSIH: SEPARATE & CONQUER
-- Script ini menggantikan semua policy sebelumnya untuk menjamin tidak ada konflik.

-- ==========================================
-- 1. HELPER: ADMIN CHECK (Robust & Case Insensive)
-- ==========================================
create or replace function public.is_admin_check()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and lower(role) in ('admin', 'superadmin')
  );
$$;

-- ==========================================
-- 2. RPC: PUBLIC DIRECTORY (Bypass RLS, Safe Data)
-- ==========================================
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
  -- where account_status = 'Active' -- Filter dimatikan untuk debugging
  order by full_name asc;
$$;

-- ==========================================
-- 3. RPC: ADMIN USERS LIST (Bypass RLS, Full Data)
-- ==========================================
create or replace function public.get_all_profiles_for_admin()
returns setof profiles
language sql
security definer
stable
as $$
  -- Hanya boleh dijalankan jika user adalah admin
  select *
  from profiles
  where public.is_admin_check() = true
  order by created_at desc;
$$;

-- ==========================================
-- 4. RPC: ADMIN UPDATE PROFILE (Impersonation/Help)
-- ==========================================
create or replace function public.admin_update_profile(
    target_user_id uuid,
    new_data jsonb
)
returns void
language plpgsql
security definer
as $$
begin
    if public.is_admin_check() = false then
        raise exception 'Access Denied: Only Admins can update other profiles.';
    end if;

    update profiles
    set
        full_name = coalesce((new_data->>'full_name'), full_name),
        phone = coalesce((new_data->>'phone'), phone),
        generation = coalesce((new_data->>'generation'), generation),
        university = coalesce((new_data->>'university'), university),
        major = coalesce((new_data->>'major'), major),
        company_name = coalesce((new_data->>'company_name'), company_name),
        job_position = coalesce((new_data->>'job_position'), job_position),
        linkedin_url = coalesce((new_data->>'linkedin_url'), linkedin_url),
        role = coalesce((new_data->>'role'), role),
        account_status = coalesce((new_data->>'account_status'), account_status)
    where id = target_user_id;
end;
$$;

-- ==========================================
-- 4.5. RPC: GET EVENT PARTICIPANTS (Bypass RLS for Admin View)
-- ==========================================
create or replace function public.get_event_participants(target_event_id uuid)
returns table (
  user_id uuid,
  full_name text,
  email text,
  generation text,
  phone text
)
language sql
security definer
stable
as $$
  select 
    p.id as user_id,
    p.full_name,
    p.email,
    p.generation,
    p.phone
  from event_participants ep
  join profiles p on ep.user_id = p.id
  where ep.event_id = target_event_id
  and public.is_admin_check() = true; -- Guard: Only Admins
$$;

-- ==========================================
-- 5. TABLE: PROFILES (Strict RLS)
-- ==========================================
alter table profiles enable row level security;

-- Hapus policy lama yang berpotensi konflik
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Members can view active profiles" on profiles;
drop policy if exists "Super Admin Access" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can update users" on profiles;

-- Policy: User HANYA bisa lihat/edit diri sendiri (Strict)
create policy "Users can view own profile" on profiles for select using ( auth.uid() = id );
create policy "Users can update own profile" on profiles for update using ( auth.uid() = id );

-- ==========================================
-- 6. TABLE: EVENTS (Explicit RLS for Insert Fix)
-- ==========================================
alter table events enable row level security;

drop policy if exists "Events Public Read" on events;
drop policy if exists "Events Admin Write" on events;
drop policy if exists "Events are viewable by everyone" on events;
drop policy if exists "Events Select" on events;
drop policy if exists "Events Insert" on events;
drop policy if exists "Events Update" on events;
drop policy if exists "Events Delete" on events;

-- Public Read
create policy "Events Select" on events for select using (true);

-- Admin Write (Explicit Split)
create policy "Events Insert" on events for insert with check (public.is_admin_check() = true);
create policy "Events Update" on events for update using (public.is_admin_check() = true);
create policy "Events Delete" on events for delete using (public.is_admin_check() = true);

-- ==========================================
-- 7. TABLE: EVENT PARTICIPANTS
-- ==========================================
alter table event_participants enable row level security;

drop policy if exists "Participants Read Own or Admin" on event_participants;
drop policy if exists "Participants Register Self" on event_participants;
drop policy if exists "Participants Delete" on event_participants;

-- Read: User Own OR Admin
create policy "Participants Read Own or Admin" on event_participants 
for select using ( auth.uid() = user_id or public.is_admin_check() = true );

-- Insert: User Register Self
create policy "Participants Register Self" on event_participants 
for insert with check ( auth.uid() = user_id );

-- Delete: User Cancel OR Admin Remove
create policy "Participants Delete" on event_participants 
for delete using ( auth.uid() = user_id or public.is_admin_check() = true );

-- ==========================================
-- 8. TABLE: TEMP REGISTRATIONS (New Signups)
-- ==========================================
alter table temp_registrations enable row level security;

drop policy if exists "Temp Insert Public" on temp_registrations;
drop policy if exists "Temp Admin Full" on temp_registrations;

-- Allow Public/Anon to Insert (Registration)
create policy "Temp Insert Public" on temp_registrations 
for insert with check (true);

-- Admin Full Access
create policy "Temp Admin Full" on temp_registrations
for all using (public.is_admin_check() = true);

-- ==========================================
-- 9. RPC: CHECK EMAIL STATUS (Unified Check)
-- ==========================================
create or replace function public.check_email_status(email_input text)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  profile_status text;
  temp_status text;
begin
  -- 1. Check Profiles
  select account_status::text into profile_status
  from profiles
  where email ilike email_input
  limit 1;

  if profile_status is not null then
    return jsonb_build_object('source', 'profile', 'status', profile_status);
  end if;

  -- 2. Check Temp Registrations
  select status::text into temp_status
  from temp_registrations
  where email ilike email_input
  order by submitted_at desc
  limit 1;

  if temp_status is not null then
    return jsonb_build_object('source', 'temp', 'status', temp_status);
  end if;

  -- 3. Not Found
  return jsonb_build_object('source', 'none', 'status', null);
end;
$$;

-- ==========================================
-- 10. GRANTS
-- ==========================================
grant select, update on table profiles to authenticated;
grant execute on function public.get_directory_members to authenticated;
grant execute on function public.get_all_profiles_for_admin to authenticated;
grant execute on function public.admin_update_profile to authenticated;
grant execute on function public.get_event_participants to authenticated;
grant execute on function public.check_email_status to anon, authenticated;
grant insert on table temp_registrations to anon, authenticated;
grant all on table temp_registrations to authenticated; -- For Admin


-- ==========================================
-- 6. ACTIVITY LOGGING SYSTEM (TRACEABILITY)
-- ==========================================

-- 6.1. Create Logs Table
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- 6.2. RLS for Logs (SUPERADMIN ONLY)
alter table public.activity_logs enable row level security;

create policy "Superadmin View Logs"
  on public.activity_logs for select
  using ( public.is_superadmin() );

-- Allow System/Server to Insert (for triggers & rpc)
create policy "System Insert Logs"
  on public.activity_logs for insert
  with check ( true ); 

-- 6.3. Helper Function to Log Activity
create or replace function public.log_activity(
  p_user_id uuid,
  p_action text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer -- Runs as admin to ensure write access
as $$
begin
  insert into public.activity_logs (user_id, action, details)
  values (p_user_id, p_action, p_details);
end;
$$;

-- 6.4. Triggers for Automatic Logging

-- Trigger 1: Profile Changes (Update)
create or replace function public.trigger_log_profile_changes()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'UPDATE' then
    perform public.log_activity(
      auth.uid(), 
      'UPDATE_PROFILE', 
      jsonb_build_object(
        'target_user', new.email,
        'changes', (to_jsonb(new) - 'updated_at' - 'created_at') - (to_jsonb(old) - 'updated_at' - 'created_at')
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_update_log on public.profiles;
create trigger on_profile_update_log
  after update on public.profiles
  for each row
  execute function public.trigger_log_profile_changes();

-- Trigger 2: Registration Status Changes (Approve/Reject)
create or replace function public.trigger_log_registration_status()
returns trigger
language plpgsql
security definer
as $$
begin
  if (old.status is distinct from new.status) then
    perform public.log_activity(
      auth.uid(), 
      'VERIFY_REGISTRATION', 
      jsonb_build_object(
        'target_email', new.email,
        'old_status', old.status,
        'new_status', new.status
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_registration_status_log on public.temp_registrations;
create trigger on_registration_status_log
  after update on public.temp_registrations
  for each row
  execute function public.trigger_log_registration_status();

-- 6.5. RPC for Admin UI to Fetch Logs
create or replace function public.get_activity_logs()
returns table (
  id uuid,
  action text,
  actor_name text,
  actor_email text,
  details jsonb,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  -- Check Superadmin
  if not public.is_superadmin() then
    raise exception 'Access Denied: Superadmin Only';
  end if;

  return query
  select 
    l.id,
    l.action,
    p.full_name as actor_name,
    p.email as actor_email,
    l.details,
    l.created_at
  from public.activity_logs l
  left join public.profiles p on l.user_id = p.id
  order by l.created_at desc
  limit 100; -- Limit last 100 logs for performance
end;
$$;

grant execute on function public.get_activity_logs to authenticated;

