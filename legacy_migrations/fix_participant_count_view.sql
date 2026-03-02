-- ============================================================
-- MIGRATION: Fix Participant Count
-- Deskripsi:
-- Hitungan peserta sebelumnya menghitung SEMUA baris di
-- event_participants termasuk status Cancelled, Permitted,
-- Waiting List, Absent, Rejected.
--
-- Fix: Buat view `event_active_participant_counts` yang hanya
-- menghitung status aktif (Registered, Attended, Checked In, dll).
-- ============================================================

CREATE OR REPLACE VIEW event_active_participant_counts AS
SELECT
    event_id,
    COUNT(*) AS active_count
FROM event_participants
WHERE status NOT IN ('Cancelled', 'Permitted', 'Waiting List', 'Absent', 'Rejected')
GROUP BY event_id;

-- Grant akses ke view ini
GRANT SELECT ON event_active_participant_counts TO authenticated;
GRANT SELECT ON event_active_participant_counts TO anon;

-- Verifikasi
SELECT * FROM event_active_participant_counts LIMIT 5;
