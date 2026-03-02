-- ============================================================
-- MIGRATION: RPC get_events_with_active_count
-- Deskripsi:
-- Menggantikan query client-side yang salah menghitung peserta.
-- Function ini mengembalikan semua events beserta jumlah peserta
-- AKTIF (exclude: Cancelled, Permitted, Waiting List, Absent, Rejected).
-- ============================================================

CREATE OR REPLACE FUNCTION get_events_with_active_count()
RETURNS TABLE (
    id              UUID,
    title           TEXT,
    description     TEXT,
    date_start      TIMESTAMPTZ,
    location        TEXT,
    status          TEXT,
    quota           INT,
    scope           TEXT,
    province        TEXT[],
    is_online       BOOLEAN,
    registration_deadline TIMESTAMPTZ,
    created_at      TIMESTAMPTZ,
    active_count    BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT
        e.id,
        e.title,
        e.description,
        e.date_start,
        e.location,
        e.status,
        e.quota,
        e.scope,
        e.province,
        e.is_online,
        e.registration_deadline,
        e.created_at,
        COUNT(ep.id) AS active_count
    FROM events e
    LEFT JOIN event_participants ep
        ON ep.event_id = e.id
        AND ep.status NOT IN ('Cancelled', 'Permitted', 'Waiting List', 'Absent', 'Rejected')
    GROUP BY e.id
    ORDER BY e.date_start DESC;
$$;

-- Grant akses
GRANT EXECUTE ON FUNCTION get_events_with_active_count() TO authenticated;

-- Verifikasi
SELECT id, title, quota, active_count FROM get_events_with_active_count() LIMIT 5;
