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

process_topic() {
    local NAME="$1"
    local TITLE="$2"
    local DESC="$3"
    local Q1_ARGS="$4" # We'll just hardcode questions inside for simplicity or pass them differently
    # To keep it simple, I'll just inline the calls below.
}

# 1. state
echo "--- state ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=state" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "Which state is known as the Land of Five Rivers?" "Punjab" "Gujarat" "Kerala" "Assam" 0 "Punjab means land of five waters." "easy")
    Q2=$(create_question "Which is the largest state in India by area?" "Maharashtra" "Rajasthan" "Uttar Pradesh" "Madhya Pradesh" 1 "Rajasthan is the largest state." "medium")
    link_quiz "$T_ID" "Know Your States" "Explore India's states!" "$Q1" "$Q2"
fi

# 2. country
echo "--- country ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=country" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "Which country has the largest population?" "India" "China" "USA" "Russia" 0 "India recently surpassed China." "medium")
    Q2=$(create_question "Which country is known as the Land of the Rising Sun?" "China" "Japan" "Thailand" "Korea" 1 "Japan is called Nippon, meaning sun origin." "easy")
    link_quiz "$T_ID" "Countries of the World" "Travel the globe!" "$Q1" "$Q2"
fi

# 3. animal
echo "--- animal ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=animal" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "Which is the fastest land animal?" "Lion" "Cheetah" "Horse" "Leopard" 1 "Cheetahs can run up to 70 mph." "easy")
    Q2=$(create_question "Which animal is the largest mammal?" "Elephant" "Blue Whale" "Giraffe" "Hippo" 1 "The Blue Whale is the largest animal ever known." "easy")
    link_quiz "$T_ID" "Animal Kingdom Quiz" "Wild wonders!" "$Q1" "$Q2"
fi

# 4. hospital&Doctors
echo "--- hospital&Doctors ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=hospital&Doctors" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "Who treats teeth?" "Cardiologist" "Dentist" "Neurologist" "Dermatologist" 1 "Dentists specialize in oral health." "easy")
    Q2=$(create_question "What is the emergency number for ambulance in India?" "100" "101" "102" "108" 3 "108 is the common emergency number." "easy")
    link_quiz "$T_ID" "Health & Safety Quiz" "Stay healthy!" "$Q1" "$Q2"
fi

# 5. ProductOfWaste
echo "--- ProductOfWaste ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=ProductOfWaste" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "What can be made from recycled plastic?" "T-shirts" "Food" "Water" "Air" 0 "Polyester fabric can be made from recycled bottles." "medium")
    Q2=$(create_question "What is biogas made from?" "Plastic" "Organic waste" "Glass" "Metal" 1 "Biogas is produced from organic matter." "medium")
    link_quiz "$T_ID" "Waste Products Quiz" "Innovative recycling!" "$Q1" "$Q2"
fi

# 6. Navodaya
echo "--- Navodaya ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=Navodaya" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "JNV stands for?" "Jawahar Navodaya Vidyalaya" "Junior National Vidyalaya" "Joint Navodaya Venture" "None" 0 "JNVs are schools for gifted students." "easy")
    Q2=$(create_question "Who conducts the JNV Selection Test?" "CBSE" "NCERT" "NTA" "State Govt" 0 "CBSE conducts the test." "medium")
    link_quiz "$T_ID" "Navodaya Prep" "Ace the exam!" "$Q1" "$Q2"
fi

# 7. Science
echo "--- Science ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=Science" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "What is the center of an atom called?" "Electron" "Proton" "Nucleus" "Molecule" 2 "The nucleus contains protons and neutrons." "medium")
    Q2=$(create_question "Which planet has rings?" "Mars" "Saturn" "Venus" "Mercury" 1 "Saturn is famous for its rings." "easy")
    link_quiz "$T_ID" "Science Explorer" "Discover the universe!" "$Q1" "$Q2"
fi

# 8. DIY
echo "--- DIY ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=DIY" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "DIY stands for?" "Do It Yourself" "Do It Yesterday" "Don't Ignore You" "None" 0 "Do It Yourself." "easy")
    Q2=$(create_question "Which tool is used to drive nails?" "Screwdriver" "Hammer" "Wrench" "Saw" 1 "A hammer is used for nails." "easy")
    link_quiz "$T_ID" "DIY Master" "Get creative!" "$Q1" "$Q2"
fi

# 9. ThoughOftheDay
echo "--- ThoughOftheDay ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=ThoughOftheDay" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "Honesty is the best ___?" "Policy" "Game" "Trick" "Lie" 0 "Honesty is the best policy." "easy")
    Q2=$(create_question "Actions speak louder than ___?" "Words" "Thoughts" "Whispers" "Dreams" 0 "Actions speak louder than words." "easy")
    link_quiz "$T_ID" "Daily Wisdom" "Reflect and learn." "$Q1" "$Q2"
fi

# 10. Puzzle
echo "--- Puzzle ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=Puzzle" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "What has keys but can't open locks?" "Piano" "Map" "Book" "Clock" 0 "A piano has keys." "medium")
    Q2=$(create_question "What comes down but never goes up?" "Rain" "Balloon" "Smoke" "Bird" 0 "Rain falls down." "easy")
    link_quiz "$T_ID" "Brain Teasers" "Solve the riddle!" "$Q1" "$Q2"
fi

# 11. moral
echo "--- moral ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=moral" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "The boy who cried ___?" "Wolf" "Lion" "Tiger" "Bear" 0 "The Boy Who Cried Wolf." "easy")
    Q2=$(create_question "Slow and steady wins the ___?" "Race" "Game" "Prize" "Fight" 0 "From the Tortoise and the Hare." "easy")
    link_quiz "$T_ID" "Moral Stories" "Lessons for life." "$Q1" "$Q2"
fi

# 12. motivation
echo "--- motivation ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=motivation" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "Failure is the stepping stone to ___?" "Success" "Defeat" "Sadness" "Anger" 0 "Success comes after learning from failure." "easy")
    Q2=$(create_question "Believe you can and you're halfway ___?" "There" "Done" "Gone" "Lost" 0 "Quote by Theodore Roosevelt." "medium")
    link_quiz "$T_ID" "Motivation Quiz" "Stay inspired!" "$Q1" "$Q2"
fi

# 13. isnpiring
echo "--- isnpiring ---"
curl -g -s "$API_URL/topics?filters[name][\$eq]=isnpiring" -H "Authorization: Bearer $TOKEN" > /tmp/topic_res.json
T_ID=$(cat /tmp/topic_res.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['documentId'] if data['data'] else '')")
if [ -n "$T_ID" ]; then
    Q1=$(create_question "Who is the Missile Man of India?" "APJ Abdul Kalam" "CV Raman" "Homi Bhabha" "Vikram Sarabhai" 0 "Dr. Kalam inspired millions." "easy")
    Q2=$(create_question "Who wrote the Harry Potter series?" "JK Rowling" "Enid Blyton" "Roald Dahl" "Ruskin Bond" 0 "JK Rowling's story is inspiring." "easy")
    link_quiz "$T_ID" "Inspiring Lives" "Learn from legends." "$Q1" "$Q2"
fi

echo "🎉 Remaining Quizzes Seeded!"
