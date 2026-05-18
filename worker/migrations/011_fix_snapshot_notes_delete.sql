-- Fix delete policy: allow any workspace member to delete notes (not just author)
DROP POLICY IF EXISTS "Users can delete own snapshot_notes" ON snapshot_notes;
DROP POLICY IF EXISTS "Workspace members can delete snapshot_notes" ON snapshot_notes;
CREATE POLICY "Workspace members can delete snapshot_notes" ON snapshot_notes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = snapshot_notes.workspace_id AND wm.user_id = auth.uid())
  );

