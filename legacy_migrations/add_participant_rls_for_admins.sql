-- Allow Admins to INSERT into event_participants (for Quick Add / On-the-spot registration)
create policy "Admins can insert participants" on event_participants
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin'))
  );

-- Allow Staff (Registrasi, etc) to INSERT if assigned to event
create policy "Staff can register participants" on event_participants
  for insert with check (
    exists (
      select 1 from event_staff 
      where event_staff.event_id = event_participants.event_id 
      and event_staff.user_id = auth.uid()
    )
  );
