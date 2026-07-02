-- ============================================================
-- MIGRATION: create_survey_feature
-- Fitur: Survey pasca-event dengan builder pertanyaan
-- Tipe: short_text, long_text, likert, multiple_choice, checkbox
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Template survei (reusable)
CREATE TABLE IF NOT EXISTS survey_templates (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pertanyaan template
CREATE TABLE IF NOT EXISTS survey_template_questions (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id   UUID REFERENCES survey_templates(id) ON DELETE CASCADE,
    order_index   INTEGER NOT NULL DEFAULT 0,
    type          TEXT NOT NULL CHECK (type IN ('short_text','long_text','likert','multiple_choice','checkbox')),
    question_text TEXT NOT NULL,
    options       JSONB,   -- array of strings, untuk multiple_choice & checkbox
    required      BOOLEAN DEFAULT TRUE
);

-- 3. Survei per-event (satu event satu survei)
CREATE TABLE IF NOT EXISTS event_surveys (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT DEFAULT 'active' CHECK (status IN ('active','closed')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id)
);

-- 4. Pertanyaan survei event (independen dari template)
CREATE TABLE IF NOT EXISTS event_survey_questions (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_survey_id UUID REFERENCES event_surveys(id) ON DELETE CASCADE,
    order_index    INTEGER NOT NULL DEFAULT 0,
    type           TEXT NOT NULL CHECK (type IN ('short_text','long_text','likert','multiple_choice','checkbox')),
    question_text  TEXT NOT NULL,
    options        JSONB,
    required       BOOLEAN DEFAULT TRUE
);

-- 5. Respons pengguna (satu per user per survei)
CREATE TABLE IF NOT EXISTS survey_responses (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_survey_id UUID REFERENCES event_surveys(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_survey_id, user_id)
);

-- 6. Jawaban per pertanyaan
CREATE TABLE IF NOT EXISTS survey_answers (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id   UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id   UUID REFERENCES event_survey_questions(id) ON DELETE CASCADE,
    answer_text   TEXT,      -- short_text, long_text, likert ('1'-'5'), multiple_choice (pilihan)
    answer_values JSONB      -- checkbox: array of strings
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE survey_templates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_template_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_surveys                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_survey_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers                ENABLE ROW LEVEL SECURITY;

-- Helper: apakah user adalah admin/korwil
CREATE OR REPLACE FUNCTION is_staff_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('superadmin', 'admin', 'korwil')
    )
$$;

-- survey_templates: admin CRUD, user baca
CREATE POLICY "Admin manage templates"   ON survey_templates FOR ALL TO authenticated USING (is_staff_user()) WITH CHECK (is_staff_user());
CREATE POLICY "Users read templates"     ON survey_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage tmpl_q"      ON survey_template_questions FOR ALL TO authenticated USING (is_staff_user()) WITH CHECK (is_staff_user());
CREATE POLICY "Users read tmpl_q"        ON survey_template_questions FOR SELECT TO authenticated USING (true);

-- event_surveys: admin CRUD, user baca
CREATE POLICY "Admin manage surveys"     ON event_surveys FOR ALL TO authenticated USING (is_staff_user()) WITH CHECK (is_staff_user());
CREATE POLICY "Users read surveys"       ON event_surveys FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage esq"         ON event_survey_questions FOR ALL TO authenticated USING (is_staff_user()) WITH CHECK (is_staff_user());
CREATE POLICY "Users read esq"           ON event_survey_questions FOR SELECT TO authenticated USING (true);

-- survey_responses: user insert & baca miliknya, admin baca semua
CREATE POLICY "Users insert response"    ON survey_responses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users read own response"  ON survey_responses FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_staff_user());

-- survey_answers: user insert & baca miliknya, admin baca semua
CREATE POLICY "Users insert answer"      ON survey_answers FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM survey_responses WHERE id = response_id AND user_id = auth.uid()));
CREATE POLICY "Users read own answers"   ON survey_answers FOR SELECT TO authenticated
    USING (is_staff_user() OR EXISTS (SELECT 1 FROM survey_responses WHERE id = response_id AND user_id = auth.uid()));
