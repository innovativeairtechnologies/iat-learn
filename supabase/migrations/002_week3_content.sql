-- IAT Learn — Phase 1, Week 3
-- Content hierarchy: Categories → Subjects → Topics → Steps
-- Run in Supabase Dashboard > SQL Editor

-- ─── Categories ───────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  icon         text NOT NULL DEFAULT 'BookOpen',
  color        text NOT NULL DEFAULT '#6366f1',
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- ─── Subjects ─────────────────────────────────────────────────────────────────

CREATE TABLE subjects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  cover_image_url text,
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order      integer DEFAULT 0,
  is_published    boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ─── Topics ───────────────────────────────────────────────────────────────────

CREATE TABLE topics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id   uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  sort_order   integer DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ─── Steps ────────────────────────────────────────────────────────────────────

CREATE TABLE steps (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id          uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title             text NOT NULL,
  content           jsonb,
  video_url         text,
  estimated_minutes integer,
  sort_order        integer DEFAULT 0,
  is_published      boolean NOT NULL DEFAULT false,
  requires_quiz     boolean NOT NULL DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ─── Step Attachments ─────────────────────────────────────────────────────────

CREATE TABLE step_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id     uuid NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  file_name   text NOT NULL,
  file_url    text NOT NULL,
  file_type   text,
  file_size   integer,
  created_at  timestamptz DEFAULT now()
);

-- ─── updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER topics_updated_at   BEFORE UPDATE ON topics   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER steps_updated_at    BEFORE UPDATE ON steps    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_attachments ENABLE ROW LEVEL SECURITY;

-- Categories: all authenticated users can read
CREATE POLICY "cat_read"        ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat_admin_write" ON categories FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- Subjects
CREATE POLICY "sub_read_published" ON subjects FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "sub_admin_all"      ON subjects FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- Topics
CREATE POLICY "topic_read_published" ON topics FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "topic_admin_all"      ON topics FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- Steps
CREATE POLICY "step_read_published" ON steps FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "step_admin_all"      ON steps FOR ALL    TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- Step attachments
CREATE POLICY "attach_read" ON step_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM steps s WHERE s.id = step_id AND s.is_published = true));
CREATE POLICY "attach_admin_all" ON step_attachments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- ─── Seed categories ──────────────────────────────────────────────────────────

INSERT INTO categories (name, icon, color, sort_order) VALUES
  ('Company',       'Building2',  '#6366f1', 0),
  ('HR & Policies', 'FileText',   '#f59e0b', 1),
  ('Operations',    'Settings2',  '#3b82f6', 2),
  ('Engineering',   'Wrench',     '#10b981', 3),
  ('Sales',         'TrendingUp', '#ec4899', 4);
