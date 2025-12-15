#!/bin/bash
set -e

API_URL="http://127.0.0.1:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

echo "🔍 Finding Topic 'MindCalculation'..."
# Fetch all topics and grep for the ID of MindCalculation
# We assume the name is unique and present.
# We use python just for simple extraction if possible, or grep/sed.
# Given python issues, let's try to be robust with grep/sed or just python one-liner that doesn't read stdin if that was the issue?
# The issue was JSONDecodeError on empty input.
# Let's use a temp file.

curl -g -v -s "$API_URL/topics?filters[name][\$eq]=MindCalculation" -H "Authorization: Bearer $TOKEN" > /tmp/topic_response.json

TOPIC_ID=$(cat /tmp/topic_response.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -z "$TOPIC_ID" ]; then
  echo "❌ Topic 'MindCalculation' not found."
  cat /tmp/topic_response.json
  exit 1
fi
echo "✓ Found Topic ID: $TOPIC_ID"

echo "❓ Creating Questions..."

# Q1
curl -g -v -s -X POST "$API_URL/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "questionText": "What is 15 + 15?",
      "options": ["20", "25", "30", "35"],
      "correctAnswers": [2],
      "explanation": "15 + 15 is 30.",
      "difficulty": "easy",
      "questionType": "SC"
    }
  }' > /tmp/q1_response.json

Q1_ID=$(cat /tmp/q1_response.json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['documentId'])")
echo "✓ Created Q1: $Q1_ID"

# Q2
curl -g -v -s -X POST "$API_URL/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "questionText": "What is 100 - 50?",
      "options": ["40", "50", "60", "70"],
      "correctAnswers": [1],
      "explanation": "100 - 50 is 50.",
      "difficulty": "easy",
      "questionType": "SC"
    }
  }' > /tmp/q2_response.json

Q2_ID=$(cat /tmp/q2_response.json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['documentId'])")
echo "✓ Created Q2: $Q2_ID"

echo "📝 Creating Quiz..."

curl -s -X POST "$API_URL/quizzes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"title\": \"Mind Calculation Quiz\",
      \"description\": \"Test your mental math skills!\",
      \"quizType\": \"standalone\",
      \"difficulty\": \"beginner\",
      \"isActive\": true,
      \"topic\": {\"connect\": [{\"documentId\": \"$TOPIC_ID\"}]},
      \"questions\": {\"connect\": [{\"documentId\": \"$Q1_ID\"}, {\"documentId\": \"$Q2_ID\"}]}
    }
  }" > /tmp/quiz_response.json

QUIZ_ID=$(cat /tmp/quiz_response.json | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['documentId'])")
echo "✅ Created Quiz: $QUIZ_ID"

rm /tmp/topic_response.json /tmp/q1_response.json /tmp/q2_response.json /tmp/quiz_response.json
