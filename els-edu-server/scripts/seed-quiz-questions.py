#!/usr/bin/env python3
import requests
import time

API_URL = "http://localhost:1337/api"
BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

HEADERS = {
    "Authorization": f"Bearer {BEARER_TOKEN}",
    "Content-Type": "application/json"
}

# Question templates
QUESTION_TEMPLATES = {
    "ImpossibleToPossible": [
        {
            "questionText": "What does 'impossible' become when you believe in yourself?",
            "options": ["Still impossible", "I'm possible", "Maybe possible", "Definitely impossible"],
            "correctAnswer": 1,
            "explanation": "When you add I'm before possible, impossible becomes I'm possible!",
            "difficulty": "EASY"
        },
        {
            "questionText": "Which quality helps turn impossible tasks into possible achievements?",
            "options": ["Giving up quickly", "Hard work and determination", "Waiting for others", "Avoiding challenges"],
            "correctAnswer": 1,
            "explanation": "Hard work and determination help us overcome difficulties!",
            "difficulty": "MEDIUM"
        }
    ],
    "magicofScience": [
        {
            "questionText": "What makes plants green?",
            "options": ["Water", "Chlorophyll", "Sunlight", "Soil"],
            "correctAnswer": 1,
            "explanation": "Chlorophyll is the green pigment in plants!",
            "difficulty": "EASY"
        },
        {
            "questionText": "What happens when you mix vinegar and baking soda?",
            "options": ["Nothing", "It freezes", "It fizzes and bubbles", "It turns blue"],
            "correctAnswer": 2,
            "explanation": "This creates a chemical reaction producing carbon dioxide gas!",
            "difficulty": "MEDIUM"
        }
    ],
    "MindCalculation": [
        {
            "questionText": "What is 25 + 25?",
            "options": ["40", "45", "50", "55"],
            "correctAnswer": 2,
            "explanation": "25 + 25 = 50!",
            "difficulty": "EASY"
        },
        {
            "questionText": "If you have 3 groups of 4 apples, how many apples in total?",
            "options": ["7", "10", "12", "16"],
            "correctAnswer": 2,
            "explanation": "3 × 4 = 12 apples!",
            "difficulty": "MEDIUM"
        }
    ],
    "default": [
        {
            "questionText": "What did you learn from this topic?",
            "options": ["Something new", "Nothing", "Everything", "I need to review"],
            "correctAnswer": 0,
            "explanation": "Great! Keep learning!",
            "difficulty": "EASY"
        }
    ]
}

def main():
    print("🎯 Starting Quiz Seeding...")
    
    # Fetch subjects with topics
    resp = requests.get(f"{API_URL}/subjects?populate=topics", headers=HEADERS)
    subjects = resp.json()["data"]
    
    print(f"📚 Found {len(subjects)} subjects\n")
    
    for subject in subjects:
        print(f"Processing Subject: {subject['name']}")
        
        for topic in subject.get('topics', []):
            print(f"  Creating quiz for: {topic['name']}")
            
            # Get questions for this topic
            questions = QUESTION_TEMPLATES.get(topic['name'], QUESTION_TEMPLATES['default'])
            
            # Create quiz
            quiz_payload = {
                "data": {
                    "title": f"{topic['name']} Quiz",
                    "description": f"Test your knowledge about {topic['name']}!",
                    "difficulty": "MEDIUM",
                    "timeLimit": 10,
                    "subject": {"connect": [{"documentId": subject['documentId']}]},
                    "topic": {"connect": [{"documentId": topic['documentId']}]}
                }
            }
            
            quiz_resp = requests.post(f"{API_URL}/quizzes", json=quiz_payload, headers=HEADERS)
            
            if quiz_resp.status_code not in (200, 201):
                print(f"    ✗ Failed to create quiz: {quiz_resp.status_code}")
                continue
            
            quiz_id = quiz_resp.json()["data"]["documentId"]
            print(f"    ✓ Created quiz")
            
            # Create questions
            for q in questions:
                question_payload = {
                    "data": {
                        "questionText": q["questionText"],
                        "options": q["options"],
                        "correctAnswer": q["correctAnswer"],
                        "explanation": q["explanation"],
                        "difficulty": q["difficulty"],
                        "quizzes": {"connect": [{"documentId": quiz_id}]}
                    }
                }
                
                q_resp = requests.post(f"{API_URL}/questions", json=question_payload, headers=HEADERS)
                print("." if q_resp.status_code in (200, 201) else "✗", end="", flush=True)
                time.sleep(0.1)
            
            print(f"\n    ✓ Added {len(questions)} questions")
            time.sleep(0.3)
    
    print("\n✅ Quiz Seeding Completed!")

if __name__ == "__main__":
    main()
