-- Add Visibility Columns to Events Table
alter table events 
add column if not exists scope text check (scope in ('nasional', 'regional')) default 'nasional',
add column if not exists province text,
add column if not exists is_online boolean default false;

-- Comment on columns
comment on column events.scope is 'nasional or regional';
comment on column events.province is 'Target province if scope is regional';
comment on column events.is_online is 'If true, visible to everyone regardless of location';
