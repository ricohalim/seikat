-- Agenda Module V1 Migration
-- Description: Adds support for Attendance, Sanctions (Absence counting), and Permission/Cancellation logic.

-- 1. Update PROFILES table to track sanctions
-- 'consecutive_absences' counts how many times user did not show up (Alpha).
-- If >= 2, they will be hit by "Waiting List" sanction.
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS consecutive_absences INTEGER DEFAULT 0;

-- 2. Update EVENT_PARTICIPANTS table for status tracking
-- 'status' values: 'Registered', 'Attended', 'Absent', 'Cancelled', 'Permitted', 'Waiting List'
ALTER TABLE event_participants
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Registered',
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_status TEXT DEFAULT 'none'; -- 'pending', 'approved', 'rejected', 'none'

-- 3. RPC: Check In User (Called by Admin/Committee)
-- Marks user as 'Attended' and resets their sanction counter (Pemutihan).
CREATE OR REPLACE FUNCTION check_in_participant(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Update participant status
  UPDATE event_participants
  SET 
    status = 'Attended',
    checked_in_at = NOW()
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- 2. Reset sanction counter (Pemutihan)
  UPDATE profiles
  SET consecutive_absences = 0
  WHERE id = p_user_id;
END;
$$;

-- 4. RPC: Finalize Event Attendance (Called by Admin after event)
-- Marks all 'Registered' users (who didn't check in) as 'Absent' and increments sanction.
-- Ignores 'Cancelled', 'Permitted', 'Waiting List'.
CREATE OR REPLACE FUNCTION finalize_event_attendance(
  p_event_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- 1. Count affected users
  SELECT COUNT(*) INTO v_count
  FROM event_participants
  WHERE event_id = p_event_id AND status = 'Registered';

  -- 2. Update Sanction Counter for Absentees
  UPDATE profiles
  SET consecutive_absences = consecutive_absences + 1
  WHERE id IN (
    SELECT user_id FROM event_participants 
    WHERE event_id = p_event_id AND status = 'Registered'
  );

  -- 3. Mark them as Absent in the event
  UPDATE event_participants
  SET status = 'Absent'
  WHERE event_id = p_event_id AND status = 'Registered';

  RETURN 'Berhasil memproses ' || v_count || ' peserta yang tidak hadir (Alpha).';
END;
$$;

-- 5. RPC: Approve Cancellation (Called by Admin)
-- Approves an 'Izin' request. Status becomes 'Cancelled' (Permitted).
-- Does NOT increment sanction.
CREATE OR REPLACE FUNCTION approve_cancellation(
  p_event_id UUID,
  p_user_id UUID,
  p_approve BOOLEAN -- true = approve, false = reject
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_approve THEN
    UPDATE event_participants
    SET 
      status = 'Permitted', 
      cancellation_status = 'approved'
    WHERE event_id = p_event_id AND user_id = p_user_id;
  ELSE
    -- If rejected, revert to Registered (so they must attend or get Alpha)
    UPDATE event_participants
    SET 
      status = 'Registered', 
      cancellation_status = 'rejected'
    WHERE event_id = p_event_id AND user_id = p_user_id;
  END IF;
END;
$$;
