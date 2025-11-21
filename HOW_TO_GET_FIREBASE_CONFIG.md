# How to Get Your Firebase Config - Visual Guide

## Quick Steps:

1. **Click on your project** ("pennito" or "ester" in your Firebase console)

2. **Click the gear icon** (⚙️) next to "Project Overview" at the top left

3. **Select "Project settings"** from the dropdown

4. **Scroll down to "Your apps"** section

5. **If you see a web app already:**
   - Click on it to see the config
   
6. **If you DON'T see a web app:**
   - Click the **Web icon** (`</>`) 
   - Register your app with nickname: "IPenno Web"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

7. **Copy the config values:**
   - You'll see a code block like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "pennito-70ae8.firebaseapp.com",
     databaseURL: "https://pennito-70ae8-default-rtdb.firebaseio.com",
     projectId: "pennito-70ae8",
     storageBucket: "pennito-70ae8.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

8. **Paste into `src/network/firebase-config.ts`**

## Important Notes:

- **databaseURL** is especially important - it should look like:
  `https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/`
  
- If you don't see `databaseURL` in the config, you need to:
  1. Go to "Build" → "Realtime Database"
  2. Create the database first
  3. Then the URL will appear in your config

## Example:

If your project is "pennito-70ae8", your config might look like:

```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "pennito-70ae8.firebaseapp.com",
  databaseURL: "https://pennito-70ae8-default-rtdb.firebaseio.com/",
  projectId: "pennito-70ae8",
  storageBucket: "pennito-70ae8.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

