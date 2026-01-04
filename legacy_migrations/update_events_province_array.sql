-- Change province column to text[] (Array of Strings)
-- Handling existing data by converting single string to single-item array
alter table events 
alter column province type text[] 
using case 
    when province is null then null 
    else array[province] 
end;

-- Update comment
comment on column events.province is 'Array of Target provinces if scope is regional';
