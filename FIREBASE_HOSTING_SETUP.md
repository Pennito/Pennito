# Firebase Hosting Setup - Step by Step

## Why Firebase Hosting?

✅ **Faster**: Global CDN, faster than GitHub Pages  
✅ **Better for Web Apps**: Optimized for single-page apps  
✅ **Free Tier**: 10GB storage, 360MB/day transfer  
✅ **Easy Deployment**: One command to deploy  
✅ **Custom Domains**: Add your own domain easily  
✅ **Same Platform**: Everything in one place (Database + Hosting)

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Or if you prefer without global install:
```bash
npx firebase-tools login
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate.

## Step 3: Initialize Firebase Hosting

```bash
cd /Users/ahmadmashaka/Desktop/Curso/sandbox-game
firebase init hosting
```

**When prompted:**
- ✅ Use an existing project: **Yes**
- Select project: **pennito-70ae8**
- Public directory: **dist** (this is where your built files are)
- Configure as single-page app: **Yes**
- Set up automatic builds: **No** (we'll do it manually)
- Overwrite index.html: **No** (we already have one)

## Step 4: Build Your Game

```bash
npm run build
```

This creates the `dist` folder with all your game files.

## Step 5: Deploy to Firebase

```bash
firebase deploy --only hosting
```

That's it! Your game will be live at:
`https://pennito-70ae8.web.app`

## Step 6: View Your Site

After deployment, you'll see a URL like:
- `https://pennito-70ae8.web.app`
- `https://pennito-70ae8.firebaseapp.com`

Both URLs work!

## Quick Deploy Script

Add this to `package.json`:
```json
"scripts": {
  "deploy": "npm run build && firebase deploy --only hosting"
}
```

Then just run:
```bash
npm run deploy
```

## Benefits Over GitHub Pages

| Feature | GitHub Pages | Firebase Hosting |
|---------|--------------|------------------|
| Speed | Good | Excellent (CDN) |
| Custom Domain | Yes | Yes (easier) |
| SSL | Yes | Yes (automatic) |
| Build Process | Manual | One command |
| CDN | Basic | Global CDN |
| Free Tier | Unlimited | 10GB storage |

## Troubleshooting

**"Firebase CLI not found"**
- Run: `npm install -g firebase-tools`

**"Permission denied"**
- Run: `firebase login` again

**"No project found"**
- Check `.firebaserc` has correct project ID

**"dist folder not found"**
- Run: `npm run build` first

## Automatic Deployments (Optional)

You can set up GitHub Actions to auto-deploy on push, but manual deployment is simpler for now.

## Your Game URLs

After first deployment:
- **Primary**: `https://pennito-70ae8.web.app`
- **Secondary**: `https://pennito-70ae8.firebaseapp.com`

Both work the same!

