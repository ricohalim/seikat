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

-- 1a. HELPER: SUPERADMIN CHECK (Separate from Admin)
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and lower(role) = 'superadmin'
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
  -- where account_status = 'Active'
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

-- Hapus policy lama yang berpotensi konflik (Robust Drop)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Members can view active profiles" on profiles;
drop policy if exists "Super Admin Access" on profiles;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Admins can update users" on profiles;

-- Policy 1: Lihat Profile (Diri Sendiri ATAU Admin)
create policy "Users can view own profile" on profiles 
for select using ( auth.uid() = id or public.is_admin_check() = true );

-- Policy 2: Update Profile (Diri Sendiri ATAU Admin)
create policy "Users can update own profile" on profiles 
for update using ( auth.uid() = id or public.is_admin_check() = true );

-- Policy 3: Insert Profile (Critical for Registration)
create policy "Users can insert own profile" on profiles 
for insert with check ( auth.uid() = id );

-- ==========================================
-- 5.5 REPAIR DATA (Auto-Fix Missing Profiles)
-- ==========================================
-- Block ini akan otomatis memperbaiki data user yg 'nyangkut' setiap kali script ini dijalankan
INSERT INTO public.profiles (id, email, full_name, account_status, role, created_at)
SELECT 
  au.id, 
  tr.email, 
  tr.full_name, 
  'Pending', 
  'member',
  NOW()
FROM auth.users au
JOIN public.temp_registrations tr ON au.email = tr.email
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

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
drop function if exists public.check_email_status(text);
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

drop policy if exists "Superadmin View Logs" on public.activity_logs;
create policy "Superadmin View Logs"
  on public.activity_logs for select
  using ( public.is_superadmin() );

-- Allow System/Server to Insert (for triggers & rpc)
drop policy if exists "System Insert Logs" on public.activity_logs;
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
        'old_data', to_jsonb(old),
        'new_data', to_jsonb(new)
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
drop function if exists public.get_activity_logs(); -- Drop old version
drop function if exists public.get_activity_logs(text); -- Drop new version

create or replace function public.get_activity_logs(
  search_text text default null
)
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
  where 
    case 
      when search_text is not null and search_text <> '' then
        p.full_name ilike '%' || search_text || '%' 
        or p.email ilike '%' || search_text || '%'
      else true
    end
  order by l.created_at desc
  limit 100; -- Limit last 100 logs for performance
end;
$$;

grant execute on function public.get_activity_logs to authenticated;

-- FEATURE: AUTO MEMBER ID
-- Script ini membuat Trigger untuk mengisi member_id secara otomatis
-- Format: DBP + 8 Digit (Mulai dari DBP02000919)

-- 1. Fungsi Generate ID
CREATE OR REPLACE FUNCTION public.get_next_member_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_id text;
  last_num bigint;
  next_id text;
  min_start_num bigint := 2000918; -- "DBP02000918" (Latest Existing)
BEGIN
  -- A. Cari ID terakhir yang ada di database (Format DBPxxxx)
  SELECT member_id INTO last_id
  FROM profiles
  WHERE member_id LIKE 'DBP%'
  AND member_id ~ '^DBP\d+$' -- Hanya ambil yang valid angka
  ORDER BY LENGTH(member_id) DESC, member_id DESC
  LIMIT 1;

  -- B. Tentukan Angka Terakhir
  IF last_id IS NULL THEN
    -- Jika database kosong (belum ada ID sama sekali), pakai angka minimum
    last_num := min_start_num;
  ELSE
    -- Ambil angka dari string (remove 'DBP')
    last_num := substring(last_id from 4)::bigint;
    
    -- Safety: Jika ID di database lebih kecil dari baseline, paksa naik ke baseline
    IF last_num < min_start_num THEN
      last_num := min_start_num;
    END IF;
  END IF;

  -- C. Increment (+1)
  -- Format: DBP + 8 digit padding
  -- Contoh: 2000918 + 1 = 2000919 -> "DBP02000919"
  next_id := 'DBP' || lpad((last_num + 1)::text, 8, '0');
  
  RETURN next_id;
END;
$$;

-- 2. Fungsi Trigger
CREATE OR REPLACE FUNCTION public.trigger_set_member_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Jalankan hanya jika Status berubah jadi 'Active' DAN member_id masih kosong
  IF NEW.account_status = 'Active' 
     AND (OLD.account_status IS DISTINCT FROM 'Active') 
     AND NEW.member_id IS NULL 
  THEN
    NEW.member_id := public.get_next_member_id();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Pasang Trigger ke Tabel Profiles
DROP TRIGGER IF EXISTS on_profile_activated ON profiles;
CREATE TRIGGER on_profile_activated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_member_id();
