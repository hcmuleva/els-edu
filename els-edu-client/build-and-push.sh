#!/bin/bash

# Build and push script for ELS Kids Client
# The .env file is copied during build automatically

set -e

echo "🔍 Checking if .env file exists..."
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your production environment variables"
    exit 1
fi

echo "✅ .env file found"
echo "🏗️  Building ELS Kids Client..."

docker build --no-cache -t harishdell/els-kids:1.7 .

echo "✅ Build complete!"

read -p "🚀 Push to Docker Hub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "📤 Pushing to Docker Hub..."
    docker push harishdell/els-kids:1.7
    echo "✅ Successfully pushed to Docker Hub!"
    echo "🔄 Now run 'docker-compose pull && docker-compose up -d' on your server"
else
    echo "❌ Push cancelled"
fi
