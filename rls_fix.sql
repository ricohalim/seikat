-- SOLUSI FINAL: SEPARATE & CONQUER

-- 1. Helper Function (Admin Check)
create or replace function public.is_admin_check()
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

-- 2. PUBLIC DIRECTORY RPC (Untuk User Biasa - Data Aman)
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
  -- where account_status = 'Active' -- Commented out to debug empty directory
  order by full_name asc;
$$;

-- 3. ADMIN MANAGEMENT RPC (Untuk Admin - Data Lengkap)
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

-- 4. RLS TABLE LOCKDOWN (Untuk Dashboard)
alter table profiles enable row level security;

-- HAPUS SEMUA Policy lama
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Members can view active profiles" on profiles;
drop policy if exists "Super Admin Access" on profiles; -- INI PENYEBAB REKURSI, KITA HAPUS
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can update users" on profiles;

-- Policy 1: User HANYA bisa lihat/edit diri sendiri
-- Ini menjamin Dashboard User 100% aman dan tidak error.
create policy "Users can view own profile"
on profiles for select
using ( auth.uid() = id );

create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );

-- *PERHATIAN*: Admin sekarang TIDAK BISA select * from profiles secara langsung lewat Client.
-- Admin HARUS pakai RPC `get_all_profiles_for_admin()` untuk melihat list user.

-- 5. GRANTS
grant select, update on table profiles to authenticated;
grant execute on function public.get_directory_members to authenticated;
grant execute on function public.get_all_profiles_for_admin to authenticated;

-- ==========================================
-- 6. EVENTS & PARTICIPANTS POLICIES (Fix "Lost Events" Bug)
-- ==========================================

-- Enable RLS just in case
alter table events enable row level security;
alter table event_participants enable row level security;

-- Events: Public Read, Admin Write
create policy "Events Public Read" on events for select using (true);
create policy "Events Admin Write" on events for all using (public.is_admin_check() = true);

-- Participants: 
-- Read: User Own OR Admin
create policy "Participants Read Own or Admin" on event_participants 
for select using ( auth.uid() = user_id or public.is_admin_check() = true );

-- Insert: User Own (Register)
create policy "Participants Register Self" on event_participants 
for insert with check ( auth.uid() = user_id );

-- Delete: User Own (Cancel) OR Admin
create policy "Participants Delete" on event_participants 
for delete using ( auth.uid() = user_id or public.is_admin_check() = true );


-- ==========================================
-- 7. ADMIN IMPERSONATION / UPDATE PROFILE
-- ==========================================
-- Since profiles RLS is strict (Owner Only), Admin needs this RPC to "help" users fill data.

create or replace function public.admin_update_profile(
    target_user_id uuid,
    new_data jsonb
)
returns void
language plpgsql
security definer
as $$
begin
    -- 1. Check if caller is Admin
    if public.is_admin_check() = false then
        raise exception 'Access Denied: Only Admins can update other profiles.';
    end if;

    -- 2. Update Profile
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
        
        -- Admin Specific Fields
        role = coalesce((new_data->>'role'), role),
        account_status = coalesce((new_data->>'account_status'), account_status)
    where id = target_user_id;

end;
$$;

grant execute on function public.admin_update_profile to authenticated;
