# IPenno - Web Deployment Guide

## Quick Start

IPenno is a browser-based 2D sandbox game that can be deployed to any static web hosting service.

## Build the Game

1. Install dependencies:
```bash
npm install
```can u 

2. Build the TypeScript code:
```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Local Testing

Run a local server:
```bash
npm run serve
```

Then open `http://localhost:8000` in your browser.

## Deploy to Web

### Option 1: GitHub Pages

1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select source branch (usually `main` or `gh-pages`)
4. Select `/ (root)` as the folder
5. Your game will be available at `https://yourusername.github.io/repository-name`

### Option 2: Netlify

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Build the game: `npm run build`
3. Deploy: `netlify deploy --prod --dir=.`
4. Follow the prompts to set up your site

### Option 3: Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Build the game: `npm run build`
3. Deploy: `vercel --prod`
4. Follow the prompts

### Option 4: Any Static Hosting

1. Build the game: `npm run build`
2. Upload the entire project folder to your hosting service
3. Make sure `index.html` is in the root directory
4. Ensure the server serves `index.html` for all routes (for SPA routing if needed)

## Required Files

Make sure these files are included in your deployment:
- `index.html` (main entry point)
- `dist/` folder (compiled JavaScript)
- `src/network/supabase.js` (Supabase configuration - make sure to set your keys!)

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key
3. Update `src/network/supabase.ts` with your credentials
4. Run the SQL script from `SUPABASE_SETUP.md` to create tables

## Version Updates & Resets

- The game automatically resets all data when the version changes
- To update the version, edit `GAME_VERSION` in `src/utils/constants.ts`
- Update the version in `index.html` script tag cache buster (`?v=X.X.X`)
- On next load, all player data will be automatically cleared

## Manual Reset (Developers Only)

If you need to manually reset the game:
1. Open browser console (F12)
2. Type: `resetGameData()`
3. Confirm the reset

**Note:** The reset button has been removed from the UI. Only automatic resets on version updates are enabled for production.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Canvas API support required
- LocalStorage for version tracking

## Troubleshooting

- **Game won't load**: Check browser console for errors
- **Supabase errors**: Verify your Supabase credentials are correct
- **Build errors**: Run `npm run build` and check for TypeScript errors
- **CORS issues**: Make sure Supabase RLS policies allow your domain

