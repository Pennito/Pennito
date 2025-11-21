# Firebase Migration - Step by Step Guide

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., "ipenno-game")
4. Disable Google Analytics (optional, for simplicity)
5. Click "Create project"

## Step 2: Enable Realtime Database

1. In Firebase Console, go to "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose location (closest to your users)
4. **IMPORTANT**: Start in "Test mode" for now (we'll secure it later)
5. Click "Enable"

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the Web icon (`</>`)
4. Register app with nickname (e.g., "IPenno Web")
5. Copy the `firebaseConfig` object - you'll need this!

## Step 4: Set Up Database Rules

1. Go to "Realtime Database" → "Rules" tab
2. Replace with these rules:

```json
{
  "rules": {
    "worlds": {
      "$worldName": {
        ".read": true,
        ".write": true,
        "players": {
          "$userId": {
            ".read": true,
            ".write": "auth != null && $userId === auth.uid"
          }
        },
        "blocks": {
          ".read": true,
          ".write": true
        },
        "chat": {
          ".read": true,
          ".write": true
        }
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

**Note**: For production, you'll want stricter rules. This is for testing.

## Step 5: Install Firebase SDK

Run this command in your project directory:
```bash
npm install firebase
```

## Step 6: Create Firebase Config File

Create `src/network/firebase-config.ts` with your config (see Step 3)

## Step 7: Update Code

The code will be automatically updated to use Firebase for:
- Player position sync
- Chat messages
- Block changes
- World updates

Supabase will still be used for:
- User authentication
- Persistent world data
- Inventory storage

## Step 8: Test

1. Build the project: `npm run build`
2. Test multiplayer sync
3. Check Firebase Console → Realtime Database to see data

## Step 9: Secure Database (Production)

Once testing works, update rules to be more secure:
- Add authentication requirements
- Add validation
- Limit write access

## Troubleshooting

- **Connection issues**: Check Firebase config is correct
- **Permission denied**: Check database rules
- **Slow sync**: Check Firebase region matches your users

