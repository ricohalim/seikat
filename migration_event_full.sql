-- Migration for Full Event Staff & Logistics System

-- 1. Event Staff Table
create table if not exists event_staff (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text not null, -- 'Koordinator', 'Registrasi', 'Konsumsi', 'Liaison', 'Keamanan'
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- 2. Event Coupons (Logistics)
create table if not exists event_coupons (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  name text not null, -- 'Lunch', 'Snack', 'Merchandise'
  quota_per_user int default 1,
  created_at timestamptz default now()
);

-- 3. Event Transactions (Redemptions)
create table if not exists event_transactions (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null, 
  user_id uuid references profiles(id) on delete cascade not null, -- Participant
  coupon_id uuid references event_coupons(id) on delete cascade not null,
  staff_id uuid references profiles(id) on delete set null, -- Who scanned
  redeemed_at timestamptz default now()
);

-- 4. Update Event Participants (Check-in & CRM)
alter table event_participants 
add column if not exists check_in_time timestamptz,
add column if not exists notes text, -- For Talent Scout/Liaison
add column if not exists tags text[]; -- ['VIP', 'Speaker', 'Sponsor']

-- 5. RLS Policies

-- Enable RLS
alter table event_staff enable row level security;
alter table event_coupons enable row level security;
alter table event_transactions enable row level security;

-- Event Staff Policies
-- Admins can do everything
create policy "Admins can manage event staff" on event_staff
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin')));

-- Staff can view themselves (to know their role)
create policy "Staff can view own assignments" on event_staff
  for select using (user_id = auth.uid());

-- Event Coupons Policies
-- Admins manage
create policy "Admins can manage event coupons" on event_coupons
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin')));

-- Staff can view coupons (to redeem them)
create policy "Staff can view coupons" on event_coupons
  for select using (
    exists (
      select 1 from event_staff 
      where event_staff.event_id = event_coupons.event_id 
      and event_staff.user_id = auth.uid()
    )
  );

-- Event Transactions Policies
-- Admins view all
create policy "Admins can view transactions" on event_transactions
  for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin')));

-- Staff can insert (Redeem)
create policy "Staff can create transactions" on event_transactions
  for insert with check (
    exists (
      select 1 from event_staff 
      where event_staff.event_id = event_transactions.event_id 
      and event_staff.user_id = auth.uid()
    )
  );

-- Users can view their own transactions (History)
create policy "Users can view own transactions" on event_transactions
  for select using (user_id = auth.uid());

-- Participant Updates (Check-in)
-- Existing policies only allow users to manage their own. We need to allow Staff to UPDATE participants.
create policy "Staff can update participants (Check-in/Notes)" on event_participants
  for update using (
    exists (
      select 1 from event_staff 
      where event_staff.event_id = event_participants.event_id 
      and event_staff.user_id = auth.uid()
    )
  );

-- Staff can VIEW participants (for the list)
create policy "Staff can view participants" on event_participants
  for select using (
    exists (
      select 1 from event_staff 
      where event_staff.event_id = event_participants.event_id 
      and event_staff.user_id = auth.uid()
    )
  );
