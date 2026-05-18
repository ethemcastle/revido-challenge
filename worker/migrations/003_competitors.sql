CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can select competitors" ON competitors;
CREATE POLICY "Workspace members can select competitors" ON competitors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = competitors.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Workspace members can insert competitors" ON competitors;
CREATE POLICY "Workspace members can insert competitors" ON competitors
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = competitors.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Workspace members can update competitors" ON competitors;
CREATE POLICY "Workspace members can update competitors" ON competitors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = competitors.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Workspace members can delete competitors" ON competitors;
CREATE POLICY "Workspace members can delete competitors" ON competitors
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = competitors.workspace_id AND wm.user_id = auth.uid())
  );
