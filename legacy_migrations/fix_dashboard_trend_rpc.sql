-- Drop previous if exists
DROP FUNCTION IF EXISTS get_registration_trend_last_7_days();

-- Create RPC with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_registration_trend_last_7_days()
RETURNS TABLE (
    submission_date DATE,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Cast to date (UTC) - Frontend handles local conversion, 
        -- or we can cast to specific timezone if needed. 
        -- For now, kept as simple Date from Timestamp.
        (submitted_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::DATE as submission_date,
        COUNT(*) as total_count
    FROM 
        temp_registrations
    WHERE 
        submitted_at >= (NOW() - INTERVAL '7 days')
    GROUP BY 
        1
    ORDER BY 
        1 ASC;
END;
$$;

-- Grant execute to authenticated users (Dashboard will filter by Role logic in UI, 
-- but we can also add check inside function if strictly needed)
GRANT EXECUTE ON FUNCTION get_registration_trend_last_7_days() TO authenticated;
