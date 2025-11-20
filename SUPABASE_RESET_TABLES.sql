-- ============================================
-- SUPABASE TABLE RESET SCRIPT
-- Run this in Supabase SQL Editor to reset all game tables
-- ============================================

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS worlds CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  last_world TEXT,
  gems INTEGER DEFAULT 0,
  redeemed_codes TEXT[] DEFAULT '{}',
  equipped_shoes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worlds table
CREATE TABLE worlds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  owner TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventories table
CREATE TABLE inventories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE POLICIES (Allow all for now)
-- ============================================

-- Allow public access for now
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON worlds FOR ALL USING (true);
CREATE POLICY "Allow all" ON inventories FOR ALL USING (true);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_worlds_name ON worlds(name);
CREATE INDEX idx_inventories_user_id ON inventories(user_id);

-- ============================================
-- DONE!
-- ============================================
-- Your tables are now ready to use.
-- The game will automatically populate them when you play.


