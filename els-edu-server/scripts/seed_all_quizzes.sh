#!/bin/bash
set -e

API_URL="http://127.0.0.1:1337/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

# Function to create a quiz for a topic
create_quiz() {
    local TOPIC_NAME="$1"
    local QUIZ_TITLE="$2"
    local QUIZ_DESC="$3"
    shift 3
    local QUESTIONS_JSON="$@"

    echo "---------------------------------------------------"
    echo "🚀 Processing Topic: $TOPIC_NAME"

    # 1. Get Topic ID
    curl -g -s "$API_URL/topics?filters[name][\$eq]=$TOPIC_NAME" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
    TOPIC_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

    if [ -z "$TOPIC_ID" ]; then
        echo "⚠️  Topic '$TOPIC_NAME' not found. Skipping."
        return
    fi
    echo "✓ Found Topic ID: $TOPIC_ID"

    # 2. Create Questions and collect IDs
    Q_IDS=()
    
    # Iterate through questions (passed as a JSON array string, parsed by python to loop)
    # To simplify bash, I'll write the questions json to a file and read it with python to generate curl commands?
    # Or simpler: Just hardcode calls for each topic in the main block.
    # Let's do the latter for clarity and less bash-gymnastics.
}

create_question() {
    local Q_TEXT="$1"
    local OPT_A="$2"
    local OPT_B="$3"
    local OPT_C="$4"
    local OPT_D="$5"
    local CORRECT_IDX="$6" # 0-3
    local EXPLANATION="$7"
    local DIFFICULTY="$8"
    
    # Construct JSON
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
    
    # Construct connect array string: {"documentId": "id1"}, {"documentId": "id2"}
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

# ==========================================
# 1. ImpossibleToPossible
# ==========================================
echo "--- ImpossibleToPossible ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=ImpossibleToPossible" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -n "$T_ID" ]; then
    Q1=$(create_question "Who said 'It always seems impossible until it is done'?" "Nelson Mandela" "Albert Einstein" "Mahatma Gandhi" "Martin Luther King" 0 "Nelson Mandela is famous for this quote." "easy")
    Q2=$(create_question "What is the key to making the impossible possible?" "Giving up" "Persistence" "Sleeping" "Complaining" 1 "Persistence is key!" "easy")
    link_quiz "$T_ID" "Impossible to Possible Quiz" "Believe in yourself!" "$Q1" "$Q2"
fi

# ==========================================
# 2. magicofScience
# ==========================================
echo "--- magicofScience ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=magicofScience" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -n "$T_ID" ]; then
    Q1=$(create_question "What gas do plants breathe in?" "Oxygen" "Nitrogen" "Carbon Dioxide" "Helium" 2 "Plants take in Carbon Dioxide for photosynthesis." "medium")
    Q2=$(create_question "What is H2O?" "Salt" "Sugar" "Water" "Air" 2 "H2O is the chemical formula for Water." "easy")
    link_quiz "$T_ID" "Magic of Science Quiz" "Explore the wonders of science!" "$Q1" "$Q2"
fi

# ==========================================
# 3. History
# ==========================================
echo "--- History ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=History" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -n "$T_ID" ]; then
    Q1=$(create_question "Who built the Taj Mahal?" "Akbar" "Shah Jahan" "Babur" "Aurangzeb" 1 "Shah Jahan built it for his wife Mumtaz Mahal." "medium")
    Q2=$(create_question "In which year did India get independence?" "1945" "1947" "1950" "1952" 1 "India gained independence on August 15, 1947." "easy")
    link_quiz "$T_ID" "History Quiz" "Travel back in time!" "$Q1" "$Q2"
fi

# ==========================================
# 4. Geography
# ==========================================
echo "--- Geography ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=Geography" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -n "$T_ID" ]; then
    Q1=$(create_question "Which is the largest continent?" "Africa" "Asia" "Europe" "North America" 1 "Asia is the largest continent by size and population." "easy")
    Q2=$(create_question "Which is the longest river in the world?" "Amazon" "Nile" "Yangtze" "Mississippi" 1 "The Nile is traditionally considered the longest river." "medium")
    link_quiz "$T_ID" "Geography Quiz" "Explore the world!" "$Q1" "$Q2"
fi

# ==========================================
# 5. Waste2Best
# ==========================================
echo "--- Waste2Best ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=Waste2Best" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -n "$T_ID" ]; then
    Q1=$(create_question "What is the 3R rule?" "Read, Write, Recite" "Reduce, Reuse, Recycle" "Run, Rest, Repeat" "None of the above" 1 "Reduce, Reuse, Recycle is the mantra for waste management." "easy")
    Q2=$(create_question "Which of these can be composted?" "Plastic bottle" "Glass jar" "Banana peel" "Metal can" 2 "Organic matter like banana peels can be composted." "easy")
    link_quiz "$T_ID" "Waste to Best Quiz" "Turn trash into treasure!" "$Q1" "$Q2"
fi

# ==========================================
# 6. GK
# ==========================================
echo "--- GK ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=GK" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -n "$T_ID" ]; then
    Q1=$(create_question "How many colors are in a rainbow?" "5" "6" "7" "8" 2 "There are 7 colors in a rainbow (VIBGYOR)." "easy")
    Q2=$(create_question "Which animal is known as the Ship of the Desert?" "Horse" "Camel" "Elephant" "Lion" 1 "Camels are well adapted to desert life." "easy")
    link_quiz "$T_ID" "General Knowledge Quiz" "Test your smarts!" "$Q1" "$Q2"
fi

# ==========================================
# 7. Olympiads
# ==========================================
echo "--- Olympiads ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=Olympiads" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")

if [ -n "$T_ID" ]; then
    Q1=$(create_question "Find the missing number: 2, 4, 8, 16, ?" "20" "24" "30" "32" 3 "Each number is multiplied by 2. 16 * 2 = 32." "hard")
    Q2=$(create_question "Which planet is known as the Red Planet?" "Venus" "Mars" "Jupiter" "Saturn" 1 "Mars appears red due to iron oxide." "medium")
    link_quiz "$T_ID" "Olympiad Prep Quiz" "Challenge yourself!" "$Q1" "$Q2"
fi

echo "🎉 All Quizzes Seeded!"
