from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import random

from ..models.quiz import (
    QuizQuestionCreate,
    QuizQuestionUpdate,
    QuizQuestionResponse,
    QuizQuestionWithAnswer,
    QuizSessionCreate,
    QuizSessionResponse
)
from ..config.database import get_database

router = APIRouter(prefix="/quiz", tags=["Quiz"])


# Quiz Question Routes
@router.post("/questions", response_model=QuizQuestionWithAnswer, status_code=status.HTTP_201_CREATED)
async def create_quiz_question(
    question: QuizQuestionCreate,
    db=Depends(get_database)
):
    """Create a new quiz question"""
    
    # Validate correctAnswer exists in options
    option_ids = [opt.get("id") for opt in question.options]
    if question.correctAnswer not in option_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="correctAnswer must match one of the option IDs"
        )
    
    # Convert to dict and prepare for insertion
    question_dict = question.model_dump()
    question_dict["created_at"] = datetime.utcnow()
    
    # Insert into database
    result = await db.quiz_questions.insert_one(question_dict)
    
    # Fetch and return created question
    created_question = await db.quiz_questions.find_one({"_id": result.inserted_id})
    created_question["_id"] = str(created_question["_id"])
    
    return created_question


@router.get("/questions", response_model=List[QuizQuestionResponse])
async def get_quiz_questions(
    category: Optional[str] = None,
    skillType: Optional[str] = None,
    difficulty: Optional[str] = Query(None, regex="^(Beginner|Intermediate|Advanced)$"),
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_database)
):
    """Get quiz questions with optional filtering"""
    
    query = {}
    if category:
        query["category"] = category
    if skillType:
        query["skillType"] = skillType
    if difficulty:
        query["difficulty"] = difficulty
    
    cursor = db.quiz_questions.find(query).skip(skip).limit(limit)
    questions = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string and remove correctAnswer for quiz taking
    for question in questions:
        question["_id"] = str(question["_id"])
        if "correctAnswer" in question:
            del question["correctAnswer"]
    
    return questions


@router.get("/questions/{question_id}", response_model=QuizQuestionWithAnswer)
async def get_quiz_question(question_id: str, db=Depends(get_database)):
    """Get a specific quiz question by ID (with answer)"""
    
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    question = await db.quiz_questions.find_one({"_id": ObjectId(question_id)})
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz question not found"
        )
    
    question["_id"] = str(question["_id"])
    return question


@router.get("/questions/category/{category}", response_model=List[QuizQuestionResponse])
async def get_quiz_questions_by_category(
    category: str,
    skillType: Optional[str] = None,
    difficulty: Optional[str] = Query(None, regex="^(Beginner|Intermediate|Advanced)$"),
    limit: int = 50,
    db=Depends(get_database)
):
    """Get quiz questions for a specific category (for quiz taking)"""
    
    query = {"category": category}
    if skillType:
        query["skillType"] = skillType
    if difficulty:
        query["difficulty"] = difficulty
    
    cursor = db.quiz_questions.find(query).limit(limit)
    questions = await cursor.to_list(length=limit)
    
    # Shuffle questions for variety
    random.shuffle(questions)
    
    # Convert ObjectId to string and remove correctAnswer
    for question in questions:
        question["_id"] = str(question["_id"])
        if "correctAnswer" in question:
            del question["correctAnswer"]
        # Shuffle options order
        if "options" in question:
            random.shuffle(question["options"])
    
    return questions


@router.put("/questions/{question_id}", response_model=QuizQuestionWithAnswer)
async def update_quiz_question(
    question_id: str,
    question_update: QuizQuestionUpdate,
    db=Depends(get_database)
):
    """Update a quiz question"""
    
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    # Get existing question
    existing_question = await db.quiz_questions.find_one({"_id": ObjectId(question_id)})
    if not existing_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz question not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in question_update.model_dump(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Validate correctAnswer if options are being updated
    if "options" in update_data and "correctAnswer" in update_data:
        option_ids = [opt.get("id") for opt in update_data["options"]]
        if update_data["correctAnswer"] not in option_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="correctAnswer must match one of the option IDs"
            )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update question
    await db.quiz_questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": update_data}
    )
    
    # Fetch and return updated question
    updated_question = await db.quiz_questions.find_one({"_id": ObjectId(question_id)})
    updated_question["_id"] = str(updated_question["_id"])
    
    return updated_question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz_question(question_id: str, db=Depends(get_database)):
    """Delete a quiz question"""
    
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    result = await db.quiz_questions.delete_one({"_id": ObjectId(question_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz question not found"
        )
    
    return None


# Quiz Session Routes
@router.post("/sessions", response_model=QuizSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz_session(
    session: QuizSessionCreate,
    db=Depends(get_database)
):
    """Create a new quiz session with random questions"""
    
    # Validate user_id
    if not ObjectId.is_valid(session.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(session.user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Build query for questions
    query = {"category": session.category}
    if session.skillType:
        query["skillType"] = session.skillType
    if session.difficulty:
        query["difficulty"] = session.difficulty
    
    # Get available questions
    cursor = db.quiz_questions.find(query)
    available_questions = await cursor.to_list(length=None)
    
    if len(available_questions) < session.questionCount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough questions available. Found {len(available_questions)}, requested {session.questionCount}"
        )
    
    # Randomly select questions
    selected_questions = random.sample(available_questions, session.questionCount)
    question_ids = [str(q["_id"]) for q in selected_questions]  # Store as strings
    
    # Create session
    session_dict = {
        "user_id": ObjectId(session.user_id),
        "category": session.category,
        "questions": question_ids,
        "answers": {},
        "score": None,
        "totalPoints": sum(q.get("points", 1) for q in selected_questions),
        "completed": False,
        "startedAt": datetime.utcnow(),
        "completedAt": None,
        "timeSpent": None,
    }
    
    result = await db.quiz_sessions.insert_one(session_dict)
    
    # Fetch and return created session
    created_session = await db.quiz_sessions.find_one({"_id": result.inserted_id})
    if not created_session:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve created session"
        )
    
    # Convert ObjectId to string and prepare response
    created_session["_id"] = str(created_session["_id"])
    created_session["id"] = created_session["_id"]  # Add id field for frontend compatibility
    created_session["user_id"] = str(created_session["user_id"])
    
    # Ensure startedAt is a datetime string
    if isinstance(created_session.get("startedAt"), datetime):
        created_session["startedAt"] = created_session["startedAt"].isoformat()
    
    return created_session


@router.get("/sessions/{session_id}", response_model=QuizSessionResponse)
async def get_quiz_session(session_id: str, db=Depends(get_database)):
    """Get a specific quiz session"""
    
    if not ObjectId.is_valid(session_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID"
        )
    
    session = await db.quiz_sessions.find_one({"_id": ObjectId(session_id)})
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    session["_id"] = str(session["_id"])
    session["id"] = session["_id"]  # Add id field for frontend compatibility
    session["user_id"] = str(session["user_id"])
    return session


@router.post("/sessions/{session_id}/submit", response_model=QuizSessionResponse)
async def submit_quiz_session(
    session_id: str,
    answers: dict,  # {questionId: selectedOptionId}
    db=Depends(get_database)
):
    """Submit quiz answers and calculate score"""
    
    if not ObjectId.is_valid(session_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID"
        )
    
    # Get session
    session = await db.quiz_sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    if session.get("completed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz session already completed"
        )
    
    # Update answers
    session["answers"] = answers
    
    # Calculate score
    correct_count = 0
    total_points = 0
    earned_points = 0
    
    for question_id in session["questions"]:
        # Get question - question_id is stored as string in session
        question = await db.quiz_questions.find_one({"_id": ObjectId(question_id)})
        if not question:
            continue
        
        points = question.get("points", 1)
        total_points += points
        
        # Check if answer is correct
        # question_id is a string in session["questions"]
        if question_id in answers:
            selected_answer = answers[question_id]
            if selected_answer == question.get("correctAnswer"):
                correct_count += 1
                earned_points += points
    
    # Calculate score percentage
    score = (earned_points / total_points * 100) if total_points > 0 else 0
    
    # Calculate time spent
    time_spent = None
    if session.get("startedAt"):
        time_spent = int((datetime.utcnow() - session["startedAt"]).total_seconds())
    
    # Update session
    update_data = {
        "answers": answers,
        "score": round(score, 2),
        "completed": True,
        "completedAt": datetime.utcnow(),
        "timeSpent": time_spent,
    }
    
    await db.quiz_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_data}
    )
    
    # Fetch and return updated session
    updated_session = await db.quiz_sessions.find_one({"_id": ObjectId(session_id)})
    updated_session["_id"] = str(updated_session["_id"])
    updated_session["id"] = updated_session["_id"]  # Add id field for frontend compatibility
    updated_session["user_id"] = str(updated_session["user_id"])
    
    return updated_session


@router.get("/sessions/user/{user_id}", response_model=List[QuizSessionResponse])
async def get_user_quiz_sessions(
    user_id: str,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db=Depends(get_database)
):
    """Get all quiz sessions for a user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    query = {"user_id": ObjectId(user_id)}
    if category:
        query["category"] = category
    
    cursor = db.quiz_sessions.find(query).sort("startedAt", -1).skip(skip).limit(limit)
    sessions = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for session in sessions:
        session["_id"] = str(session["_id"])
        session["id"] = session["_id"]  # Add id field for frontend compatibility
        session["user_id"] = str(session["user_id"])
    
    return sessions

