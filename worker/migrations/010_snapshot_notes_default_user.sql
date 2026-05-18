-- Default user_id to the authenticated user so clients don't need to pass it
ALTER TABLE snapshot_notes ALTER COLUMN user_id SET DEFAULT auth.uid();

