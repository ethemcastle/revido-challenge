-- Snapshots: periodic crawl/scrape results for each competitor
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
  status TEXT NOT NULL DEFAULT 'pending',
  content JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can select snapshots" ON snapshots;
CREATE POLICY "Workspace members can select snapshots" ON snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = snapshots.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Workspace members can insert snapshots" ON snapshots;
CREATE POLICY "Workspace members can insert snapshots" ON snapshots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = snapshots.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Workspace members can update snapshots" ON snapshots;
CREATE POLICY "Workspace members can update snapshots" ON snapshots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = snapshots.workspace_id AND wm.user_id = auth.uid())
  );

-- Enable realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE snapshots;
  END IF;
END $$;


