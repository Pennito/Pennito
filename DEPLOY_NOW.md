# Quick Deploy Guide - Get Your Game Online in 5 Minutes

## Option 1: GitHub Pages (Recommended - Free Forever + Auto Updates)

**✅ IMPORTANT: Players DON'T need GitHub accounts!**
- GitHub Pages is just free web hosting
- Anyone can visit your game URL and play
- No GitHub account required to play
- You (the developer) need GitHub to upload updates
- Players just visit the website like any other game!

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `ipenno-game` (or any name you want)
3. Make it **Public** (required for free GitHub Pages)
4. Click "Create repository"

### Step 2: Push Your Code
```bash
cd /Users/ahmadmashaka/Desktop/Curso/sandbox-game

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - IPenno game"

# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ipenno-game.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes for deployment
7. Your game will be live at: `https://YOUR_USERNAME.github.io/ipenno-game/`

**That's it!** Your game is now online and playable by anyone!

**🎮 How Players Access Your Game:**
- Players just visit: `https://YOUR_USERNAME.github.io/ipenno-game/`
- They can play immediately - no account needed!
- No GitHub account required
- Works on any device (phone, tablet, computer)
- Just like visiting any website!

### How to Update (GitHub Pages):
**Automatic Updates - Just push to GitHub!**
1. Make your code changes
2. Run `npm run build` to rebuild
3. Commit and push:
   ```bash
   git add .
   git commit -m "Update game"
   git push
   ```
4. GitHub Pages automatically updates your game in 1-2 minutes!
5. **No manual deployment needed - it's automatic!**

---

## Option 2: Netlify Drop (Easiest - No Git Required)

### Initial Deployment:
1. Go to https://app.netlify.com/drop
2. Build your game: `npm run build`
3. Drag and drop the entire `sandbox-game` folder onto the Netlify page
4. Your game gets a random URL like `https://random-name-123.netlify.app`
5. Done! Share the URL with anyone.

### How to Update (Netlify Drop):
**Note:** Netlify Drop is for quick testing. For production, use Netlify with Git (see below) for automatic updates.

**Manual Update Process:**
1. Make your code changes
2. Run `npm run build` to rebuild
3. Go back to https://app.netlify.com/drop
4. Drag and drop the updated folder again
5. Netlify will create a NEW site (new URL) OR you can use Netlify CLI to update existing site

**Better: Use Netlify with Git (Automatic Updates):**
1. Create a GitHub repository and push your code
2. Go to https://app.netlify.com
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Build command: `npm run build`
6. Publish directory: `.` (root)
7. Click "Deploy"
8. **Now every time you push to GitHub, Netlify automatically updates your game!**

---

## Option 3: Vercel (Also Easy + Auto Updates)

### Initial Deployment:
1. Install Vercel CLI: `npm install -g vercel`
2. In your project folder, run: `vercel`
3. Follow the prompts (press Enter for defaults)
4. Your game will be deployed to a `.vercel.app` domain
5. Done!

### How to Update (Vercel):
**Option A: Automatic (Recommended)**
1. Connect Vercel to your GitHub repository
2. Every time you push to GitHub, Vercel automatically rebuilds and deploys!
3. Go to Vercel dashboard → Your project → Settings → Git
4. Connect your GitHub repo
5. **Now updates are automatic!**

**Option B: Manual**
1. Make your changes
2. Run `npm run build`
3. Run `vercel --prod` to update production

---

## Important: Supabase Setup

Before deploying, make sure:

1. **Supabase is configured** in `src/network/supabase.ts`
2. **Database tables are created** (run SQL from `SUPABASE_SETUP.md`)
3. **RLS policies allow public access** for your game

---

## After Deployment

- ✅ **Game is accessible to anyone with the URL** - No accounts needed!
- ✅ **Players don't need GitHub** - They just visit the website
- ✅ **Works on any device** - Phone, tablet, computer
- ✅ **No downloads required** - Play directly in browser
- ✅ No reset button visible to players
- ✅ Reset only happens on version updates (when you change `GAME_VERSION`)
- ✅ Players cannot reset via console (function removed)

**Example:**
- You deploy to: `https://yourname.github.io/ipenno-game/`
- Share this URL with friends
- They open it in their browser and play immediately
- No GitHub account, no downloads, no sign-ups needed!

## Update Your Game

### For GitHub Pages (Automatic):
1. Make changes to code
2. Run `npm run build`
3. Update `GAME_VERSION` in `src/utils/constants.ts` if you want to reset data
4. Update version in `index.html` script tag (`?v=X.X.X`)
5. Commit and push:
   ```bash
   git add .
   git commit -m "Update game"
   git push
   ```
6. **GitHub Pages automatically updates in 1-2 minutes!**

### For Netlify with Git (Automatic):
1. Make changes to code
2. Run `npm run build`
3. Update `GAME_VERSION` if needed
4. Push to GitHub
5. **Netlify automatically detects changes and deploys!**

### For Netlify Drop (Manual):
1. Make changes to code
2. Run `npm run build`
3. Update `GAME_VERSION` if needed
4. Go to https://app.netlify.com/drop
5. Drag and drop the updated folder again
6. **Note:** This creates a new site. For production, use Netlify with Git instead.

### For Vercel (Automatic if connected to Git):
1. Make changes to code
2. Run `npm run build`
3. Update `GAME_VERSION` if needed
4. Push to GitHub (if connected) OR run `vercel --prod`
5. **Vercel automatically updates if connected to Git!**

---

## Summary: Best Options for Easy Updates

**🥇 Best: GitHub Pages** - Free, automatic updates, permanent URL
- Push code → Auto-deploys in 1-2 minutes
- No manual steps needed

**🥈 Second: Netlify with Git** - Free, automatic updates, custom domain support
- Connect to GitHub → Auto-deploys on every push
- Better for custom domains

**🥉 Third: Vercel with Git** - Free, automatic updates, great performance
- Connect to GitHub → Auto-deploys on every push
- Fast CDN

**⚠️ Not Recommended for Production: Netlify Drop**
- Manual updates only
- Creates new sites each time
- Use only for quick testing

Your game will automatically reset all player data when the version changes!

