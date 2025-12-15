#!/usr/bin/env python3
import requests
import time

API_URL = "http://localhost:1337/api"
YOUTUBE_API_KEY = "AIzaSyCGlFIHPBSmKOxJGbrMlJnu1Teq835p4Rg"
BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MzQ5NDU4LCJleHAiOjE3NjY5NDE0NTh9.jZeGhwG47IUzu9T3ISjAoFEnf-EfoB6dWpdAO0uOisc"

HEADERS = {
    "Authorization": f"Bearer {BEARER_TOKEN}",
    "Content-Type": "application/json"
}

# Missing content: (subject_id, topic_id, subject_name, topic_name)
MISSING = [
    ("pmbwp36a1m1njlsmgfdmrk03", "nwrm9dm201bio8cof4ee4gi0", "BeBrainee", "ImpossibleToPossible"),
    ("pmbwp36a1m1njlsmgfdmrk03", "dg4iupnarary9v48bclz8ih5", "BeBrainee", "magicofScience"),
]

def fetch_youtube_videos(query, max_results=5):
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults={max_results}&q={query}&type=video&key={YOUTUBE_API_KEY}"
    response = requests.get(url)
    data = response.json()
    
    videos = []
    for item in data.get("items", []):
        videos.append({
            "title": item["snippet"]["title"],
            "description": item["snippet"]["description"],
            "youtubeurl": f"https://www.youtube.com/watch?v={item['id']['videoId']}"
        })
    return videos

def create_content(subject_id, topic_id, video):
    payload = {
        "data": {
            "title": video["title"],
            "type": "YOUTUBE",
            "youtubeurl": video["youtubeurl"],
            "json_description": [
                {
                    "type": "paragraph",
                    "children": [{"text": video["description"][:200], "type": "text"}]
                }
            ],
            "subjects": {"connect": [{"documentId": subject_id}]},
            "topic": {"connect": [{"documentId": topic_id}]}
        }
    }
    
    response = requests.post(f"{API_URL}/contents", json=payload, headers=HEADERS)
    return response.status_code in [200, 201]

def main():
    print("🔄 Populating Missing Content...")
    
    for subject_id, topic_id, subject_name, topic_name in MISSING:
        print(f"\n📚 Processing: {subject_name} -> {topic_name}")
        
        query = f"kids learning {subject_name} {topic_name}"
        print(f"   Searching YouTube: '{query}'")
        
        videos = fetch_youtube_videos(query, 5)
        print(f"   Found {len(videos)} videos")
        
        success_count = 0
        for video in videos:
            if create_content(subject_id, topic_id, video):
                print(".", end="", flush=True)
                success_count += 1
            else:
                print("✗", end="", flush=True)
            time.sleep(0.2)
        
        print(f"\n   ✓ Added {success_count}/{len(videos)} videos")
        time.sleep(1)
    
    # Now handle hospital&Doctors
    print(f"\n📚 Processing: GK -> hospital&Doctors")
    
    # Get GK subject and hospital&Doctors topic
    resp = requests.get(f"{API_URL}/subjects?filters[name][$eq]=GK&populate=topics", headers=HEADERS)
    gk_data = resp.json()["data"][0]
    gk_id = gk_data["documentId"]
    hospital_topic = next((t for t in gk_data["topics"] if t["name"] == "hospital&Doctors"), None)
    
    if hospital_topic:
        topic_id = hospital_topic["documentId"]
        query = "kids learning hospitals and doctors"
        print(f"   Searching YouTube: '{query}'")
        
        videos = fetch_youtube_videos(query, 5)
        print(f"   Found {len(videos)} videos")
        
        success_count = 0
        for video in videos:
            if create_content(gk_id, topic_id, video):
                print(".", end="", flush=True)
                success_count += 1
            else:
                print("✗", end="", flush=True)
            time.sleep(0.2)
        
        print(f"\n   ✓ Added {success_count}/{len(videos)} videos")
    
    print("\n✅ All missing content populated!")

if __name__ == "__main__":
    main()
