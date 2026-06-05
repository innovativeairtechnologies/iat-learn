-- IAT Learn — Phase 2
-- Subject assignments, learning paths, quizzes, subject cover storage
-- Run in Supabase Dashboard > SQL Editor

-- ─── Subject Assignments ─────────────────────────────────────────────────────
-- Assign a subject to a specific user OR a whole department (not both).
-- If a subject has zero assignment rows it is visible to ALL employees (Phase 1 compat).

CREATE TABLE subject_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  assigned_by   uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_at   timestamptz DEFAULT now(),
  CONSTRAINT assignment_one_target CHECK (
    (user_id IS NOT NULL AND department_id IS NULL) OR
    (user_id IS NULL AND department_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX assignment_user_unique ON subject_assignments (subject_id, user_id)        WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX assignment_dept_unique ON subject_assignments (subject_id, department_id)  WHERE department_id IS NOT NULL;

-- ─── Learning Paths ───────────────────────────────────────────────────────────

CREATE TABLE paths (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  cover_image_url text,
  is_published    boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE path_subjects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id    uuid NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  UNIQUE (path_id, subject_id)
);

CREATE TABLE path_enrollments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id      uuid NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  enrolled_at  timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (path_id, user_id)
);

CREATE TRIGGER paths_updated_at BEFORE UPDATE ON paths FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Quizzes ──────────────────────────────────────────────────────────────────

CREATE TABLE quiz_questions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id    uuid NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  question   text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE quiz_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct  boolean NOT NULL DEFAULT false,
  sort_order  integer DEFAULT 0
);

CREATE TABLE quiz_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  step_id      uuid NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  score        integer NOT NULL,
  passed       boolean NOT NULL,
  attempted_at timestamptz DEFAULT now()
);

-- ─── Subject cover image storage ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('subject-covers', 'subject-covers', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "covers_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'subject-covers');

CREATE POLICY "covers_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'subject-covers'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

CREATE POLICY "covers_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'subject-covers'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE paths               ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_subjects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_enrollments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts       ENABLE ROW LEVEL SECURITY;

-- Assignments: admin/manager full control; employees read their own direct or department assignments
CREATE POLICY "assign_admin_all" ON subject_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

CREATE POLICY "assign_self_read" ON subject_assignments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR department_id IN (
      SELECT department_id FROM user_profiles
      WHERE id = auth.uid() AND department_id IS NOT NULL
    )
  );

-- Paths
CREATE POLICY "path_read_published" ON paths FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "path_admin_all"      ON paths FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

CREATE POLICY "path_subjects_read"  ON path_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "path_subjects_admin" ON path_subjects FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- Enrollments
CREATE POLICY "enroll_own"        ON path_enrollments FOR ALL    TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "enroll_admin_read" ON path_enrollments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- Quiz questions and options: all authenticated can read; admin/manager write
CREATE POLICY "quiz_q_read"  ON quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "quiz_q_admin" ON quiz_questions FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

CREATE POLICY "quiz_opt_read"  ON quiz_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "quiz_opt_admin" ON quiz_options FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- Quiz attempts
CREATE POLICY "attempt_own"        ON quiz_attempts FOR ALL    TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "attempt_admin_read" ON quiz_attempts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));
