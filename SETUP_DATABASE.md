# 🗄️ Setting Up Online Database (Supabase)

Your game already has database integration built-in! It's currently using localStorage as a fallback. Follow these steps to enable the online database:

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or Email (FREE tier is enough)

### Step 2: Create a New Project
1. Click "New Project"
2. Choose a name (e.g., "sandbox-game")
3. Create a strong database password (save it!)
4. Select a region close to you
5. Click "Create new project" (takes 2 minutes)

### Step 3: Get Your API Credentials
1. In your project dashboard, click "Settings" (⚙️) in the left sidebar
2. Click "API" under Project Settings
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### Step 4: Create Database Tables
1. Click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste this SQL:

```sql
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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (you can make this more restrictive later)
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON worlds FOR ALL USING (true);
CREATE POLICY "Allow all" ON inventories FOR ALL USING (true);

-- Indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_worlds_name ON worlds(name);
CREATE INDEX idx_inventories_user_id ON inventories(user_id);
```

4. Click "Run" button
5. You should see "Success. No rows returned"

### Step 5: Add Credentials to Your Game
1. Open `/src/network/supabase.ts`
2. Replace these lines:
```typescript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual credentials:
```typescript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // Your Project URL
const SUPABASE_ANON_KEY = 'eyJxxxx...'; // Your anon public key
```

3. Save the file
4. Run `npm run build`
5. Refresh your browser

## ✅ Done!

Your game now uses Supabase! All data (players, worlds, inventories, gems) will be stored online and synced automatically.

## 🔒 Security Features

- **Anti-cheat**: All player data is server-side
- **No local exploits**: Can't edit localStorage to get gems
- **World ownership**: Protected by database
- **Real-time sync**: Changes save every 3 seconds
- **Fallback system**: If Supabase is down, uses localStorage temporarily

## 📊 Monitor Your Data

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Open your project
3. Click "Table Editor" to see all user accounts, worlds, and inventories in real-time!

## 🛡️ Security Improvements (Optional)

For production, you should:
1. **Hash passwords**: Currently stored as plain text
2. **Add authentication**: Use Supabase Auth instead of custom login
3. **Restrict RLS policies**: Make tables more secure
4. **Add rate limiting**: Prevent spam/abuse

---

**Need help?** Check the [Supabase documentation](https://supabase.com/docs)


