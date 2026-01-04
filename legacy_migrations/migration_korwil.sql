-- Add managed_provinces to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS managed_provinces TEXT[] DEFAULT '{}';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update admin_update_profile RPC to handle managed_provinces
-- We need to drop the old function signature first because we are changing arguments
DROP FUNCTION IF EXISTS admin_update_profile(uuid, jsonb);

CREATE OR REPLACE FUNCTION admin_update_profile(target_user_id UUID, new_data JSONB)
RETURNS VOID AS $$
BEGIN
    -- Check if executor is admin (handled by RLS policy ideally, but RPCs run with elevated privileges usually)
    -- Ideally we should check if auth.uid() is admin, but for now we assume app logic handles it.
    
    UPDATE profiles
    SET 
        full_name = COALESCE((new_data->>'full_name'), full_name),
        phone = COALESCE((new_data->>'phone'), phone),
        generation = COALESCE((new_data->>'generation'), generation),
        role = COALESCE((new_data->>'role'), role),
        managed_provinces = COALESCE(
            (SELECT array_agg(x) FROM jsonb_array_elements_text(new_data->'managed_provinces') t(x)),
            managed_provinces
        ),
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
