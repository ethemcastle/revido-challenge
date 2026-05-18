-- Backfill: add all existing users to the shared workspace
INSERT INTO workspace_members (workspace_id, user_id)
SELECT '00000000-0000-0000-0000-000000000001', id
FROM auth.users
ON CONFLICT DO NOTHING;

