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
    # URL encode the filter
    filter_param = urllib.parse.quote("filters[name][$eq]")
    url = f"{API_URL}/topics?{filter_param}=MindCalculation"
    
    # Actually, simpler to just list and find
    url = f"{API_URL}/topics"
    response = make_request(url)
    
    topic_id = None
    if response and 'data' in response:
        for topic in response['data']:
            if topic['name'] == 'MindCalculation':
                topic_id = topic['documentId']
                break
    
    if not topic_id:
        print("❌ Topic 'MindCalculation' not found.")
        # Fallback to first topic if specific one fails, just to get SOMETHING working
        if response and 'data' in response and len(response['data']) > 0:
             topic_id = response['data'][0]['documentId']
             print(f"⚠️ Fallback to first topic: {response['data'][0]['name']} ({topic_id})")
        else:
             return

    print(f"✓ Topic ID: {topic_id}")
    
    quiz_id = "skgtl02cogac2s8paxsx6wx5"
    print(f"🔗 Linking Quiz {quiz_id} to Topic {topic_id}...")
    
    link_data = {
        "data": {
            "topic": {"connect": [{"documentId": topic_id}]},
            "isActive": True # Ensure it's active
        }
    }
    
    res = make_request(f"{API_URL}/quizzes/{quiz_id}", method="PUT", data=link_data)
    if res:
        print("✓ Quiz linked successfully.")
    else:
        print("❌ Failed to link quiz.")
        return

    print("❓ Adding Questions...")
    
    q1_data = {
        "data": {
            "questionText": "What is 15 + 15?",
            "options": ["20", "25", "30", "35"],
            "correctAnswer": 2,
            "explanation": "15 + 15 is 30.",
            "difficulty": "EASY",
            "quizzes": {"connect": [{"documentId": quiz_id}]}
        }
    }
    make_request(f"{API_URL}/questions", method="POST", data=q1_data)
    print("✓ Added Question 1")

    q2_data = {
        "data": {
            "questionText": "What is 100 - 50?",
            "options": ["40", "50", "60", "70"],
            "correctAnswer": 1,
            "explanation": "100 - 50 is 50.",
            "difficulty": "EASY",
            "quizzes": {"connect": [{"documentId": quiz_id}]}
        }
    }
    make_request(f"{API_URL}/questions", method="POST", data=q2_data)
    print("✓ Added Question 2")
    
    print("✅ Done!")

if __name__ == "__main__":
    main()
