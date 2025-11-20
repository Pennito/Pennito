# Multiplayer Setup Guide

## ⚠️ IMPORTANT: Required Setup Steps

For multiplayer to work (players seeing each other, real-time block changes, chat sync), you **MUST** complete these steps:

### Step 1: Create the `active_players` Table

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Open the file `SUPABASE_ACTIVE_PLAYERS_TABLE.sql`
4. Copy the entire SQL script
5. Paste it into the SQL Editor
6. Click "Run" to execute the script

This will create:
- The `active_players` table
- Required indexes for performance
- Row Level Security (RLS) policies
- Realtime publication for live updates

### Step 2: Verify Realtime is Enabled

1. In Supabase dashboard, go to "Database" → "Replication"
2. Make sure `active_players` table is listed
3. If not, the SQL script should have enabled it, but you can manually enable it here

### Step 3: Test Multiplayer

1. Open the game in two different browser windows/tabs (or two devices)
2. Log in with different accounts
3. Join the same world
4. You should see:
   - ✅ Other player's sprite moving in real-time
   - ✅ Block changes appearing instantly
   - ✅ Chat messages syncing
   - ✅ Player usernames above characters

### Troubleshooting

**Players can't see each other:**
- Check browser console for errors
- Verify `active_players` table exists in Supabase
- Check that Realtime is enabled for the table
- Make sure both players are in the same world

**Block changes don't sync:**
- Check browser console for `[WORLD-SYNC]` messages
- Verify Realtime channels are working
- Check network tab for WebSocket connections

**Game data not resetting:**
- Make sure `GAME_VERSION` in `src/utils/constants.ts` is updated
- Make sure `index.html` cache buster matches the version
- Clear browser cache or do hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Current Version

- **Game Version**: 1.0.2
- **Cache Buster**: `?v=1.0.2`

If you update the version, make sure to:
1. Update `GAME_VERSION` in `src/utils/constants.ts`
2. Update the `?v=` parameter in `index.html`
3. Rebuild and redeploy

