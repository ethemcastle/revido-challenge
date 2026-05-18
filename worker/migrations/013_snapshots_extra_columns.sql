-- Add missing columns to snapshots table
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

