#!/usr/bin/env python3
"""
Test script for FastAPI MongoDB application
Run this after starting the application with docker-compose
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def print_response(response):
    """Pretty print response"""
    print(f"Status Code: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
    print("-" * 80)

def test_health_check():
    """Test health check endpoint"""
    print("\n=== Testing Health Check ===")
    response = requests.get("http://localhost:8000/health")
    print_response(response)

def test_create_user():
    """Test user creation"""
    print("\n=== Testing User Creation ===")
    user_data = {
        "name": "Test Teacher",
        "email": "teacher@test.com",
        "role": "teacher",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/users/", json=user_data)
    print_response(response)
    
    if response.status_code == 201:
        return response.json()["_id"]
    return None

def test_get_users():
    """Test getting all users"""
    print("\n=== Testing Get All Users ===")
    response = requests.get(f"{BASE_URL}/users/")
    print_response(response)

def test_create_subject():
    """Test subject creation"""
    print("\n=== Testing Subject Creation ===")
    subject_data = {
        "name": "Science",
        "code": "SCI-101",
        "description": "Basic Science",
        "level": "High School"
    }
    response = requests.post(f"{BASE_URL}/subjects/", json=subject_data)
    print_response(response)
    
    if response.status_code == 201:
        return response.json()["_id"]
    return None

def test_get_subjects():
    """Test getting all subjects"""
    print("\n=== Testing Get All Subjects ===")
    response = requests.get(f"{BASE_URL}/subjects/")
    print_response(response)

def test_create_question(subject_id):
    """Test question creation"""
    print("\n=== Testing Question Creation ===")
    question_data = {
        "subject_id": subject_id,
        "topic_id": "topic_123",
        "question_text": "What is the chemical formula for water?",
        "question_type": "multiple_choice",
        "difficulty_level": "Beginner",
        "options": ["H2O", "CO2", "O2", "H2O2"],
        "correct_answer": "H2O",
        "explanation": "Water consists of 2 hydrogen atoms and 1 oxygen atom",
        "tags": ["chemistry", "water", "formula"],
        "points": 1
    }
    response = requests.post(f"{BASE_URL}/questions/", json=question_data)
    print_response(response)
    
    if response.status_code == 201:
        return response.json()["_id"]
    return None

def test_get_questions():
    """Test getting all questions"""
    print("\n=== Testing Get All Questions ===")
    response = requests.get(f"{BASE_URL}/questions/")
    print_response(response)

def test_search_questions():
    """Test searching questions"""
    print("\n=== Testing Question Search ===")
    response = requests.get(f"{BASE_URL}/questions/search?q=water")
    print_response(response)

def test_filter_questions(subject_id):
    """Test filtering questions"""
    print("\n=== Testing Question Filtering ===")
    response = requests.get(
        f"{BASE_URL}/questions/",
        params={
            "subject_id": subject_id,
            "difficulty_level": "Beginner"
        }
    )
    print_response(response)

def run_all_tests():
    """Run all tests"""
    print("=" * 80)
    print("Starting API Tests")
    print("=" * 80)
    
    try:
        # Health check
        test_health_check()
        
        # User tests
        user_id = test_create_user()
        test_get_users()
        
        # Subject tests
        subject_id = test_create_subject()
        test_get_subjects()
        
        # Question tests
        if subject_id:
            question_id = test_create_question(subject_id)
            test_get_questions()
            test_search_questions()
            test_filter_questions(subject_id)
        
        print("\n" + "=" * 80)
        print("All tests completed!")
        print("=" * 80)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to the API.")
        print("Make sure the application is running with: docker-compose up -d")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    run_all_tests()
