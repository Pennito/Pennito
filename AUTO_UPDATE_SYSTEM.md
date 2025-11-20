# Auto-Update System

## ✅ How Auto-Updates Work

The game now has **automatic update detection** that works with both GitHub Pages and Supabase:

### 1. **GitHub Pages Auto-Deploy**
- When you push code to GitHub, GitHub Pages automatically deploys it (1-2 minutes)
- No manual deployment needed!

### 2. **Version Detection**
- The game checks for new versions every **30 seconds**
- Compares the version in `index.html` script tag (`?v=X.X.X`) with the current `GAME_VERSION`
- If a new version is detected, automatically refreshes the page

### 3. **Supabase Data Reset**
- When version changes, the game:
  1. Broadcasts `{Global Message ; game updating}` to all active players
  2. Waits 2 seconds for message delivery
  3. Clears all data from Supabase (users, worlds, inventories)
  4. Forces page refresh

### 4. **Real-Time Sync**
- **Block breaking/placing**: Syncs instantly via Realtime (no delay)
- **Dropped items**: Broadcasts when items are created
- **Player positions**: Updates every 100ms
- **Chat messages**: Instant sync
- **World changes**: Full world sync every 3 seconds (debounced)

## 🔄 Update Process

### For You (Developer):

1. **Make changes to code**
2. **Update version** (if you want to force data reset):
   - Edit `src/utils/constants.ts`: `GAME_VERSION = '1.0.3'`
   - Edit `index.html`: `src="./dist/main.js?v=1.0.3"`
3. **Build and deploy**:
   ```bash
   npm run build
   ./deploy.sh  # or manually copy to docs/
   git add docs/
   git commit -m "Update to v1.0.3"
   git push
   ```

### For Players:

- **Automatic**: Game checks for updates every 30 seconds
- **On version change**: All players see update message and auto-refresh
- **No manual action needed**: Updates happen automatically

## 📋 Current Status

- ✅ **GitHub Pages**: Auto-deploys on push
- ✅ **Version Detection**: Checks every 30 seconds
- ✅ **Auto-Refresh**: Refreshes when new version detected
- ✅ **Data Reset**: Clears Supabase on version change
- ✅ **Real-Time Sync**: Instant block/item/player sync
- ✅ **Global Messages**: Broadcasts update notifications

## 🎯 What Gets Synced

### Instant (Realtime):
- ✅ Block breaking
- ✅ Block placing
- ✅ Dropped items
- ✅ Player positions
- ✅ Chat messages

### Debounced (Every 3 seconds):
- ✅ Full world data (for persistence)

### Periodic (Every 30 seconds):
- ✅ Version check (for auto-updates)

## 📝 Notes

- Version is stored in `localStorage` for client-side checking
- Version can optionally be stored in Supabase `game_settings` table (optional feature)
- Cache buster in `index.html` ensures browsers load new code
- All active players receive update notifications before reset

