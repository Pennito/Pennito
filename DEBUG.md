# Debug Guide

If the game is stuck on a blank screen, follow these steps:

## 1. Check Browser Console

1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Look for:
   - Red error messages
   - "Game script loading..." message
   - "Initializing app..." message
   - "Canvas found, creating app..." message
   - "App started!" message

## 2. Check Network Tab

1. Go to **Network** tab in Developer Tools
2. Refresh the page
3. Look for:
   - `main.js` - should load with status 200
   - Any files with status 404 (not found)
   - Any files with status 500 (server error)

## 3. Common Issues

### Issue: Blank Canvas
**Solution**: Check if JavaScript is loading
- Look for console errors
- Verify `dist/main.js` exists
- Check if server is running on correct port

### Issue: Module Import Errors
**Solution**: Check if all `.js` extensions are correct
- All imports should have `.js` extension
- Rebuild: `npm run build`

### Issue: Supabase Connection Errors
**Solution**: Supabase is optional - it falls back to localStorage
- Check console for Supabase errors
- Game should still work with localStorage
- To disable Supabase, leave URL/KEY as placeholders

### Issue: Login Screen Not Rendering
**Solution**: 
- Check if `loginScreen` is initialized
- Look for render errors in console
- Try hard refresh (Cmd+Shift+R)

## 4. Quick Fixes

1. **Hard Refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear Cache**: Clear browser cache and reload
3. **Rebuild**: Run `npm run build` again
4. **Check Server**: Make sure server is running on port 8000

## 5. Test Without Supabase

If Supabase is causing issues, the game should work with localStorage only:
- Leave Supabase URL/KEY as placeholders in `src/network/supabase.ts`
- Game will automatically use localStorage
- All features work except online sync

## 6. Verify Files

Make sure these files exist:
- `dist/main.js`
- `dist/screens/login.js`
- `dist/screens/worldSelect.js`
- `dist/screens/game.js`
- `dist/network/sync.js`
- `dist/network/supabase.js`

If any are missing, run `npm run build`


