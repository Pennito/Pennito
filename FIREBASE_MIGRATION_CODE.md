# Firebase Migration - Code Changes

## Step 1: Update imports in `src/screens/game.ts`

**Find:**
```typescript
import { MultiplayerSync, OtherPlayer } from '../network/multiplayer.js';
```

**Replace with:**
```typescript
// Option 1: Use Firebase (recommended)
import { MultiplayerSyncFirebase as MultiplayerSync, OtherPlayer } from '../network/multiplayer-firebase.js';

// Option 2: Keep Supabase (fallback)
// import { MultiplayerSync, OtherPlayer } from '../network/multiplayer.js';
```

## Step 2: Initialize Firebase in `src/screens/game.ts`

**In the `initializeMultiplayer()` method, add at the top:**
```typescript
private async initializeMultiplayer(): Promise<void> {
  // Initialize Firebase first
  const { getFirebaseApp } = await import('../network/firebase.js');
  await getFirebaseApp();
  
  // Rest of the code...
}
```

## Step 3: Test the Migration

1. Make sure `firebase-config.ts` has your Firebase credentials
2. Build: `npm run build`
3. Test multiplayer sync
4. Check Firebase Console → Realtime Database to see data

## Step 4: Rollback if Needed

If Firebase doesn't work, simply change the import back to:
```typescript
import { MultiplayerSync, OtherPlayer } from '../network/multiplayer.js';
```

## Benefits of Firebase

- **Faster sync**: ~50-100ms latency vs 200-500ms with Supabase
- **Real-time updates**: Instant WebSocket connections
- **Better reliability**: Optimized for real-time multiplayer
- **Free tier**: 100 concurrent connections, 1GB storage

## Hybrid Approach (Recommended)

- **Firebase**: Player positions, chat, block changes (real-time)
- **Supabase**: User accounts, persistent world data, inventory (less frequent updates)

This gives you the best of both worlds!

