#!/bin/bash
set -e

API="http://localhost:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

echo "🎯 Creating Quiz..."

# Create quiz
QUIZ=$(curl -s -X POST "$API/quizzes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "Impossible To Possible Quiz",
      "description": "Can you do the impossible?",
      "difficulty": "EASY",
      "timeLimit": 5,
      "subject": {"connect": [{"documentId": "pmbwp36a1m1njlsmgfdmrk03"}]},
      "topic": {"connect": [{"documentId": "dszn2q71zsbblv6ojshfp5is"}]}
    }
  }')

QID=$(echo "$QUIZ" | grep -o '"documentId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$QID" ]; then
  echo "❌ Failed to create quiz"
  echo "$QUIZ"
  exit 1
fi

echo "✓ Quiz ID: $QID"

# Question 1
curl -s -X POST "$API/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"questionText\": \"What does 'impossible' become when you believe in yourself?\",
      \"options\": [\"Still impossible\", \"I'm possible\", \"Maybe possible\", \"Definitely impossible\"],
      \"correctAnswer\": 1,
      \"explanation\": \"When you add I'm before possible, impossible becomes I'm possible!\",
      \"difficulty\": \"EASY\",
      \"quizzes\": {\"connect\": [{\"documentId\": \"$QID\"}]}
    }
  }" > /dev/null && echo "✓ Q1"

# Question 2
curl -s -X POST "$API/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"questionText\": \"Which quality helps turn impossible tasks into possible achievements?\",
      \"options\": [\"Giving up quickly\", \"Hard work and determination\", \"Waiting for others\", \"Avoiding challenges\"],
      \"correctAnswer\": 1,
      \"explanation\": \"Hard work and determination help us overcome difficulties!\",
      \"difficulty\": \"MEDIUM\",
      \"quizzes\": {\"connect\": [{\"documentId\": \"$QID\"}]}
    }
  }" > /dev/null && echo "✓ Q2"

# Question 3
curl -s -X POST "$API/questions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": {
      \"questionText\": \"What is the first step to achieve something impossible?\",
      \"options\": [\"Give up immediately\", \"Believe you can do it\", \"Wait for magic\", \"Do nothing\"],
      \"correctAnswer\": 1,
      \"explanation\": \"Believing in yourself is the first step to achieving anything!\",
      \"difficulty\": \"EASY\",
      \"quizzes\": {\"connect\": [{\"documentId\": \"$QID\"}]}
    }
  }" > /dev/null && echo "✓ Q3"

echo "✅ Done! Quiz for ImpossibleToPossible created with 3 questions"
