-- Create Inbox Messages Table
create table if not exists inbox_messages (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null,
    type text not null default 'announcement', -- 'announcement', 'info', 'alert'
    target_user_id uuid references profiles(id), -- null means broadcast to all
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- Enable RLS
alter table inbox_messages enable row level security;

-- Policies for Admins (Full Access)
create policy "Admins can do everything on inbox_messages"
    on inbox_messages
    for all
    to authenticated
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'superadmin')
        )
    );

-- Policies for Users (Read Only, Own Messages or Broadcasts)
create policy "Users can view their messages"
    on inbox_messages
    for select
    to authenticated
    using (
        target_user_id = auth.uid()
        or target_user_id is null
    );

-- Grant permissions (if needed, usually authenticated role covers it in Supabase)
grant all on inbox_messages to authenticated;
grant all on inbox_messages to service_role;
