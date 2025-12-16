#!/bin/bash

# Educational Data Seeding Script
# This script sets up the complete organizational structure with courses, subjects, and pricing

echo "🌱 Starting Educational Data Seeding Process..."
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the els-edu-server root directory"
    exit 1
fi\n\n# Accept JWT token as first argument
if [ -n "$1" ]; then
    export STRAPI_API_TOKEN="$1"
    echo "🔑 Using provided JWT token"
fi

# Load environment variables
if [ -f ".env" ]; then
    echo "📋 Loading environment variables from .env..."
    source .env
else
    echo "⚠️  Warning: .env file not found, using defaults"
fi

# Set default values if not in environment
export STRAPI_API_URL=${STRAPI_API_URL:-"http://localhost:1337"}\n\n# Check if Strapi server is running
echo "🔍 Checking if Strapi server is running..."
if ! curl -s "$STRAPI_API_URL/admin" > /dev/null; then
    echo "❌ Error: Strapi server is not running at $STRAPI_API_URL"
    echo "   Please start the server with: npm run develop"
    exit 1
fi

echo "✅ Strapi server is running"

# Check if API token is available
if [ -z "$STRAPI_API_TOKEN" ]; then
    echo "⚠️  Warning: STRAPI_API_TOKEN not set"
    echo "   Usage: $0 <jwt_token>"
    echo "   Or set STRAPI_API_TOKEN environment variable"
    exit 1
else
    echo "🔑 API token configured"
fi\n\n# Install dependencies if needed
echo "📦 Checking dependencies..."
npm list axios > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📦 Installing axios dependency..."
    npm install axios
fi

# Make the script executable
chmod +x scripts/seed-educational-structure.js

# Run the seeding script
echo "🚀 Running educational data seeding..."
node scripts/seed-educational-structure.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Educational data seeding completed successfully!"
    echo ""
    echo "📋 What was created:"
    echo "   ✅ 2 Organizations (TechEd Solutions & EduCare Learning)"
    echo "   ✅ 4 Courses (2 per organization)"
    echo "   ✅ 12 Subjects (3 per course)"
    echo "   ✅ Course pricing with bundle discounts"
    echo "   ✅ Subject pricing with individual discounts"
    echo "   ✅ GST calculations (18%)"
    echo "   ✅ Sample invoices"
    echo ""
    echo "🔗 Next steps:"
    echo "   1. Check the Strapi admin panel to verify the data"
    echo "   2. Set up authentication roles for the new collections"
    echo "   3. Update the React-Admin data provider"
else
    echo ""
    echo "❌ Educational data seeding failed!"
    echo "   Please check the error messages above and try again."
    exit 1
fi