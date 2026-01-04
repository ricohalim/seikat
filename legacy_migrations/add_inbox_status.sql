-- Add status column to inbox_messages
alter table inbox_messages
add column status text not null default 'draft';

-- Update existing messages to 'published' so they don't disappear
update inbox_messages
set status = 'published';

-- Add check constraint
alter table inbox_messages
add constraint inbox_messages_status_check check (status in ('draft', 'published'));
