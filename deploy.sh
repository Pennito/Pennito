#!/bin/bash

# IPenno Deployment Script for GitHub Pages
# This script builds the game and updates the docs folder

echo "🚀 Building IPenno..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix errors and try again."
    exit 1
fi

echo "📦 Copying files to docs folder..."
cp -r dist docs/
cp index.html docs/

echo "✅ Files copied to docs folder"
echo ""
echo "📝 Next steps:"
echo "1. Review changes: git status"
echo "2. Commit: git add docs/ && git commit -m 'Update game'"
echo "3. Push: git push origin main"
echo ""
echo "GitHub Pages will automatically update in 1-2 minutes!"
