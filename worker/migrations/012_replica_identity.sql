-- Enable full replica identity so realtime DELETE events include all columns (needed for filtered subscriptions)
ALTER TABLE snapshot_notes REPLICA IDENTITY FULL;
ALTER TABLE snapshots REPLICA IDENTITY FULL;
ALTER TABLE competitors REPLICA IDENTITY FULL;

