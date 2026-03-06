-- ============================================================
-- MIGRATION: viewer_role_support
-- Tambah role 'viewer' untuk akun Djarum Foundation:
--   1. Exclude role 'viewer' dari alumni directory
--   2. Akun viewer tidak bisa diakses lewat /dashboard member biasa
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Update RPC get_directory_members_v2 agar exclude role 'viewer'
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
    AND (p.role IS NULL OR p.role NOT IN ('viewer'))  -- Exclude viewer (Djarum Foundation, etc)
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

-- ============================================================
-- Juga update get_active_alumni_count agar exclude viewer
-- ============================================================
DROP FUNCTION IF EXISTS public.get_active_alumni_count();

CREATE OR REPLACE FUNCTION public.get_active_alumni_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)
  FROM profiles
  WHERE account_status IS DISTINCT FROM 'Pending'
    AND (role IS NULL OR role NOT IN ('viewer'));
$$;

GRANT EXECUTE ON FUNCTION public.get_active_alumni_count() TO authenticated;

-- ============================================================
-- LANGKAH MANUAL SETELAH MENJALANKAN SQL INI:
-- 1. Buat akun Djarum Foundation via tombol "Tambah Alumni" di admin
--    dengan email placeholder: viewer.djarum@seikat.internal (atau email bebas)
--    dan nama: Djarum Foundation
-- 2. Setelah akun terbuat, jalankan update berikut:
--    UPDATE profiles SET role = 'viewer' WHERE email = 'EMAIL_YANG_DIPAKAI';
-- ============================================================
