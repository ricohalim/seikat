-- FIX: Use V2 Function to ensure fresh logic and correct signature
-- This avoids "Return type mismatch" errors with the old function

CREATE OR REPLACE FUNCTION public.get_directory_members_v2(search_query text DEFAULT '')
RETURNS TABLE (
  id uuid,
  full_name text,
  generation text,
  photo_url text,
  linkedin_url text,
  university text,
  major text,
  company_name text,
  job_position text
) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.full_name, p.generation, p.photo_url, p.linkedin_url,
    p.university, p.major, p.company_name, p.job_position
  FROM profiles p
  WHERE 
    p.account_status IS DISTINCT FROM 'Pending'
    AND (
      search_query = '' 
      OR 
      p.full_name ILIKE '%' || search_query || '%' 
      OR 
      p.generation ILIKE '%' || search_query || '%'
    )
  ORDER BY p.full_name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_directory_members_v2(text) TO authenticated;
