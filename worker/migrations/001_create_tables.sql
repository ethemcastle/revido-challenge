CREATE TABLE IF NOT EXISTS my_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  -- add your domain columns here
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (so users can only access their own rows)
ALTER TABLE my_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own" ON my_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own" ON my_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own" ON my_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

