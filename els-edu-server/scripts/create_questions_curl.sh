#!/bin/bash
set -e

API_URL="http://127.0.0.1:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

echo "🔍 Finding Topic 'MindCalculation'..."
# Get Topic ID
TOPIC_ID=$(curl -s "$API_URL/topics?filters[name][\$eq]=MindCalculation" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -z "$TOPIC_ID" ]; then
  echo "❌ Topic 'MindCalculation' not found."
  exit 1
fi
echo "✓ Found Topic ID: $TOPIC_ID"

# Find Quiz
echo "🔍 Finding Quiz..."
# We'll just use the one we know or find one linked
# Let's try to find one linked to the topic
QUIZ_ID=$(curl -s "$API_URL/quizzes?populate=topic" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import json,sys; 
data=json.load(sys.stdin)['data']; 
found=None; 
target='$TOPIC_ID';
for q in data:
  t = q.get('topic');
  if t and isinstance(t, list):
    for sub in t:
      if sub.get('documentId') == target: found=q['documentId']; break
  elif t and isinstance(t, dict):
    if t.get('documentId') == target: found=q['documentId']
  if found: break
print(found if found else '')")

if [ -z "$QUIZ_ID" ]; then
  echo "⚠️ No linked quiz found. Using fallback ID 'skgtl02cogac2s8paxsx6wx5' and linking it."
  QUIZ_ID="skgtl02cogac2s8paxsx6wx5"
  
  # Link it
  curl -s -X PUT "$API_URL/quizzes/$QUIZ_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"data\": {
        \"topic\": {\"connect\": [{\"documentId\": \"$TOPIC_ID\"}]},
        \"isActive\": true
      }
    }" > /dev/null
    echo "✓ Linked Quiz"
else
  echo "✓ Found Quiz ID: $QUIZ_ID"
fi

echo "❓ Creating Questions..."

# Question 1
curl -s -X POST "$API_URL/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "questionText": "What is 15 + 15?",
      "options": ["20", "25", "30", "35"],
      "correctAnswers": [2],
      "explanation": "15 + 15 is 30.",
      "difficulty": "easy",
      "questionType": "SC",
      "quizzes": {"connect": [{"documentId": "'"$QUIZ_ID"'"}]}
    }
  }' > /dev/null && echo "✓ Created Q1"

# Question 2
curl -s -X POST "$API_URL/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "questionText": "What is 100 - 50?",
      "options": ["40", "50", "60", "70"],
      "correctAnswers": [1],
      "explanation": "100 - 50 is 50.",
      "difficulty": "easy",
      "questionType": "SC",
      "quizzes": {"connect": [{"documentId": "'"$QUIZ_ID"'"}]}
    }
  }' > /dev/null && echo "✓ Created Q2"

echo "✅ Done!"
