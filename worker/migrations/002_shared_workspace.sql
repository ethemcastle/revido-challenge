-- Single shared workspace (all users belong to this one)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Default Workspace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the one hardcoded workspace
INSERT INTO workspaces (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Shared Workspace')
ON CONFLICT (id) DO NOTHING;

-- Workspace members (all users auto-join the shared workspace)
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated can view shared workspace" ON workspaces;
CREATE POLICY "All authenticated can view shared workspace" ON workspaces
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can view memberships" ON workspace_members;
CREATE POLICY "Members can view memberships" ON workspace_members
  FOR SELECT USING (auth.uid() = user_id);

-- Update my_items to belong to the shared workspace
ALTER TABLE my_items ADD COLUMN IF NOT EXISTS workspace_id UUID
  REFERENCES workspaces(id) ON DELETE CASCADE
  DEFAULT '00000000-0000-0000-0000-000000000001';

-- Replace user-only RLS with workspace-based
DROP POLICY IF EXISTS "Users can select own" ON my_items;
DROP POLICY IF EXISTS "Users can insert own" ON my_items;
DROP POLICY IF EXISTS "Users can update own" ON my_items;
DROP POLICY IF EXISTS "Workspace members can select" ON my_items;
DROP POLICY IF EXISTS "Workspace members can insert" ON my_items;
DROP POLICY IF EXISTS "Workspace members can update" ON my_items;

CREATE POLICY "Workspace members can select" ON my_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = my_items.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Workspace members can insert" ON my_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = my_items.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Workspace members can update" ON my_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = my_items.workspace_id AND wm.user_id = auth.uid())
  );

-- Auto-add new users to shared workspace via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id)
  VALUES ('00000000-0000-0000-0000-000000000001', NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
