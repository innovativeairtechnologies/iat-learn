-- IAT Learn — Phase 1, Week 6
-- Step progress tracking + file attachments storage
-- Run in Supabase Dashboard > SQL Editor

-- ─── User Step Progress ──────────────────────────────────────────────────────

CREATE TABLE user_step_progress (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  step_id            uuid NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  status             text NOT NULL DEFAULT 'not_started'
                       CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at       timestamptz,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  UNIQUE (user_id, step_id)
);

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON user_step_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE user_step_progress ENABLE ROW LEVEL SECURITY;

-- Each user manages their own progress rows
CREATE POLICY "progress_own" ON user_step_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admins/managers can read everyone's progress (for reporting)
CREATE POLICY "progress_admin_read" ON user_step_progress FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager')
  ));

-- ─── Supabase Storage bucket ──────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('step-attachments', 'step-attachments', true)
  ON CONFLICT (id) DO NOTHING;

-- All authenticated users can read attachment files
CREATE POLICY "attach_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'step-attachments');

-- Only admins/managers can upload
CREATE POLICY "attach_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'step-attachments'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- Only admins/managers can delete
CREATE POLICY "attach_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'step-attachments'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
  );
