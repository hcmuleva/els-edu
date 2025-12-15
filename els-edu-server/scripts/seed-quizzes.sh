#!/bin/bash

API_URL="http://localhost:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

echo "🎯 Creating Quizzes..."

# Get topic ID for MindCalculation
TOPIC_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_URL/topics?filters[name][\$eq]=MindCalculation" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['documentId'] if d['data'] else '')")

if [ -z "$TOPIC_ID" ]; then
  echo "❌ Could not find Mind Calculation topic"
  exit 1
fi

echo "✓ Found MindCalculation topic: $TOPIC_ID"

# Get subject ID (BeBrainee)
SUBJECT_ID="pmbwp36a1m1njlsmgfdmrk03"

# Create quiz
QUIZ_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/quizzes" \
  -d "{
    \"data\": {
      \"title\": \"Mind Calculation Quiz\",
      \"description\": \"Test your math skills!\",
      \"difficulty\": \"EASY\",
      \"timeLimit\": 5
    }
  }")

QUIZ_ID=$(echo "$QUIZ_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['documentId'] if 'data' in d else '')")

if [ -z "$QUIZ_ID" ]; then
  echo "❌ Failed to create quiz"
  echo "$QUIZ_RESPONSE"
  exit 1
fi

echo "✓ Created quiz: $QUIZ_ID"

# Update quiz with relationships
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/quizzes/$QUIZ_ID" \
  -d "{
    \"data\": {
      \"subject\": {\"connect\": [{\"documentId\": \"$SUBJECT_ID\"}]},
      \"topic\": {\"connect\": [{\"documentId\": \"$TOPIC_ID\"}]}
    }
  }" > /dev/null

echo "✓ Updated quiz relationships"

# Create questions
echo "Creating questions..."

# Question 1
Q1=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/questions" \
  -d '{
    "data": {
      "questionText": "What is 25 + 25?",
      "options": ["40", "45", "50", "55"],
      "correctAnswer": 2,
      "explanation": "25 + 25 = 50!",
      "difficulty": "EASY"
    }
  }' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['documentId'] if 'data' in d else '')")

echo -n "."

# Question 2
Q2=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/questions" \
  -d '{
    "data": {
      "questionText": "If you have 3 groups of 4 apples, how many apples in total?",
      "options": ["7", "10", "12", "16"],
      "correctAnswer": 2,
      "explanation": "3 × 4 = 12 apples!",
      "difficulty": "MEDIUM"
    }
  }' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['documentId'] if 'data' in d else '')")

echo -n "."

# Question 3
Q3=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/questions" \
  -d '{
    "data": {
      "questionText": "What is 100 - 37?",
      "options": ["53", "63", "73", "83"],
      "correctAnswer": 1,
      "explanation": "100 - 37 = 63!",
      "difficulty": "MEDIUM"
    }
  }' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data' in d else '')")

echo ""
echo "✓ Created 3 questions"

# Link questions to quiz
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/quizzes/$QUIZ_ID" \
  -d "{
    \"data\": {
      \"questions\": {\"connect\": [
        {\"documentId\": \"$Q1\"},
        {\"documentId\": \"$Q2\"},
        {\"documentId\": \"$Q3\"}
      ]}
    }
  }" > /dev/null

echo "✓ Linked questions to quiz"
echo "✅ Quiz seeding completed!"
