-- IAT Learn — Phase 1, Week 1
-- Run this in the Supabase Dashboard > SQL Editor

-- ─── Departments ──────────────────────────────────────────────────────────────

CREATE TABLE departments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- ─── User Profiles ────────────────────────────────────────────────────────────

CREATE TABLE user_profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text,
  display_name    text,
  department_id   uuid REFERENCES departments(id) ON DELETE SET NULL,
  role            text NOT NULL DEFAULT 'employee'
                  CHECK (role IN ('admin', 'manager', 'employee')),
  avatar_url      text,
  points          integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  hired_at        date,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ─── Invitations ──────────────────────────────────────────────────────────────

CREATE TABLE invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'employee'
                  CHECK (role IN ('admin', 'manager', 'employee')),
  department_id   uuid REFERENCES departments(id) ON DELETE SET NULL,
  invited_by      uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  accepted_at     timestamptz,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz DEFAULT now()
);

-- ─── Auto-create profile on new auth user ─────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE departments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations   ENABLE ROW LEVEL SECURITY;

-- Departments: all authenticated users can read
CREATE POLICY "dept_read" ON departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dept_admin_write" ON departments
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- User profiles: users read their own; admins/managers read all
CREATE POLICY "profile_self_read" ON user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profile_admin_manager_read" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "profile_self_update" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profile_admin_all" ON user_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- Invitations: admins and managers can manage
CREATE POLICY "invite_admin_manager_all" ON invitations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ─── Seed departments ─────────────────────────────────────────────────────────

INSERT INTO departments (name, sort_order) VALUES
  ('Administration', 0),
  ('Operations',     1),
  ('Shop Floor',     2),
  ('Engineering',    3),
  ('Sales',          4);

-- ─── First admin setup ────────────────────────────────────────────────────────
-- After creating your first account, run this to make yourself an admin:
--
--   UPDATE user_profiles
--   SET role = 'admin'
--   WHERE email = 'your@email.com';
