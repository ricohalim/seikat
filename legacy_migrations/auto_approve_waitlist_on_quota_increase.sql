-- ============================================================
-- TRIGGER: auto_approve_waitlist_on_quota_increase
-- Ketika kuota event dinaikkan, trigger ini otomatis meng-approve
-- peserta dari Waiting List secara berurutan (FIFO by created_at)
-- hingga slot baru terisi atau waiting list habis.
-- ============================================================

-- 1. Function yang dijalankan trigger
CREATE OR REPLACE FUNCTION process_waitlist_on_quota_increase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_count   INT;
    v_available_slots INT;
    v_waitlist_row    RECORD;
BEGIN
    -- Hanya proses kalau quota benar-benar naik
    IF NEW.quota <= OLD.quota THEN
        RETURN NEW;
    END IF;

    -- Jika quota baru = 0 artinya tidak terbatas, tidak perlu proses waitlist
    -- (sudah tidak ada batasan, biarkan admin handle manual)
    IF NEW.quota = 0 THEN
        RETURN NEW;
    END IF;

    -- Hitung peserta aktif saat ini (exclude Cancelled, Permitted, Waiting List)
    SELECT COUNT(*) INTO v_active_count
    FROM event_participants
    WHERE event_id = NEW.id
      AND status NOT IN ('Cancelled', 'Permitted', 'Waiting List', 'Absent', 'Rejected');

    -- Hitung slot tersedia
    v_available_slots := NEW.quota - v_active_count;

    -- Jika tidak ada slot baru, selesai
    IF v_available_slots <= 0 THEN
        RETURN NEW;
    END IF;

    -- Loop approve waiting list secara FIFO (created_at paling awal duluan)
    FOR v_waitlist_row IN
        SELECT id, user_id
        FROM event_participants
        WHERE event_id = NEW.id
          AND status = 'Waiting List'
        ORDER BY id ASC
        LIMIT v_available_slots
    LOOP
        UPDATE event_participants
        SET status = 'Registered'
        WHERE id = v_waitlist_row.id;

        -- Kurangi slot yang tersedia
        v_available_slots := v_available_slots - 1;
        EXIT WHEN v_available_slots <= 0;
    END LOOP;

    RETURN NEW;
END;
$$;

-- 2. Pasang trigger pada tabel events
DROP TRIGGER IF EXISTS trg_auto_approve_waitlist ON events;

CREATE TRIGGER trg_auto_approve_waitlist
AFTER UPDATE OF quota ON events
FOR EACH ROW
EXECUTE FUNCTION process_waitlist_on_quota_increase();

-- 3. Verifikasi trigger sudah terpasang
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_auto_approve_waitlist';
