#!/bin/bash

# Fix JNVST Question Tag Mappings
# Updates existing JNVST questions to use documentId for tag_exams and tag_years (Strapi v5)

echo "=================================================="
echo "Fixing JNVST Question Tag Mappings (Strapi v5)"
echo "=================================================="
echo ""

STRAPI_URL="http://localhost:1337"
API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

# DocumentIds for tags (Strapi v5 uses documentId for relations)
EXAM_DOC_ID="t2spwfc33jss0bxv5mz6ag50"  # JNVST
YEAR_DOC_ID="crp7e5nd4x9660o1y3o29x77"  # 2023

# JNVST Question IDs
QUESTION_IDS=(120 122 124 126 128 130 132 134 136)

echo "Tag Information:"
echo "  - Exam: JNVST (documentId: ${EXAM_DOC_ID})"
echo "  - Year: 2023 (documentId: ${YEAR_DOC_ID})"
echo ""
echo "Updating ${#QUESTION_IDS[@]} questions..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for Q_ID in "${QUESTION_IDS[@]}"; do
    echo -n "Updating Question ID ${Q_ID}... "
    
    # Update question with documentIds
    RESPONSE=$(curl -s -X PUT "${STRAPI_URL}/api/questions/${Q_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -d "{
            \"data\": {
                \"tag_exams\": [\"${EXAM_DOC_ID}\"],
                \"tag_years\": [\"${YEAR_DOC_ID}\"]
            }
        }")
    
    # Check if successful
    if echo "$RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
        echo "✓"
        ((SUCCESS_COUNT++))
    else
        echo "✗ Failed"
        echo "$RESPONSE" | jq '.' | head -20
        ((FAIL_COUNT++))
    fi
done

echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
echo "✓ Successfully updated: ${SUCCESS_COUNT} questions"
echo "✗ Failed to update: ${FAIL_COUNT} questions"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "Verification:"
    echo "View a question with tags:"
    echo "${STRAPI_URL}/api/questions/120?populate=tag_exams,tag_years"
    echo ""
    echo "Filter by JNVST exam:"
    echo "${STRAPI_URL}/api/questions?filters[tag_exams][documentId][\$eq]=${EXAM_DOC_ID}&populate=tag_exams,tag_years"
fi

echo ""
