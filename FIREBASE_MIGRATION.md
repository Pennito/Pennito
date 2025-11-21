# Firebase Realtime Database Migration Guide

## Why Firebase?
- **Better real-time performance**: Optimized for low-latency multiplayer
- **Lower latency**: Direct WebSocket connections
- **More reliable**: Better connection management
- **Free tier**: 100 concurrent connections, 1GB storage

## Setup Steps

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Realtime Database
4. Set rules:
```json
{
  "rules": {
    "worlds": {
      "$worldName": {
        ".read": true,
        ".write": true
      }
    },
    "players": {
      "$worldName": {
        "$userId": {
          ".read": true,
          ".write": "auth != null && $userId === auth.uid"
        }
      }
    }
  }
}
```

### 2. Install Firebase SDK
```bash
npm install firebase
```

### 3. Configuration
Add to `src/network/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

### 4. Migration Strategy
- **Phase 1**: Use Firebase for multiplayer sync only (positions, chat, block changes)
- **Phase 2**: Keep Supabase for persistent data (users, worlds, inventory)
- **Phase 3**: Full migration if needed

## Performance Comparison
- **Supabase**: ~200-500ms latency, 3s world sync
- **Firebase**: ~50-100ms latency, instant updates

