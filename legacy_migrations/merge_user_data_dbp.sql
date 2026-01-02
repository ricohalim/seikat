-- Merge Data from Source User (DBP02000744) to Target User (DBP01000070)
-- WARNING: Run this carefully. It moves event history.

DO $$
DECLARE
    v_source_member_id TEXT := 'DBP02000744'; -- ID SALAH / YANG MAU DIHAPUS (Source)
    v_target_member_id TEXT := 'DBP01000070'; -- ID BENAR / TUJUAN (Target)
    v_source_user_id UUID;
    v_target_user_id UUID;
    v_moved_count INTEGER;
BEGIN
    -- 1. Find UUIDs
    SELECT id INTO v_source_user_id FROM profiles WHERE member_id = v_source_member_id;
    SELECT id INTO v_target_user_id FROM profiles WHERE member_id = v_target_member_id;

    IF v_source_user_id IS NULL THEN
        RAISE NOTICE 'Source user % not found.', v_source_member_id;
        RETURN;
    END IF;

    IF v_target_user_id IS NULL THEN
        RAISE NOTICE 'Target user % not found.', v_target_member_id;
        RETURN;
    END IF;

    RAISE NOTICE 'Merging data from UUID % (Member: %) to UUID % (Member: %)', 
        v_source_user_id, v_source_member_id, v_target_user_id, v_target_member_id;

    -- 2. Update Event Participants
    -- Logic: Update source records to target ID. If target already exists in that event, duplicate key error would occur.
    -- So we only update rows where target is NOT already present.
    
    -- Step A: Delete duplicates (if Source and Target are BOTH in same event, keep Target, delete Source).
    -- Actually, maybe Source has better status? 
    -- Assuming Target is the "Correct" one, we keep Target's existing record.
    -- We'll delete Source's record if Target is already there.
    DELETE FROM event_participants
    WHERE user_id = v_source_user_id
    AND event_id IN (SELECT event_id FROM event_participants WHERE user_id = v_target_user_id);
    
    -- Step B: Move remaining records (Source was there, Target wasn't)
    UPDATE event_participants
    SET user_id = v_target_user_id
    WHERE user_id = v_source_user_id;
    
    GET DIAGNOSTICS v_moved_count = ROW_COUNT;
    RAISE NOTICE 'Moved % event registrations.', v_moved_count;

    -- 3. Update Event Staff
    -- Same logic used for Participants
    DELETE FROM event_staff
    WHERE user_id = v_source_user_id
    AND event_id IN (SELECT event_id FROM event_staff WHERE user_id = v_target_user_id);

    UPDATE event_staff
    SET user_id = v_target_user_id
    WHERE user_id = v_source_user_id;

    -- 3a. Update Event Transactions (Participant)
    -- Cek tabel event_transactions dulu kalau ada
    BEGIN
        DELETE FROM event_transactions
        WHERE user_id = v_source_user_id
        AND event_id IN (SELECT event_id FROM event_transactions WHERE user_id = v_target_user_id);

        UPDATE event_transactions SET user_id = v_target_user_id WHERE user_id = v_source_user_id;
        
        -- Update Scanner ID (Staff)
        UPDATE event_transactions SET staff_id = v_target_user_id WHERE staff_id = v_source_user_id;
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table event_transactions does not exist, skipping.';
    END;

    -- 4. Delete Source Profile (DBP02000744)
    -- Ini akan menghapus user dari tabel profiles public.
    BEGIN
        DELETE FROM profiles WHERE id = v_source_user_id;
        RAISE NOTICE 'Deleted source profile %.', v_source_member_id;
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'Gagal menghapus Profile karena masih ada data terkait di tabel lain (Constraint: %). Harap cek tabel lain.', SQLERRM;
        RAISE NOTICE 'Data event sudah dipindahkan, tapi User Source masih ada.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error menghapus profile: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Merge operation finished.';
END;
$$;
