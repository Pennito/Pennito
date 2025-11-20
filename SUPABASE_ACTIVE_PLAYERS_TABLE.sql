-- Create active_players table for real-time multiplayer sync
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS active_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  world_name TEXT NOT NULL,
  x REAL DEFAULT 0,
  y REAL DEFAULT 0,
  equipped_hat INTEGER,
  equipped_shirt INTEGER,
  equipped_pants INTEGER,
  equipped_shoes INTEGER,
  equipped_wings INTEGER,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_active_players_world_name ON active_players(world_name);
CREATE INDEX IF NOT EXISTS idx_active_players_last_seen ON active_players(last_seen);

-- Enable Row Level Security (RLS)
ALTER TABLE active_players ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active players (for seeing other players)
CREATE POLICY "Anyone can read active players"
  ON active_players FOR SELECT
  USING (true);

-- Policy: Users can insert/update their own player data
CREATE POLICY "Users can insert their own player"
  ON active_players FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own player data
CREATE POLICY "Users can update their own player"
  ON active_players FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete their own player data
CREATE POLICY "Users can delete their own player"
  ON active_players FOR DELETE
  USING (true);

-- Enable Realtime for active_players table
ALTER PUBLICATION supabase_realtime ADD TABLE active_players;

