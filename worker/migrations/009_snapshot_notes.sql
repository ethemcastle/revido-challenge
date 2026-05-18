-- Notes/comments on snapshots
CREATE TABLE IF NOT EXISTS snapshot_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE snapshot_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can select snapshot_notes" ON snapshot_notes;
CREATE POLICY "Workspace members can select snapshot_notes" ON snapshot_notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = snapshot_notes.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Workspace members can insert snapshot_notes" ON snapshot_notes;
CREATE POLICY "Workspace members can insert snapshot_notes" ON snapshot_notes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = snapshot_notes.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own snapshot_notes" ON snapshot_notes;
CREATE POLICY "Users can delete own snapshot_notes" ON snapshot_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'snapshot_notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE snapshot_notes;
  END IF;
END $$;

