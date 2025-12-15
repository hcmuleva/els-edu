#!/bin/bash

# Quick cleanup script for questions with generic options
# This script uses curl and jq to find and delete questions with placeholder options

set -e

API_URL="${API_URL:-http://localhost:1337}"
TOKEN="${BEARER_TOKEN:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0NjQ2NDUzLCJleHAiOjE3NjcyMzg0NTN9.jLD62cozlLtpijLSnWDQWRCU7BbCynMmGVQGZ12REgI}"

DRY_RUN="${DRY_RUN:-true}"

echo "=================================================="
echo "Question Cleanup Script"
echo "=================================================="
echo "API URL: $API_URL"
echo "Dry Run: $DRY_RUN"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required but not installed."
    echo "   Install it with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# Fetch all questions
echo "📦 Fetching all questions..."
TEMP_FILE=$(mktemp)
curl -s -X GET "${API_URL}/api/questions?pagination[pageSize]=1000&populate=*" \
    -H "Authorization: Bearer ${TOKEN}" > "$TEMP_FILE"

TOTAL_QUESTIONS=$(jq '.data | length' "$TEMP_FILE")
echo "✅ Found $TOTAL_QUESTIONS questions"
echo ""

# Filter questions with generic options
echo "🔍 Filtering questions with generic options..."
GENERIC_QUESTIONS=$(jq -r '.data[] | select(
    (.options | type == "array") and 
    (
        (.options | length == 2 and .[0].text == "Option A" and .[1].text == "Option B") or
        (.options | map(.text) | all(. == "Option A" or . == "Option B" or . == "Option C" or . == "Option D"))
    )
) | {id: .documentId, text: .questionText, options: .options}' "$TEMP_FILE")

GENERIC_COUNT=$(echo "$GENERIC_QUESTIONS" | jq -s 'length')
echo "✅ Found $GENERIC_COUNT questions with generic options"
echo ""

if [ "$GENERIC_COUNT" -eq 0 ]; then
    echo "✅ No generic questions found. Nothing to clean up!"
    rm "$TEMP_FILE"
    exit 0
fi

# Display questions to be deleted
echo "📋 Questions to be deleted:"
echo "$GENERIC_QUESTIONS" | jq -r '. | "  - ID: \(.id)\n    Text: \(.text[:60])..."'
echo ""

if [ "$DRY_RUN" = "true" ]; then
    echo "⚠️  DRY RUN MODE: No questions were deleted."
    echo "   To actually delete, set DRY_RUN=false"
    rm "$TEMP_FILE"
    exit 0
fi

# Confirm deletion
echo "⚠️  WARNING: About to delete $GENERIC_COUNT questions!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelled."
    rm "$TEMP_FILE"
    exit 0
fi

# Delete questions
echo ""
echo "🗑️  Deleting questions..."
DELETED=0
FAILED=0

echo "$GENERIC_QUESTIONS" | jq -r '.id' | while read -r Q_ID; do
    echo -n "Deleting question $Q_ID... "
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${API_URL}/api/questions/${Q_ID}" \
        -H "Authorization: Bearer ${TOKEN}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅"
        ((DELETED++))
    else
        echo "❌ (HTTP $HTTP_CODE)"
        ((FAILED++))
    fi
    
    sleep 0.1
done

echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
echo "✅ Deleted: $DELETED questions"
echo "❌ Failed: $FAILED questions"
echo ""

rm "$TEMP_FILE"


