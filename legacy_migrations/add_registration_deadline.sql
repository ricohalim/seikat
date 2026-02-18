-- Add registration_deadline column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN events.registration_deadline IS 'Deadline for participants to register. If NULL, registration is open until event start.';
