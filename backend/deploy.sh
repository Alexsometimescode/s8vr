#!/bin/bash

# s8vr Backend Deployment Script for Hetzner
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main || git pull origin master

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Restart PM2 process
echo "🔄 Restarting backend..."
pm2 restart s8vr-backend || pm2 start dist/server.js --name s8vr-backend

# Show status
echo "✅ Deployment complete!"
echo ""
echo "📊 Current status:"
pm2 list
echo ""
echo "📝 Recent logs:"
pm2 logs s8vr-backend --lines 20 --nostream
