-- Make name unique per workspace and homepage_url required
ALTER TABLE competitors ALTER COLUMN homepage_url SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS competitors_name_workspace_unique ON competitors (workspace_id, lower(name));

