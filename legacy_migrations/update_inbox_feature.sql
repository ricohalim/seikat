-- Inbox Enhancements

-- 1. Add Archive and Expiry to inbox_messages
alter table inbox_messages 
add column if not exists is_archived boolean default false,
add column if not exists expires_at timestamptz;

-- 2. Add last_read_inbox to profiles for "Unread Badge" logic
-- We will count messages where created_at > last_read_inbox
alter table profiles
add column if not exists last_read_inbox timestamptz default now();

-- 3. Policy updates (if needed)
-- Users should not see archived messages (unless we want them to?) -> Usually archived is for Admin management.
-- Users should not see expired messages? -> Request says "auto archived kalau sudah selesai", implies hidden from main view.

drop policy if exists "Users can view their messages" on inbox_messages;

create policy "Users can view their messages"
    on inbox_messages
    for select
    to authenticated
    using (
        (target_user_id = auth.uid() or target_user_id is null)
        and (is_archived = false)
        and (expires_at is null or expires_at > now())
    );
