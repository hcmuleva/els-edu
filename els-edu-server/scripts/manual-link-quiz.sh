#!/bin/bash
set -e

API_URL="http://localhost:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

# IDs
QUIZ_ID="skgtl02cogac2s8paxsx6wx5"
# I will replace this with the actual ID found from the previous command if needed, 
# but for now I'll assume I can get it or use a known one.
# Let's assume I'll get the ID from the output of the previous command.
# If the previous command failed, I'll have to look at the output.
# For this script, I'll fetch it again simply.

echo "🔍 Getting Topic ID..."
TOPIC_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/topics?filters[name][\$eq]=MindCalculation")
TOPIC_ID=$(echo "$TOPIC_RESPONSE" | grep -o '"documentId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TOPIC_ID" ]; then
  echo "❌ Topic ID not found for MindCalculation"
  echo "Response: $TOPIC_RESPONSE"
  exit 1
fi

echo "✓ Topic ID: $TOPIC_ID"
echo "✓ Quiz ID: $QUIZ_ID"

echo "🔗 Linking Quiz to Topic..."
# Link Quiz to Topic
curl -s -X PUT "$API_URL/quizzes/$QUIZ_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"topic\": {\"connect\": [{\"documentId\": \"$TOPIC_ID\"}]}
    }
  }" > /dev/null

echo "✓ Linked Quiz to Topic"

echo "❓ Adding Questions..."
# Add Questions
Q1_PAYLOAD='{
  "data": {
    "questionText": "What is 15 + 15?",
    "options": ["20", "25", "30", "35"],
    "correctAnswer": 2,
    "explanation": "15 + 15 is 30.",
    "difficulty": "EASY",
    "quizzes": {"connect": [{"documentId": "'"$QUIZ_ID"'"}]}
  }
}'

curl -s -X POST "$API_URL/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$Q1_PAYLOAD" > /dev/null

echo "✓ Added Question 1"

Q2_PAYLOAD='{
  "data": {
    "questionText": "What is 50 - 25?",
    "options": ["20", "25", "30", "15"],
    "correctAnswer": 1,
    "explanation": "50 minus 25 is 25.",
    "difficulty": "EASY",
    "quizzes": {"connect": [{"documentId": "'"$QUIZ_ID"'"}]}
  }
}'

curl -s -X POST "$API_URL/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$Q2_PAYLOAD" > /dev/null

echo "✓ Added Question 2"

echo "✅ Manual setup complete!"
