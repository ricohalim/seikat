-- Enable RLS on temp_registrations to be sure
ALTER TABLE temp_registrations ENABLE ROW LEVEL SECURITY;

-- 1. Policy for Admins to VIEW (SELECT) all registrations
DROP POLICY IF EXISTS "Admins can view all temp registrations" ON temp_registrations;

CREATE POLICY "Admins can view all temp registrations"
ON temp_registrations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- 2. Policy for users to INSERT (Public/Anon) - usually needed for registration
DROP POLICY IF EXISTS "Anon can insert temp registrations" ON temp_registrations;

CREATE POLICY "Anon can insert temp registrations"
ON temp_registrations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. Policy for service role
DROP POLICY IF EXISTS "Service role full access" ON temp_registrations;

CREATE POLICY "Service role full access"
ON temp_registrations
TO service_role
USING (true)
WITH CHECK (true);
