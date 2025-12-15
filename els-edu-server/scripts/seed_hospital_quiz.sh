#!/bin/bash
set -e

API_URL="http://127.0.0.1:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

create_question() {
    local Q_TEXT="$1"
    local OPT_A="$2"
    local OPT_B="$3"
    local OPT_C="$4"
    local OPT_D="$5"
    local CORRECT_IDX="$6"
    local EXPLANATION="$7"
    local DIFFICULTY="$8"
    
    cat <<EOF > /tmp/q_payload.json
{
  "data": {
    "questionText": "$Q_TEXT",
    "options": ["$OPT_A", "$OPT_B", "$OPT_C", "$OPT_D"],
    "correctAnswers": [$CORRECT_IDX],
    "explanation": "$EXPLANATION",
    "difficulty": "$DIFFICULTY",
    "questionType": "SC"
  }
}
EOF

    curl -g -s -X POST "$API_URL/questions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d @/tmp/q_payload.json > /tmp/q_res.json
      
    Q_ID=$(cat /tmp/q_res.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data', {}).get('documentId', '') if d.get('data') else '')")
    
    if [ -z "$Q_ID" ]; then
        echo "❌ Failed to create question: $Q_TEXT" >&2
        cat /tmp/q_res.json >&2
    else
        echo "✓ Created Question: $Q_ID" >&2
        echo "$Q_ID"
    fi
}

link_quiz() {
    local TOPIC_ID="$1"
    local TITLE="$2"
    local DESC="$3"
    shift 3
    local Q_IDS=("$@")
    
    CONNECT_STR=""
    for qid in "${Q_IDS[@]}"; do
        if [ -n "$CONNECT_STR" ]; then CONNECT_STR="$CONNECT_STR, "; fi
        CONNECT_STR="${CONNECT_STR}{\"documentId\": \"$qid\"}"
    done

    cat <<EOF > /tmp/quiz_payload.json
{
  "data": {
    "title": "$TITLE",
    "description": "$DESC",
    "quizType": "standalone",
    "difficulty": "beginner",
    "isActive": true,
    "topic": {"connect": [{"documentId": "$TOPIC_ID"}]},
    "questions": {"connect": [$CONNECT_STR]}
  }
}
EOF

    curl -g -s -X POST "$API_URL/quizzes" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d @/tmp/quiz_payload.json > /tmp/quiz_res.json

    QUIZ_ID=$(cat /tmp/quiz_res.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data', {}).get('documentId', '') if d.get('data') else '')")
    
    if [ -z "$QUIZ_ID" ]; then
        echo "❌ Failed to create quiz: $TITLE" >&2
        cat /tmp/quiz_res.json >&2
    else
        echo "✅ Created Quiz '$TITLE': $QUIZ_ID" >&2
    fi
}

# hospital&Doctors
echo "--- hospital&Doctors ---"
# Use -G to encode params
curl -g -s -G "$API_URL/topics" -d "filters[name][\$eq]=hospital&Doctors" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -n "$T_ID" ]; then
    Q1=$(create_question "Who treats teeth?" "Cardiologist" "Dentist" "Neurologist" "Dermatologist" 1 "Dentists specialize in oral health." "easy")
    Q2=$(create_question "What is the emergency number for ambulance in India?" "100" "101" "102" "108" 3 "108 is the common emergency number." "easy")
    link_quiz "$T_ID" "Health & Safety Quiz" "Stay healthy!" "$Q1" "$Q2"
else
    echo "❌ Topic 'hospital&Doctors' not found."
    cat /tmp/topic_res.json
fi
