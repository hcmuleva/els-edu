#!/bin/bash

# Create or Update JNVST Quiz
# Simple script to create a standalone JNVST quiz with the questions we created

echo "=================================================="
echo "Creating JNVST Standalone Quiz"
echo "=================================================="
echo ""

STRAPI_URL="http://localhost:1337"
API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

# JNVST Question IDs
QUESTION_IDS="[120, 122, 124, 126, 128, 130, 132, 134, 136]"

# If you want to add to an existing quiz, provide the quiz ID as first argument
if [ -n "$1" ]; then
    QUIZ_ID=$1
    echo "Updating existing quiz ID: ${QUIZ_ID}"
    echo ""
    
    # Update quiz
    RESPONSE=$(curl -s -X PUT "${STRAPI_URL}/api/quizzes/${QUIZ_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -d "{
            \"data\": {
                \"questions\": ${QUESTION_IDS}
            }
        }")
    
    echo "$RESPONSE" | jq '.'
    
    if echo "$RESPONSE" | jq -e '.data.id' > /dev/null; then
        echo ""
        echo "✓ Successfully updated quiz ${QUIZ_ID} with 9 JNVST questions!"
        echo ""
        echo "View at: ${STRAPI_URL}/admin/content-manager/collectionType/api::quiz.quiz/${QUIZ_ID}"
        echo "API: ${STRAPI_URL}/api/quizzes/${QUIZ_ID}?populate=questions"
    else
        echo "❌ Failed to update quiz"
    fi
else
    echo "Creating new standalone JNVST quiz..."
    echo ""
    
    # Create new quiz
    RESPONSE=$(curl -s -X POST "${STRAPI_URL}/api/quizzes" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -d "{
            \"data\": {
                \"title\": \"JNVST Practice Test 2023\",
                \"description\": \"Comprehensive Navodaya Entrance Exam practice covering Mental Ability (3), Arithmetic (3), and Language (3) totaling 9 questions.\",
                \"questions\": ${QUESTION_IDS},
                \"timeLimit\": 540,
                \"passingScore\": 60,
                \"totalMarks\": 9,
                \"isActive\": true,
                \"publishedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
            }
        }")
    
    echo "$RESPONSE" | jq '.'
    
    QUIZ_ID=$(echo "$RESPONSE" | jq -r '.data.id')
    
    if [ "$QUIZ_ID" != "null" ] && [ -n "$QUIZ_ID" ]; then
        echo ""
        echo "✓ Successfully created JNVST quiz (ID: ${QUIZ_ID}) with 9 questions!"
        echo ""
        echo "View at: ${STRAPI_URL}/admin/content-manager/collectionType/api::quiz.quiz/${QUIZ_ID}"
        echo "API: ${STRAPI_URL}/api/quizzes/${QUIZ_ID}?populate=questions"
        echo ""
        echo "NOTE: This quiz is not linked to any topic yet."
        echo "To link to a topic, edit the quiz in admin panel and select the topic."
    else
        echo "❌ Failed to create quiz"
    fi
fi

echo ""
