-- Allow anonymous/public read access to event_participants for the Live Leaderboard
-- Previously it was restricted to 'authenticated' users only.

CREATE POLICY "Public can view event participants for leaderboard"
ON event_participants
FOR SELECT
TO public
USING (true);
