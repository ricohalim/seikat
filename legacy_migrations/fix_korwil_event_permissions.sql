-- Fix RLS: Ensure Korwil can Manage Events
-- Drop potential duplicate/conflicting policies first
DROP POLICY IF EXISTS "Enable insert for korwil users" ON "public"."events";
DROP POLICY IF EXISTS "Enable update for korwil users" ON "public"."events";
DROP POLICY IF EXISTS "Enable delete for korwil users" ON "public"."events";
DROP POLICY IF EXISTS "Enable select for korwil users" ON "public"."events";

-- 1. SELECT: Korwil can view all events (or we can restrict later)
CREATE POLICY "Enable select for korwil users" ON "public"."events"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true); -- Typically everyone can see events, or filter by logic in App

-- 2. INSERT: Allow Korwil
CREATE POLICY "Enable insert for korwil users" ON "public"."events"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('korwil', 'admin', 'superadmin')
  )
);

-- 3. UPDATE: Allow Korwil
CREATE POLICY "Enable update for korwil users" ON "public"."events"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('korwil', 'admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('korwil', 'admin', 'superadmin')
  )
);

-- 4. DELETE: Allow Korwil
CREATE POLICY "Enable delete for korwil users" ON "public"."events"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('korwil', 'admin', 'superadmin')
  )
);
