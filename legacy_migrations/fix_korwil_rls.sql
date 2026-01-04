-- Allow Korwil to INSERT into events
CREATE POLICY "Enable insert for korwil users" ON "public"."events"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE role = 'korwil'
  )
);

-- Allow Korwil to UPDATE their own events (or all events depending on requirement, usually own or regional)
-- For simplicity and preventing the error, we allow update if they are korwil.
-- A more strict policy can be added later if needed.
CREATE POLICY "Enable update for korwil users" ON "public"."events"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE role = 'korwil'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE role = 'korwil'
  )
);

-- Allow Korwil to DELETE events (optional but good for management)
CREATE POLICY "Enable delete for korwil users" ON "public"."events"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE role = 'korwil'
  )
);
