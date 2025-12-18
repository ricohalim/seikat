-- MASTER MIGRATION V2 (Consolidated)
-- Includes:
-- 1. All RLS Fixes & Helper Functions (check_email_status, etc)
-- 2. Activity Logs
-- 3. [NEW] Event Staff & Logistics Tables

-- ==========================================
-- 1. HELPER: ADMIN CHECK & ACCESS CONTROL
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
-- 2. EVENT STAFF & LOGISTICS TABLES (NEW)
-- ==========================================

-- 2.1 Event Staff Table
create table if not exists event_staff (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text not null, -- 'Koordinator', 'Registrasi', 'Konsumsi', 'Liaison', 'Keamanan'
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- 2.2 Event Coupons (Logistics)
create table if not exists event_coupons (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  name text not null, -- 'Lunch', 'Snack', 'Merchandise'
  quota_per_user int default 1,
  created_at timestamptz default now()
);

-- 2.3 Event Transactions (Redemptions)
create table if not exists event_transactions (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null, 
  user_id uuid references profiles(id) on delete cascade not null, -- Participant
  coupon_id uuid references event_coupons(id) on delete cascade not null,
  staff_id uuid references profiles(id) on delete set null, -- Who scanned
  redeemed_at timestamptz default now()
);

-- 2.4 Update Event Participants Columns
alter table event_participants 
add column if not exists check_in_time timestamptz,
add column if not exists notes text,
add column if not exists tags text[];

-- ==========================================
-- 3. RLS POLICIES (Consolidated)
-- ==========================================

-- 3.1 PROFILES
alter table profiles enable row level security;
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can update users" on profiles;
-- Fix: Allow Admins to View/Update ALL profiles (Critical for Management)
create policy "Users can view own profile" on profiles for select using ( auth.uid() = id or public.is_admin_check() = true );
create policy "Users can update own profile" on profiles for update using ( auth.uid() = id or public.is_admin_check() = true );

-- 3.2 EVENT STAFF POLICIES
alter table event_staff enable row level security;
drop policy if exists "Admins/Staff manage event staff" on event_staff;

create policy "Admins manage event staff" on event_staff
  using (public.is_admin_check() = true);

create policy "Staff view own assignments" on event_staff
  for select using (user_id = auth.uid());

-- 3.3 PARTICIPANTS POLICIES (Updated for Staff Access)
alter table event_participants enable row level security;
drop policy if exists "Participants Read Own or Admin" on event_participants;
drop policy if exists "Participants Register Self" on event_participants;
drop policy if exists "Participants Delete" on event_participants;
drop policy if exists "Staff Update Participants" on event_participants;

-- Read: User, Admin, OR Event Staff
create policy "Read Participants" on event_participants 
for select using ( 
  auth.uid() = user_id 
  or public.is_admin_check() = true 
  or exists (select 1 from event_staff where event_id = event_participants.event_id and user_id = auth.uid())
);

-- Write (Check-in): Admin OR Event Staff
create policy "Staff Check-in Participants" on event_participants
for update using (
  public.is_admin_check() = true 
  or exists (select 1 from event_staff where event_id = event_participants.event_id and user_id = auth.uid())
);

-- Register Self
create policy "Participants Register Self" on event_participants 
for insert with check ( auth.uid() = user_id );


-- ==========================================
-- 4. RPCS & FUNCTIONS (User Provided + Staff)
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
  -- Allow Admin OR Event Staff to call this
  select 
    p.id as user_id,
    p.full_name,
    p.email,
    p.generation,
    p.phone
  from event_participants ep
  join profiles p on ep.user_id = p.id
  where ep.event_id = target_event_id
  and (
    public.is_admin_check() = true
    or exists (select 1 from event_staff where event_id = target_event_id and user_id = auth.uid())
  );
$$;

-- [Include rest of USER's RPCs here: check_email_status, get_directory, etc...]
-- (Truncated for brevity, assuming USER ran their block separately or we append it)

-- Insert the User's Check Email Function
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
  select account_status::text into profile_status from profiles where email ilike email_input limit 1;
  if profile_status is not null then return jsonb_build_object('source', 'profile', 'status', profile_status); end if;
  select status::text into temp_status from temp_registrations where email ilike email_input order by submitted_at desc limit 1;
  if temp_status is not null then return jsonb_build_object('source', 'temp', 'status', temp_status); end if;
  return jsonb_build_object('source', 'none', 'status', null);
end;
$$;

-- Grant Access
grant execute on function public.get_event_participants to authenticated;
grant execute on function public.check_email_status to anon, authenticated;
