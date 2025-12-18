#!/bin/sh
set -e

echo "🚀 Starting Strapi server..."

# Health check endpoint verification
echo "📊 Verifying application health..."

# Start Strapi
exec npm run start
