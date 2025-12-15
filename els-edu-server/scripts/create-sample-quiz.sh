#!/bin/bash

API_URL="http://localhost:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

echo "🎯 Creating Sample Quiz..."

# Create quiz for ImpossibleToPossible topic
# Using known documentIds from database

QUIZ_JSON='{
  "data": {
    "title": "Impossible To Possible Quiz",
    "description": "Test your knowledge!",
    "difficulty": "EASY",
    "timeLimit": 5,
    "subject": {"connect": [{"documentId": "pmbwp36a1m1njlsmgfdmrk03"}]},
    "topic": {"connect": [{"documentId": "dszn2q71zsbblv6ojshfp5is"}]}
  }
}'

QUIZ_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/quizzes" \
  -d "$QUIZ_JSON")

QUIZ_ID=$(echo "$QUIZ_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data', {}).get('documentId', ''))" 2>/dev/null)

if [ -z "$QUIZ_ID" ]; then
  echo "❌ Failed to create quiz"
  echo "$QUIZ_RESPONSE"
  exit 1
fi

echo "✓ Created quiz: $QUIZ_ID"

# Create Question 1
Q1_JSON='{
  "data": {
    "questionText": "What does impossible become when you believe in yourself?",
    "options": ["Still impossible", "I'\''m possible", "Maybe possible", "Definitely impossible"],
    "correctAnswer": 1,
    "explanation": "When you add I'\''m before possible, impossible becomes I'\''m possible!",
    "difficulty": "EASY",
    "quizzes": {"connect": [{"documentId": "'"$QUIZ_ID"'"}]}
  }
}'

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/questions" \
  -d "$Q1_JSON" > /dev/null

echo "✓ Created question 1"

# Create Question 2
Q2_JSON='{
  "data": {
    "questionText": "Which quality helps turn impossible tasks into possible achievements?",
    "options": ["Giving up quickly", "Hard work and determination", "Waiting for others", "Avoiding challenges"],
    "correctAnswer": 1,
    "explanation": "Hard work and determination help us overcome difficulties!",
    "difficulty": "MEDIUM",
    "quizzes": {"connect": [{"documentId": "'"$QUIZ_ID"'"}]}
  }
}'

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/questions" \
  -d "$Q2_JSON" > /dev/null

echo "✓ Created question 2"

# Create Question 3
Q3_JSON='{
  "data": {
    "questionText": "What is the first step to achieve something impossible?",
    "options": ["Give up immediately", "Believe you can do it", "Wait for magic", "Do nothing"],
    "correctAnswer": 1,
    "explanation": "Believing in yourself is the first step to achieving anything!",
    "difficulty": "EASY",
    "quizzes": {"connect": [{"documentId": "'"$QUIZ_ID"'"}]}
  }
}'

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/questions" \
  -d "$Q3_JSON" > /dev/null

echo "✓ Created question 3"
echo "✅ Quiz creation completed!"
echo "Quiz ID: $QUIZ_ID"
echo "Topic: ImpossibleToPossible"
