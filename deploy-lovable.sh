#!/bin/bash

# 🚀 SMAP Project - Lovable Export Deployment Script
# This script prepares and deploys the SMAP project for Lovable platform

echo "🌍 Preparing SMAP Project for Lovable Export..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! Please check for errors."
    exit 1
fi

echo "✅ Build completed successfully!"

# Create Vercel configuration
echo "⚙️ Creating Vercel configuration..."
cat > vercel.json << EOF
{
  "rewrites": [
    {
      "source": "/demo",
      "destination": "/demo.html"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
EOF

echo "📋 Deployment Steps:"
echo ""
echo "1. 🚀 Deploy to Vercel:"
echo "   npx vercel --prod"
echo ""
echo "2. 🌐 Get your deployment URL"
echo ""
echo "3. 📝 Create Lovable Entry:"
echo "   - Go to https://lovable.dev"
echo "   - Create new project"
echo "   - Use your Vercel URL"
echo "   - Add description and screenshots"
echo ""
echo "4. 🎯 Demo URLs:"
echo "   - Main app: https://your-app.vercel.app"
echo "   - Demo version: https://your-app.vercel.app/demo"
echo ""
echo "🎉 Ready for Lovable export!"

# Optional: Open demo in browser
read -p "Would you like to preview the demo locally? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Starting local preview..."
    npm run dev &
    sleep 3
    open "http://localhost:8080/demo"
    echo "Demo opened in browser! Press Ctrl+C to stop the server."
    wait
fi 