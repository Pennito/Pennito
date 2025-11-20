# Step-by-Step: Deploy IPenno to GitHub Pages

Follow these steps exactly to get your game online!

## Step 1: Build Your Game

Open Terminal and run:
```bash
cd /Users/ahmadmashaka/Desktop/Curso/sandbox-game
npm run build
```

Wait for it to finish. You should see "Build successful" or no errors.

---

## Step 2: Create GitHub Account (if you don't have one)

1. Go to https://github.com/signup
2. Create a free account
3. Verify your email

---

## Step 3: Create a New Repository

1. Go to https://github.com/new
2. **Repository name**: `ipenno-game` (or any name you like)
3. **Description**: "IPenno - 2D Sandbox Game"
4. **Make it PUBLIC** (required for free GitHub Pages)
5. **DO NOT** check "Add a README file" (we'll add files manually)
6. Click **"Create repository"**

---

## Step 4: Push Your Code to GitHub

Open Terminal and run these commands one by one:

```bash
# Navigate to your game folder
cd /Users/ahmadmashaka/Desktop/Curso/sandbox-game

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - IPenno game"

# Add your GitHub repository (REPLACE YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ipenno-game.git

# Rename branch to main
git branch -M main

# Push to GitHub (it will ask for your GitHub username and password/token)
git push -u origin main
```

**Note:** When it asks for password, you'll need a **Personal Access Token** (not your GitHub password). See Step 5 below.

---

## Step 5: Create Personal Access Token (for password)

GitHub requires a token instead of password:

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. **Note**: "IPenno Deployment"
4. **Expiration**: 90 days (or No expiration)
5. Check **"repo"** checkbox (gives access to repositories)
6. Click **"Generate token"**
7. **COPY THE TOKEN** (you won't see it again!)
8. When Terminal asks for password, paste this token instead

---

## Step 6: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/ipenno-game`
2. Click the **"Settings"** tab (top right)
3. Scroll down to **"Pages"** in the left sidebar
4. Under **"Source"**, select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **"Save"**
6. Wait 1-2 minutes

---

## Step 7: Your Game is Live! 🎉

Your game will be available at:
**`https://YOUR_USERNAME.github.io/ipenno-game/`**

(Replace YOUR_USERNAME with your actual GitHub username)

Share this URL with anyone - they can play immediately!

---

## How to Update Your Game Later

When you make changes:

```bash
cd /Users/ahmadmashaka/Desktop/Curso/sandbox-game

# Build the game
npm run build

# Add changes
git add .

# Commit
git commit -m "Update game"

# Push to GitHub
git push
```

GitHub Pages will automatically update your game in 1-2 minutes!

---

## Troubleshooting

**"Repository not found" error:**
- Make sure you replaced YOUR_USERNAME with your actual GitHub username
- Make sure the repository exists on GitHub

**"Authentication failed" error:**
- Use Personal Access Token instead of password
- Make sure token has "repo" permission

**Game not loading:**
- Wait 2-3 minutes after enabling Pages
- Check if build was successful (`npm run build`)
- Make sure Supabase is configured in `src/network/supabase.ts`

**Need help?**
- Check browser console (F12) for errors
- Make sure all files were pushed to GitHub
- Verify GitHub Pages is enabled in Settings

---

## Quick Command Reference

```bash
# Build game
npm run build

# Push updates
git add .
git commit -m "Update"
git push
```

That's it! Your game is now live on the internet! 🚀

