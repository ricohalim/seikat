-- ============================================================
-- Fix: Allow authenticated users to see event participant counts
-- Problem: RLS blocks User B from seeing User A's participant record,
--          causing the quota display to always show 0 for other users.
-- Solution: Allow SELECT on event_participants for all authenticated users.
--           We only expose 'status' column in the query (no personal data).
-- ============================================================

-- Allow any authenticated user to read participant records
-- (needed for quota count display: "X / Y Peserta")
CREATE POLICY "Authenticated users can view event participant statuses"
ON event_participants
FOR SELECT
TO authenticated
USING (true);
