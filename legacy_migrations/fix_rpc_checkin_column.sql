-- Fix RPC: Check In Participant to use check_in_time column
-- Previous version incorrectly updated checked_in_at

CREATE OR REPLACE FUNCTION check_in_participant(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Update participant status and check_in_time
  UPDATE event_participants
  SET 
    status = 'Attended',
    check_in_time = NOW(), -- Use the correct column name used by the App
    checked_in_at = NOW()  -- Update this too just in case future migrations use it
  WHERE event_id = p_event_id AND user_id = p_user_id;

  -- 2. Reset sanction counter (Pemutihan)
  UPDATE profiles
  SET consecutive_absences = 0
  WHERE id = p_user_id;
END;
$$;
