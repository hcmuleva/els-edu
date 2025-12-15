#!/bin/bash

# JNVST Question Creator - Simple Version
# This script creates Navodaya questions directly via Strapi API

echo "=================================================="
echo "Creating JNVST (Navodaya) Questions"
echo "=================================================="
echo ""

# Strapi URL and Token
STRAPI_URL="http://localhost:1337"
API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

# Function to create tag_exam
create_tag_exam() {
    echo "Creating Exam Tag: JNVST..."
    
    curl -X POST "${STRAPI_URL}/api/tag-exams" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -d '{
        "data": {
            "tag_exam": "JNVST",
            "publishedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
        }
    }' 2>/dev/null | jq -r '.data.id' > /tmp/jnvst_exam_id.txt
    
    EXAM_ID=$(cat /tmp/jnvst_exam_id.txt)
    echo "✓ Exam Tag Created (ID: $EXAM_ID)"
    echo ""
}

# Function to create tag_year
create_tag_year() {
    echo "Creating Year Tag: 2023..."
    
    curl -X POST "${STRAPI_URL}/api/tag-years" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -d '{
        "data": {
            "year": 2023,
            "publishedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
        }
    }' 2>/dev/null | jq -r '.data.id' > /tmp/jnvst_year_id.txt
    
    YEAR_ID=$(cat /tmp/jnvst_year_id.txt)
    echo "✓ Year Tag Created (ID: $YEAR_ID)"
    echo ""
}

# Function to create a question
create_question() {
    local QUESTION_TEXT="$1"
    local SUBJECT="$2"
    local CHAPTER="$3"
    local OPTIONS="$4"
    local CORRECT_ANSWER="$5"
    local EXPLANATION="$6"
    local DIFFICULTY="$7"
    
    EXAM_ID=$(cat /tmp/jnvst_exam_id.txt)
    YEAR_ID=$(cat /tmp/jnvst_year_id.txt)
    
    curl -X POST "${STRAPI_URL}/api/questions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -d "{
        \"data\": {
            \"questionText\": \"${QUESTION_TEXT}\",
            \"questionType\": \"SC\",
            \"points\": 1,
            \"timeLimit\": 60,
            \"explanation\": \"${EXPLANATION}\",
            \"difficulty\": \"${DIFFICULTY}\",
            \"subject\": \"${SUBJECT}\",
            \"chapter\": \"${CHAPTER}\",
            \"options\": ${OPTIONS},
            \"correctAnswers\": [\"${CORRECT_ANSWER}\"],
            \"shuffleOptions\": true,
            \"isActive\": true,
            \"tag_exams\": [${EXAM_ID}],
            \"tag_years\": [${YEAR_ID}],
            \"publishedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
        }
    }" 2>/dev/null | jq -r '.data.id'
}

# Check if Strapi is running
echo "Checking Strapi server..."
if ! curl -s "${STRAPI_URL}/_health" > /dev/null 2>&1; then
    echo "❌ Error: Strapi server is not running at ${STRAPI_URL}"
    echo "Please start Strapi first: npm run develop"
    exit 1
fi
echo "✓ Strapi server is running"
echo ""

# Create tags
create_tag_exam
create_tag_year

echo "=================================================="
echo "Creating Questions"
echo "=================================================="
echo ""

# Mental Ability Questions
echo "--- Mental Ability Questions ---"

echo "1. Creating Coding-Decoding question..."
Q_ID=$(create_question \
    "If in a certain code, MOTHER is written as NPUIFS, how is SISTER written?" \
    "Mental Ability" \
    "Coding-Decoding" \
    '[{"text":"TJTUFF","isCorrect":true},{"text":"TJTFUS","isCorrect":false},{"text":"TJTUFS","isCorrect":false},{"text":"TITUFS","isCorrect":false}]' \
    "TJTUFF" \
    "Each letter is replaced by the next letter in alphabetical order. S→T, I→J, S→T, T→U, E→F, R→S" \
    "medium")
echo "✓ Created (ID: $Q_ID)"

echo "2. Creating Odd One Out question..."
Q_ID=$(create_question \
    "Find the odd one out: 3, 5, 7, 12, 17" \
    "Mental Ability" \
    "Odd One Out" \
    '[{"text":"3","isCorrect":false},{"text":"5","isCorrect":false},{"text":"12","isCorrect":true},{"text":"17","isCorrect":false}]' \
    "12" \
    "All numbers except 12 are prime numbers." \
    "easy")
echo "✓ Created (ID: $Q_ID)"

echo "3. Creating Number Series question..."
Q_ID=$(create_question \
    "Complete the series: 2, 6, 12, 20, 30, ?" \
    "Mental Ability" \
    "Number Series" \
    '[{"text":"40","isCorrect":false},{"text":"42","isCorrect":true},{"text":"44","isCorrect":false},{"text":"48","isCorrect":false}]' \
    "42" \
    "The differences are 4, 6, 8, 10, 12. Next number is 30 + 12 = 42" \
    "medium")
echo "✓ Created (ID: $Q_ID)"

# Arithmetic Questions
echo ""
echo "--- Arithmetic Questions ---"

echo "1. Creating Time and Work question..."
Q_ID=$(create_question \
    "If 15 boys can complete a work in 10 days, in how many days can 25 boys complete the same work?" \
    "Arithmetic" \
    "Time and Work" \
    '[{"text":"6 days","isCorrect":true},{"text":"8 days","isCorrect":false},{"text":"12 days","isCorrect":false},{"text":"15 days","isCorrect":false}]' \
    "6 days" \
    "Using inverse proportion: 15 × 10 = 25 × x, x = 150/25 = 6 days" \
    "medium")
echo "✓ Created (ID: $Q_ID)"

echo "2. Creating Percentage question..."
Q_ID=$(create_question \
    "What is 25% of 80?" \
    "Arithmetic" \
    "Percentage" \
    '[{"text":"15","isCorrect":false},{"text":"20","isCorrect":true},{"text":"25","isCorrect":false},{"text":"30","isCorrect":false}]' \
    "20" \
    "25% of 80 = (25/100) × 80 = 20" \
    "easy")
echo "✓ Created (ID: $Q_ID)"

echo "3. Creating Speed and Distance question..."
Q_ID=$(create_question \
    "A train travels 300 km in 5 hours. What is its average speed?" \
    "Arithmetic" \
    "Speed and Distance" \
    '[{"text":"50 km/h","isCorrect":false},{"text":"60 km/h","isCorrect":true},{"text":"70 km/h","isCorrect":false},{"text":"80 km/h","isCorrect":false}]' \
    "60 km/h" \
    "Speed = Distance / Time = 300 / 5 = 60 km/h" \
    "easy")
echo "✓ Created (ID: $Q_ID)"

# Language Questions
echo ""
echo "--- Language Questions ---"

echo "1. Creating Synonyms question..."
Q_ID=$(create_question \
    "Choose the correct synonym of Happy:" \
    "Language" \
    "Synonyms" \
    '[{"text":"Sad","isCorrect":false},{"text":"Joyful","isCorrect":true},{"text":"Angry","isCorrect":false},{"text":"Tired","isCorrect":false}]' \
    "Joyful" \
    "Joyful means feeling or expressing great pleasure, same as happy." \
    "easy")
echo "✓ Created (ID: $Q_ID)"

echo "2. Creating Grammar question..."
Q_ID=$(create_question \
    "Fill in the blank: She _____ to school every day." \
    "Language" \
    "Grammar - Tenses" \
    '[{"text":"go","isCorrect":false},{"text":"goes","isCorrect":true},{"text":"going","isCorrect":false},{"text":"gone","isCorrect":false}]' \
    "goes" \
    "Goes is the correct present tense form for third person singular." \
    "easy")
echo "✓ Created (ID: $Q_ID)"

echo "3. Creating Antonyms question..."
Q_ID=$(create_question \
    "Choose the antonym of Ancient:" \
    "Language" \
    "Antonyms" \
    '[{"text":"Old","isCorrect":false},{"text":"Modern","isCorrect":true},{"text":"Historic","isCorrect":false},{"text":"Traditional","isCorrect":false}]' \
    "Modern" \
    "Modern is opposite of ancient, meaning relating to the present time." \
    "easy")
echo "✓ Created (ID: $Q_ID)"

echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
EXAM_ID=$(cat /tmp/jnvst_exam_id.txt)
YEAR_ID=$(cat /tmp/jnvst_year_id.txt)

echo "✓ Successfully created 9 JNVST questions!"
echo "✓ Tagged with Exam: JNVST (ID: $EXAM_ID)"
echo "✓ Tagged with Year: 2023 (ID: $YEAR_ID)"
echo ""
echo "View questions at: ${STRAPI_URL}/admin/content-manager/collectionType/api::question.question"
echo ""

# Cleanup temp files
rm -f /tmp/jnvst_exam_id.txt /tmp/jnvst_year_id.txt
