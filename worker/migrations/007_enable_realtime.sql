-- Enable realtime for competitors table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'competitors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE competitors;
  END IF;
END $$;
