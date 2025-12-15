#!/bin/bash

# Link JNVST Questions to a Quiz
# This script associates the created JNVST questions with a specific quiz

echo "=================================================="
echo "Linking JNVST Questions to Quiz"
echo "=================================================="
echo ""

# Configuration
STRAPI_URL="http://localhost:1337"
API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

# JNVST Question IDs (from previous creation)
QUESTION_IDS="120,122,124,126,128,130,132,134,136"

# Get quiz ID from topic
TOPIC_DOC_ID="q9krtk39qjvuw4mwswyiwsqp"

echo "Step 1: Finding quiz for topic ${TOPIC_DOC_ID}..."

# First, get the topic to find its numeric ID
TOPIC_RESPONSE=$(curl -s "${STRAPI_URL}/api/topics?filters[documentId][\$eq]=${TOPIC_DOC_ID}&populate=quizzes" \
    -H "Authorization: Bearer ${API_TOKEN}")

echo "$TOPIC_RESPONSE" | jq '.' > /tmp/topic_response.json

TOPIC_ID=$(echo "$TOPIC_RESPONSE" | jq -r '.data[0].id')
TOPIC_NAME=$(echo "$TOPIC_RESPONSE" | jq -r '.data[0].attributes.name')

if [ "$TOPIC_ID" == "null" ] || [ -z "$TOPIC_ID" ]; then
    echo "❌ Topic not found with documentId: ${TOPIC_DOC_ID}"
    echo ""
    echo "Let me list all topics to help you find the right one:"
    curl -s "${STRAPI_URL}/api/topics?pagination[pageSize]=100" \
        -H "Authorization: Bearer ${API_TOKEN}" | jq '.data[] | {id, documentId: .documentId, name: .attributes.name}'
    exit 1
fi

echo "✓ Found topic: ${TOPIC_NAME} (ID: ${TOPIC_ID})"

# Get quizzes for this topic
echo ""
echo "Step 2: Finding quizzes for this topic..."

QUIZ_RESPONSE=$(curl -s "${STRAPI_URL}/api/quizzes?filters[topic][id][\$eq]=${TOPIC_ID}&populate=questions" \
    -H "Authorization: Bearer ${API_TOKEN}")

echo "$QUIZ_RESPONSE" | jq '.' > /tmp/quiz_response.json

QUIZ_COUNT=$(echo "$QUIZ_RESPONSE" | jq '.data | length')

if [ "$QUIZ_COUNT" == "0" ]; then
    echo "❌ No quiz found for this topic."
    echo ""
    echo "Creating a new JNVST quiz for this topic..."
    
    # Create new quiz
    CREATE_RESPONSE=$(curl -s -X POST "${STRAPI_URL}/api/quizzes" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -d "{
            \"data\": {
                \"title\": \"JNVST Practice Quiz 2023\",
                \"description\": \"Navodaya Entrance Exam practice questions covering Mental Ability, Arithmetic, and Language\",
                \"topic\": ${TOPIC_ID},
                \"questions\": [${QUESTION_IDS}],
                \"timeLimit\": 540,
                \"passingScore\": 60,
                \"totalMarks\": 9,
                \"isActive\": true,
                \"publishedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
            }
        }")
    
    QUIZ_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
    echo "✓ Created new quiz (ID: ${QUIZ_ID})"
else
    # Use existing quiz
    QUIZ_ID=$(echo "$QUIZ_RESPONSE" | jq -r '.data[0].id')
    QUIZ_TITLE=$(echo "$QUIZ_RESPONSE" | jq -r '.data[0].attributes.title')
    
    echo "✓ Found existing quiz: ${QUIZ_TITLE} (ID: ${QUIZ_ID})"
    
    # Get existing question IDs
    EXISTING_QUESTIONS=$(echo "$QUIZ_RESPONSE" | jq -r '.data[0].attributes.questions.data[]?.id' | tr '\n' ',' | sed 's/,$//')
    
    # Combine with new questions (remove duplicates)
    if [ -n "$EXISTING_QUESTIONS" ]; then
        ALL_QUESTIONS="${EXISTING_QUESTIONS},${QUESTION_IDS}"
    else
        ALL_QUESTIONS="${QUESTION_IDS}"
    fi
    
    # Remove duplicates
    ALL_QUESTIONS=$(echo "$ALL_QUESTIONS" | tr ',' '\n' | sort -u | tr '\n' ',' | sed 's/,$//')
    
    echo ""
    echo "Step 3: Updating quiz with JNVST questions..."
    
    # Update quiz
    UPDATE_RESPONSE=$(curl -s -X PUT "${STRAPI_URL}/api/quizzes/${QUIZ_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -d "{
            \"data\": {
                \"questions\": [${ALL_QUESTIONS}]
            }
        }")
    
    echo "$UPDATE_RESPONSE" | jq '.' > /tmp/update_response.json
    
    UPDATED_COUNT=$(echo "$UPDATE_RESPONSE" | jq -r '.data.attributes.questions.data | length')
    echo "✓ Quiz updated with ${UPDATED_COUNT} total questions"
fi

echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
echo "✓ Successfully linked JNVST questions to quiz!"
echo "  - Topic: ${TOPIC_NAME}"
echo "  - Quiz ID: ${QUIZ_ID}"
echo "  - JNVST Questions Added: 9"
echo ""
echo "View quiz at:"
echo "${STRAPI_URL}/admin/content-manager/collectionType/api::quiz.quiz/${QUIZ_ID}"
echo ""
echo "Test quiz at:"
echo "${STRAPI_URL}/api/quizzes/${QUIZ_ID}?populate=questions,topic"
echo ""

# Cleanup
rm -f /tmp/topic_response.json /tmp/quiz_response.json /tmp/update_response.json
