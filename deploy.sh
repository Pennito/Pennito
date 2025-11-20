#!/bin/bash

# Quick deployment script for IPenno
echo "🚀 Deploying IPenno Game..."

# Build the game
echo "📦 Building game..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "📋 Next steps:"
echo "1. For GitHub Pages:"
echo "   - Create a GitHub repository"
echo "   - Push this folder to GitHub"
echo "   - Enable GitHub Pages in repository settings"
echo ""
echo "2. For Netlify Drop:"
echo "   - Go to https://app.netlify.com/drop"
echo "   - Drag this entire folder onto the page"
echo ""
echo "3. For Vercel:"
echo "   - Run: npx vercel"
echo ""
echo "See DEPLOY_NOW.md for detailed instructions!"

