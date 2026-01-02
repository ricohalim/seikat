-- Migration to add quota to events table
-- Run this in Supabase SQL Editor

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS quota INTEGER DEFAULT 0;

-- Optional: Update existing events to have 0 quota (unlimited)
UPDATE events SET quota = 0 WHERE quota IS NULL;
