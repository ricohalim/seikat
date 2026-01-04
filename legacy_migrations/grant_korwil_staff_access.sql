-- Allow Korwil to INSERT into event_staff
CREATE POLICY "Enable insert for korwil users" ON "public"."event_staff"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'korwil' OR role = 'admin' OR role = 'superadmin'
  )
);

-- Allow Korwil to DELETE from event_staff
CREATE POLICY "Enable delete for korwil users" ON "public"."event_staff"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'korwil' OR role = 'admin' OR role = 'superadmin'
  )
);

-- Just in case SELECT is restricted (usually public, but good to be safe)
CREATE POLICY "Enable select for korwil users" ON "public"."event_staff"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);
