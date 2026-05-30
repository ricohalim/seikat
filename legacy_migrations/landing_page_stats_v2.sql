-- Landing page stats v2
-- Returns aggregated public stats for the landing page (no PII exposed)
-- Must be run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'alumni_count',      (SELECT COUNT(*)::integer FROM profiles WHERE account_status = 'Active'),
    'generation_count',  (SELECT COUNT(DISTINCT generation)::integer FROM profiles WHERE account_status = 'Active' AND generation IS NOT NULL AND generation != ''),
    'university_count',  (
      SELECT COUNT(DISTINCT TRIM(p.university))::integer
      FROM profiles p
      WHERE p.account_status = 'Active'
        AND p.university IS NOT NULL
        AND TRIM(p.university) != ''
        AND EXISTS (
          SELECT 1 FROM master_universities mu
          WHERE mu.name = TRIM(p.university)
        )
    ),
    'province_count',    (SELECT COUNT(DISTINCT domicile_province)::integer FROM profiles WHERE account_status = 'Active' AND domicile_province IS NOT NULL AND domicile_province != '')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO anon, authenticated, service_role;
