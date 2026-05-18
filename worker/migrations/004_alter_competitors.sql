-- Add created_by_user_id
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop updated_at (no longer needed)
ALTER TABLE competitors DROP COLUMN IF EXISTS updated_at;

-- Drop old column names if they still exist
ALTER TABLE competitors DROP COLUMN IF EXISTS website_url;
ALTER TABLE competitors DROP COLUMN IF EXISTS description;
