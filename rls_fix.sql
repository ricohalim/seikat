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
