-- Fix for admin_update_profile RPC
-- Removing reference to verification_photo_url if it causes issues, and ensuring photo_url is handled.
-- Also fixing duplicate 'role' assignment.

create or replace function public.admin_update_profile(
    target_user_id uuid,
    new_data jsonb
)
returns void
language plpgsql
security definer
as $$
begin
    if public.is_admin_check() = false then
        raise exception 'Access Denied: Only Admins can update other profiles.';
    end if;

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
        role = coalesce((new_data->>'role'), role),
        account_status = coalesce((new_data->>'account_status'), account_status),
        -- Using photo_url as the main profile photo now. 
        -- If verification_photo_url column is missing, this line would cause error.
        -- We'll support photo_url instead.
        photo_url = coalesce((new_data->>'photo_url'), photo_url)
    where id = target_user_id;
end;
$$;
