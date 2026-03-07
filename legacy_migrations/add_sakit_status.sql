-- ============================================================
-- MIGRATION: add_sakit_status
-- Mengizinkan status 'Sakit' pada tabel event_participants
-- Run di Supabase SQL Editor jika ada CHECK constraint pada kolom status
-- ============================================================

-- Cek apakah ada CHECK constraint pada kolom status
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
  AND check_clause ILIKE '%status%';

-- Jika ada constraint seperti: status IN ('Registered','Waiting List','Cancelled','Permitted','Absent')
-- Tambahkan 'Sakit' dengan cara drop & recreate constraint:
--
-- ALTER TABLE public.event_participants DROP CONSTRAINT IF EXISTS <nama_constraint>;
-- ALTER TABLE public.event_participants ADD CONSTRAINT event_participants_status_check
--     CHECK (status IN ('Registered', 'Waiting List', 'Cancelled', 'Permitted', 'Absent', 'Sakit'));

-- Logging 'Sakit' sudah otomatis ter-capture oleh trigger:
-- on_event_participant_change_log → action = 'EVENT_STATUS_CHANGE'
-- dengan new_status = 'Sakit'

-- Verifikasi: lihat peserta yang sakit di sebuah event
-- SELECT ep.id, p.full_name, p.email, ep.status, ep.updated_at
-- FROM event_participants ep
-- JOIN profiles p ON ep.user_id = p.id
-- WHERE ep.status = 'Sakit'
-- ORDER BY ep.updated_at DESC;
