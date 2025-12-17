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
-- 8. GRANTS
-- ==========================================
grant select, update on table profiles to authenticated;
grant execute on function public.get_directory_members to authenticated;
grant execute on function public.get_all_profiles_for_admin to authenticated;
grant execute on function public.admin_update_profile to authenticated;
