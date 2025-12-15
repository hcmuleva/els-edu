import urllib.request
import urllib.parse
import json
import sys

API_URL = "http://127.0.0.1:1337/api"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def make_request(url, method="GET", data=None):
    try:
        req = urllib.request.Request(url, headers=HEADERS, method=method)
        if data:
            req.data = json.dumps(data).encode('utf-8')
        
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    print("🔍 Finding Topic 'MindCalculation'...")
    # List all topics to find the ID
    url = f"{API_URL}/topics"
    response = make_request(url)
    
    topic_id = None
    if response and 'data' in response:
        for topic in response['data']:
            if topic['name'] == 'MindCalculation':
                topic_id = topic['documentId']
                print(f"✓ Found Topic 'MindCalculation' (ID: {topic_id})")
                break
    
    if not topic_id:
        print("❌ Topic 'MindCalculation' not found.")
        return

    # Find Quiz for this topic
    print(f"🔍 Finding Quiz for Topic {topic_id}...")
    # We need to filter quizzes by topic. 
    # Since I can't easily do complex filters with standard lib without correct syntax, 
    # I'll list quizzes and check the relation if possible, or just use the one I know exists/created.
    # The user said they created one manually.
    
    # Let's try to find a quiz that is linked to this topic.
    # Strapi v5 filtering might be deep.
    # url = f"{API_URL}/quizzes?filters[topic][documentId][$eq]={topic_id}"
    # Let's just list all quizzes and see if we can find one.
    
    url = f"{API_URL}/quizzes?populate=topic"
    response = make_request(url)
    
    quiz_id = None
    if response and 'data' in response:
        for quiz in response['data']:
            # Check if topic matches
            # In v5, populated relations might be in 'topic' field
            if 'topic' in quiz and quiz['topic']:
                # It might be a list or object depending on relation type (OneToOne or ManyToOne)
                # Schema said topic is manyToOne (Quiz has one topic?) -> No, schema said topic connect.
                # Let's check the structure.
                t = quiz['topic']
                if isinstance(t, list):
                     for sub_t in t:
                         if sub_t['documentId'] == topic_id:
                             quiz_id = quiz['documentId']
                             break
                elif isinstance(t, dict):
                    if t['documentId'] == topic_id:
                        quiz_id = quiz['documentId']
            
            if quiz_id:
                print(f"✓ Found Quiz for Topic (ID: {quiz_id})")
                break
    
    if not quiz_id:
        print("⚠️ No linked quiz found. Using the known ID 'skgtl02cogac2s8paxsx6wx5' and hoping it's the right one or linking it now.")
        quiz_id = "skgtl02cogac2s8paxsx6wx5"
        # Link it just in case
        link_data = {
            "data": {
                "topic": {"connect": [{"documentId": topic_id}]},
                "isActive": True
            }
        }
        make_request(f"{API_URL}/quizzes/{quiz_id}", method="PUT", data=link_data)

    print(f"❓ Creating Questions for Quiz {quiz_id}...")
    
    questions = [
        {
            "questionText": "What is 15 + 15?",
            "options": ["20", "25", "30", "35"],
            "correctAnswers": [2], # Using array for JSON field
            "explanation": "15 + 15 is 30.",
            "difficulty": "easy", # Lowercase
            "questionType": "SC",
            "quizzes": {"connect": [{"documentId": quiz_id}]}
        },
        {
            "questionText": "What is 100 - 50?",
            "options": ["40", "50", "60", "70"],
            "correctAnswers": [1],
            "explanation": "100 - 50 is 50.",
            "difficulty": "easy",
            "questionType": "SC",
            "quizzes": {"connect": [{"documentId": quiz_id}]}
        },
        {
            "questionText": "What is 5 * 5?",
            "options": ["10", "20", "25", "30"],
            "correctAnswers": [2],
            "explanation": "5 times 5 is 25.",
            "difficulty": "medium",
            "questionType": "SC",
            "quizzes": {"connect": [{"documentId": quiz_id}]}
        }
    ]

    for i, q_data in enumerate(questions):
        print(f"  Creating Question {i+1}...")
        res = make_request(f"{API_URL}/questions", method="POST", data={"data": q_data})
        if res and 'data' in res:
            print(f"  ✓ Created Question {res['data']['documentId']}")
        else:
            print("  ❌ Failed to create question")

    print("✅ Done!")

if __name__ == "__main__":
    main()
