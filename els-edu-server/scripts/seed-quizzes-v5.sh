#!/bin/bash
set -e

API_URL="http://localhost:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

# Function to get documentId for a topic by name
get_topic_id() {
  local name="$1"
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/topics?filters[name][\$eq]=$name" | \
    python3 -c "import json,sys; data=json.load(sys.stdin)['data']; print(data[0]['documentId']) if data else print('')"
}

# Function to get subject ID (assuming BeBrainee for now)
get_subject_id() {
  curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/subjects?filters[name][\$eq]=BeBrainee" | \
    python3 -c "import json,sys; data=json.load(sys.stdin)['data']; print(data[0]['documentId']) if data else print('')"
}

echo "🔍 Fetching IDs..."
SUBJECT_ID=$(get_subject_id)
# Fallback if subject not found by name, use the one from user's previous context or list
if [ -z "$SUBJECT_ID" ]; then
    SUBJECT_ID="pmbwp36a1m1njlsmgfdmrk03" # Hardcoded fallback
fi

# Topics to seed
TOPICS=("MindCalculation" "ImpossibleToPossible" "Waste2Best")

for TOPIC_NAME in "${TOPICS[@]}"; do
    echo "----------------------------------------"
    echo "Processing: $TOPIC_NAME"
    
    TOPIC_ID=$(get_topic_id "$TOPIC_NAME")
    
    if [ -z "$TOPIC_ID" ]; then
        echo "⚠️  Topic '$TOPIC_NAME' not found. Skipping."
        continue
    fi
    
    echo "📍 Topic ID: $TOPIC_ID"

    # Create Quiz
    echo "📝 Creating Quiz..."
    QUIZ_PAYLOAD=$(cat <<EOF
{
  "data": {
    "title": "$TOPIC_NAME Quiz",
    "description": "Test your knowledge on $TOPIC_NAME!",
    "quizType": "standalone",
    "difficulty": "beginner",
    "isActive": true,
    "timeLimit": 5,
    "maxAttempts": 3,
    "passingScore": 70,
    "isRandomized": true,
    "showCorrectAnswers": "after-submission",
    "allowReview": true,
    "subject": {"connect": [{"documentId": "$SUBJECT_ID"}]},
    "topic": {"connect": [{"documentId": "$TOPIC_ID"}]}
  }
}
EOF
)

    QUIZ_RESPONSE=$(curl -s -X POST "$API_URL/quizzes" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$QUIZ_PAYLOAD")

    QUIZ_ID=$(echo "$QUIZ_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data', {}).get('documentId', ''))")

    if [ -z "$QUIZ_ID" ]; then
        echo "❌ Failed to create quiz."
        echo "Response: $QUIZ_RESPONSE"
        continue
    fi

    echo "✅ Quiz Created: $QUIZ_ID"

    # Create Questions
    echo "❓ Adding Questions..."
    
    # Question 1
    Q1_PAYLOAD=$(cat <<EOF
{
  "data": {
    "questionText": "Sample Question 1 for $TOPIC_NAME?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Option A is correct because...",
    "difficulty": "EASY",
    "quizzes": {"connect": [{"documentId": "$QUIZ_ID"}]}
  }
}
EOF
)
    curl -s -X POST "$API_URL/questions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$Q1_PAYLOAD" > /dev/null
      
    # Question 2
    Q2_PAYLOAD=$(cat <<EOF
{
  "data": {
    "questionText": "Sample Question 2 for $TOPIC_NAME?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1,
    "explanation": "Option B is correct because...",
    "difficulty": "MEDIUM",
    "quizzes": {"connect": [{"documentId": "$QUIZ_ID"}]}
  }
}
EOF
)
    curl -s -X POST "$API_URL/questions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$Q2_PAYLOAD" > /dev/null

    echo "✅ Questions Added."
done

echo "----------------------------------------"
echo "🎉 Seeding Completed!"
