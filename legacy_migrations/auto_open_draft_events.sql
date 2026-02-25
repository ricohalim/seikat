-- ============================================================
-- Migration: Auto Open Draft Events via opens_at field + pg_cron
-- 
-- ⚡ STEP 1 & 2 → Jalankan sekarang (sudah berhasil jika column & function ada)
-- ⚠️  STEP 3   → Aktifkan pg_cron dulu, lalu jalankan Step 3 terpisah
-- ============================================================

-- ───────────────────────────────────────────────
-- STEP 1: Tambah kolom opens_at ke tabel events
-- ───────────────────────────────────────────────
ALTER TABLE events
ADD COLUMN IF NOT EXISTS opens_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN events.opens_at IS
    'Waktu otomatis event berubah dari Draft ke Open. Diproses oleh pg_cron tiap jam.';

-- ───────────────────────────────────────────────
-- STEP 2: Function yang dijalankan cron
-- ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_open_draft_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE events
    SET status = 'Open'
    WHERE status = 'Draft'
      AND opens_at IS NOT NULL
      AND opens_at <= NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION auto_open_draft_events() TO service_role;

-- ───────────────────────────────────────────────
-- STEP 3: Daftarkan cron job
-- ⚠️  JALANKAN TERPISAH setelah pg_cron aktif:
--    Supabase Dashboard → Database → Extensions
--    → Cari "pg_cron" → Toggle Enable → Save
-- ───────────────────────────────────────────────

SELECT cron.schedule(
    'auto-open-draft-events',
    '0 * * * *',
    'SELECT auto_open_draft_events()'
);

-- Verifikasi
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'auto-open-draft-events';
