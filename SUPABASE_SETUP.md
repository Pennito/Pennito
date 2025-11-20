# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `sandbox-game` (or your choice)
   - Database Password: (save this securely)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)

## 2. Get API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Or update `src/network/supabase.ts` directly:

```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## 4. Create Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  last_world TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worlds table
CREATE TABLE IF NOT EXISTS worlds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventories table
CREATE TABLE IF NOT EXISTS inventories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  items JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, for production)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - adjust for production)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on worlds" ON worlds FOR ALL USING (true);
CREATE POLICY "Allow all on inventories" ON inventories FOR ALL USING (true);
```

## 5. Test Connection

1. Start your local server: `npm run serve`
2. Open browser console
3. Try to create an account
4. Check Supabase dashboard → **Table Editor** to see if data appears

## Notes

- The code automatically falls back to localStorage if Supabase is not configured
- World sync happens every 3 seconds after changes (debounced)
- Passwords are stored in plain text for now - hash them in production!



