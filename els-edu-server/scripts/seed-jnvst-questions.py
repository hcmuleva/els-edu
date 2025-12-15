#!/usr/bin/env python3
"""
Seed JNVST (Jawahar Navodaya Vidyalaya Selection Test) Questions
Creates questions for Class 6 entrance exam with proper exam and year tagging
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
STRAPI_URL = "http://localhost:1337"
API_TOKEN = "your-strapi-token-here"  # Update this with actual token

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_TOKEN}"
}

# JNVST Question Bank for Class 6
# Section 1: Mental Ability (40 questions)
# Section 2: Arithmetic (20 questions)
# Section 3: Language (20 questions)

JNVST_QUESTIONS = {
    "Mental Ability": [
        {
            "questionText": "If in a certain code, MOTHER is written as NPUIFS, how is SISTER written?",
            "options": [
                {"text": "TJTUFF", "isCorrect": True},
                {"text": "TJTFUS", "isCorrect": False},
                {"text": "TJTUFS", "isCorrect": False},
                {"text": "TITUFS", "isCorrect": False}
            ],
            "explanation": "Each letter is replaced by the next letter in alphabetical order. S→T, I→J, S→T, T→U, E→F, R→S",
            "difficulty": "medium",
            "subject": "Mental Ability",
            "chapter": "Coding-Decoding"
        },
        {
            "questionText": "Find the odd one out: 3, 5, 7, 12, 17",
            "options": [
                {"text": "3", "isCorrect": False},
                {"text": "5", "isCorrect": False},
                {"text": "12", "isCorrect": True},
                {"text": "17", "isCorrect": False}
            ],
            "explanation": "All numbers except 12 are prime numbers.",
            "difficulty": "easy",
            "subject": "Mental Ability",
            "chapter": "Odd One Out"
        },
        {
            "questionText": "Complete the series: 2, 6, 12, 20, 30, ?",
            "options": [
                {"text": "40", "isCorrect": False},
                {"text": "42", "isCorrect": True},
                {"text": "44", "isCorrect": False},
                {"text": "48", "isCorrect": False}
            ],
            "explanation": "The differences are 4, 6, 8, 10, 12. Next number is 30 + 12 = 42",
            "difficulty": "medium",
            "subject": "Mental Ability",
            "chapter": "Number Series"
        },
        {
            "questionText": "If A = 1, B = 2, C = 3... then what is the total value of 'CAT'?",
            "options": [
                {"text": "24", "isCorrect": True},
                {"text": "21", "isCorrect": False},
                {"text": "27", "isCorrect": False},
                {"text": "30", "isCorrect": False}
            ],
            "explanation": "C = 3, A = 1, T = 20. So 3 + 1 + 20 = 24",
            "difficulty": "easy",
            "subject": "Mental Ability",
            "chapter": "Letter Values"
        },
        {
            "questionText": "Which figure completes the pattern?\n[Triangle, Square, Pentagon, ?]",
            "options": [
                {"text": "Hexagon", "isCorrect": True},
                {"text": "Circle", "isCorrect": False},
                {"text": "Rectangle", "isCorrect": False},
                {"text": "Octagon", "isCorrect": False}
            ],
            "explanation": "Pattern increases by one side each: 3, 4, 5, 6 sides",
            "difficulty": "easy",
            "subject": "Mental Ability",
            "chapter": "Pattern Recognition"
        }
    ],
    "Arithmetic": [
        {
            "questionText": "If 15 boys can complete a work in 10 days, in how many days can 25 boys complete the same work?",
            "options": [
                {"text": "6 days", "isCorrect": True},
                {"text": "8 days", "isCorrect": False},
                {"text": "12 days", "isCorrect": False},
                {"text": "15 days", "isCorrect": False}
            ],
            "explanation": "Using inverse proportion: 15 × 10 = 25 × x, x = 150/25 = 6 days",
            "difficulty": "medium",
            "subject": "Arithmetic",
            "chapter": "Time and Work"
        },
        {
            "questionText": "What is 25% of 80?",
            "options": [
                {"text": "15", "isCorrect": False},
                {"text": "20", "isCorrect": True},
                {"text": "25", "isCorrect": False},
                {"text": "30", "isCorrect": False}
            ],
            "explanation": "25% of 80 = (25/100) × 80 = 20",
            "difficulty": "easy",
            "subject": "Arithmetic",
            "chapter": "Percentage"
        },
        {
            "questionText": "A train travels 300 km in 5 hours. What is its average speed?",
            "options": [
                {"text": "50 km/h", "isCorrect": False},
                {"text": "60 km/h", "isCorrect": True},
                {"text": "70 km/h", "isCorrect": False},
                {"text": "80 km/h", "isCorrect": False}
            ],
            "explanation": "Speed = Distance / Time = 300 / 5 = 60 km/h",
            "difficulty": "easy",
            "subject": "Arithmetic",
            "chapter": "Speed and Distance"
        },
        {
            "questionText": "Find the area of a rectangle with length 12 cm and breadth 8 cm.",
            "options": [
                {"text": "84 sq cm", "isCorrect": False},
                {"text": "96 sq cm", "isCorrect": True},
                {"text": "100 sq cm", "isCorrect": False},
                {"text": "120 sq cm", "isCorrect": False}
            ],
            "explanation": "Area = length × breadth = 12 × 8 = 96 sq cm",
            "difficulty": "easy",
            "subject": "Arithmetic",
            "chapter": "Mensuration"
        },
        {
            "questionText": "Simplify: 48 ÷ 6 + 3 × 4 - 2",
            "options": [
                {"text": "16", "isCorrect": False},
                {"text": "18", "isCorrect": True},
                {"text": "20", "isCorrect": False},
                {"text": "22", "isCorrect": False}
            ],
            "explanation": "Following BODMAS: 48÷6 + 3×4 - 2 = 8 + 12 - 2 = 18",
            "difficulty": "medium",
            "subject": "Arithmetic",
            "chapter": "BODMAS"
        }
    ],
    "Language": [
        {
            "questionText": "Choose the correct synonym of 'Happy':",
            "options": [
                {"text": "Sad", "isCorrect": False},
                {"text": "Joyful", "isCorrect": True},
                {"text": "Angry", "isCorrect": False},
                {"text": "Tired", "isCorrect": False}
            ],
            "explanation": "'Joyful' means feeling or expressing great pleasure, same as happy.",
            "difficulty": "easy",
            "subject": "Language",
            "chapter": "Synonyms"
        },
        {
            "questionText": "Fill in the blank: She _____ to school every day.",
            "options": [
                {"text": "go", "isCorrect": False},
                {"text": "goes", "isCorrect": True},
                {"text": "going", "isCorrect": False},
                {"text": "gone", "isCorrect": False}
            ],
            "explanation": "'Goes' is the correct present tense form for third person singular.",
            "difficulty": "easy",
            "subject": "Language",
            "chapter": "Grammar - Tenses"
        },
        {
            "questionText": "Choose the antonym of 'Ancient':",
            "options": [
                {"text": "Old", "isCorrect": False},
                {"text": "Modern", "isCorrect": True},
                {"text": "Historic", "isCorrect": False},
                {"text": "Traditional", "isCorrect": False}
            ],
            "explanation": "'Modern' is opposite of ancient, meaning relating to the present time.",
            "difficulty": "easy",
            "subject": "Language",
            "chapter": "Antonyms"
        },
        {
            "questionText": "Identify the noun in: 'The quick brown fox jumps.'",
            "options": [
                {"text": "quick", "isCorrect": False},
                {"text": "brown", "isCorrect": False},
                {"text": "fox", "isCorrect": True},
                {"text": "jumps", "isCorrect": False}
            ],
            "explanation": "'Fox' is a noun (an animal). Quick and brown are adjectives, jumps is a verb.",
            "difficulty": "easy",
            "subject": "Language",
            "chapter": "Parts of Speech"
        },
        {
            "questionText": "Choose the correctly spelled word:",
            "options": [
                {"text": "Beutiful", "isCorrect": False},
                {"text": "Beautiful", "isCorrect": True},
                {"text": "Beatiful", "isCorrect": False},
                {"text": "Beautyful", "isCorrect": False}
            ],
            "explanation": "The correct spelling is 'Beautiful' with 'eau' combination.",
            "difficulty": "easy",
            "subject": "Language",
            "chapter": "Spelling"
        }
    ]
}

def create_or_get_tag_exam(exam_name):
    """Create or get tag_exam for JNVST"""
    print(f"Checking for exam tag: {exam_name}")
    
    # Check if exam tag exists
    response = requests.get(
        f"{STRAPI_URL}/api/tag-exams",
        params={"filters[tag_exam][$eq]": exam_name},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('data') and len(data['data']) > 0:
            exam_id = data['data'][0]['id']
            print(f"Found existing exam tag: {exam_name} (ID: {exam_id})")
            return exam_id
    
    # Create new exam tag
    payload = {
        "data": {
            "tag_exam": exam_name,
            "publishedAt": datetime.now().isoformat()
        }
    }
    
    response = requests.post(
        f"{STRAPI_URL}/api/tag-exams",
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200 or response.status_code == 201:
        exam_id = response.json()['data']['id']
        print(f"Created exam tag: {exam_name} (ID: {exam_id})")
        return exam_id
    else:
        print(f"Error creating exam tag: {response.status_code} - {response.text}")
        return None

def create_or_get_tag_year(year):
    """Create or get tag_year"""
    print(f"Checking for year tag: {year}")
    
    # Check if year tag exists
    response = requests.get(
        f"{STRAPI_URL}/api/tag-years",
        params={"filters[year][$eq]": year},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('data') and len(data['data']) > 0:
            year_id = data['data'][0]['id']
            print(f"Found existing year tag: {year} (ID: {year_id})")
            return year_id
    
    # Create new year tag
    payload = {
        "data": {
            "year": year,
            "publishedAt": datetime.now().isoformat()
        }
    }
    
    response = requests.post(
        f"{STRAPI_URL}/api/tag-years",
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200 or response.status_code == 201:
        year_id = response.json()['data']['id']
        print(f"Created year tag: {year} (ID: {year_id})")
        return year_id
    else:
        print(f"Error creating year tag: {response.status_code} - {response.text}")
        return None

def create_question(question_data, exam_id, year_id):
    """Create a question with exam and year tags"""
    
    # Prepare question payload
    payload = {
        "data": {
            "questionText": question_data['questionText'],
            "questionType": "SC",  # Single Choice
            "points": 1,
            "timeLimit": 60,  # 60 seconds per question
            "explanation": question_data.get('explanation', ''),
            "difficulty": question_data.get('difficulty', 'medium'),
            "subject": question_data.get('subject', ''),
            "chapter": question_data.get('chapter', ''),
            "options": question_data['options'],
            "correctAnswers": [opt['text'] for opt in question_data['options'] if opt['isCorrect']],
            "shuffleOptions": True,
            "isActive": True,
            "tag_exams": [exam_id],
            "tag_years": [year_id],
            "publishedAt": datetime.now().isoformat()
        }
    }
    
    response = requests.post(
        f"{STRAPI_URL}/api/questions",
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200 or response.status_code == 201:
        question_id = response.json()['data']['id']
        return question_id
    else:
        print(f"Error creating question: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def main():
    print("=" * 60)
    print("JNVST Question Seeding Script")
    print("=" * 60)
    print()
    
    # Create/Get exam and year tags
    exam_id = create_or_get_tag_exam("JNVST")
    year_id = create_or_get_tag_year(2023)
    
    if not exam_id or not year_id:
        print("Failed to create/get exam or year tags. Exiting.")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("Creating Questions")
    print("=" * 60)
    print()
    
    total_created = 0
    total_failed = 0
    
    for subject, questions in JNVST_QUESTIONS.items():
        print(f"\n--- {subject} Questions ---")
        for idx, question in enumerate(questions, 1):
            print(f"Creating question {idx}/{len(questions)}: {question['questionText'][:50]}...")
            question_id = create_question(question, exam_id, year_id)
            
            if question_id:
                total_created += 1
                print(f"✓ Created (ID: {question_id})")
            else:
                total_failed += 1
                print(f"✗ Failed")
    
    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Total questions created: {total_created}")
    print(f"Total questions failed: {total_failed}")
    print()
    
    if total_created > 0:
        print("✓ JNVST questions successfully seeded!")
        print(f"✓ Tagged with Exam: JNVST (ID: {exam_id})")
        print(f"✓ Tagged with Year: 2023 (ID: {year_id})")
    else:
        print("✗ No questions were created. Please check errors above.")

if __name__ == "__main__":
    main()
