from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from ..models.question import QuestionCreate, QuestionUpdate, QuestionResponse
from ..config.database import get_database

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(question: QuestionCreate, db=Depends(get_database)):
    """Create a new question"""
    
    # Validate subject and topic exist
    subject = await db.subjects.find_one({"_id": ObjectId(question.subject_id)})
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Create question document
    question_dict = question.dict()
    question_dict["created_at"] = datetime.utcnow()
    question_dict["status"] = "draft"
    question_dict["version"] = 1
    question_dict["archived"] = False
    
    # Insert into database
    result = await db.questions.insert_one(question_dict)
    
    # Fetch and return created question
    created_question = await db.questions.find_one({"_id": result.inserted_id})
    created_question["_id"] = str(created_question["_id"])
    
    return created_question


@router.get("/", response_model=List[QuestionResponse])
async def get_questions(
    skip: int = 0,
    limit: int = 10,
    subject_id: Optional[str] = None,
    topic_id: Optional[str] = None,
    difficulty_level: Optional[str] = Query(None, regex="^(Beginner|Intermediate|Advanced)$"),
    question_type: Optional[str] = Query(None, regex="^(multiple_choice|true_false|short_answer|essay)$"),
    status: Optional[str] = None,
    db=Depends(get_database)
):
    """Get all questions with optional filtering"""
    
    query = {"archived": False}
    
    if subject_id:
        query["subject_id"] = subject_id
    if topic_id:
        query["topic_id"] = topic_id
    if difficulty_level:
        query["difficulty_level"] = difficulty_level
    if question_type:
        query["question_type"] = question_type
    if status:
        query["status"] = status
    
    cursor = db.questions.find(query).skip(skip).limit(limit)
    questions = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for question in questions:
        question["_id"] = str(question["_id"])
    
    return questions


@router.get("/search", response_model=List[QuestionResponse])
async def search_questions(
    q: str = Query(..., min_length=3),
    skip: int = 0,
    limit: int = 10,
    db=Depends(get_database)
):
    """Search questions by text"""
    
    query = {
        "$and": [
            {"archived": False},
            {
                "$or": [
                    {"question_text": {"$regex": q, "$options": "i"}},
                    {"tags": {"$in": [q]}}
                ]
            }
        ]
    }
    
    cursor = db.questions.find(query).skip(skip).limit(limit)
    questions = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for question in questions:
        question["_id"] = str(question["_id"])
    
    return questions


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(question_id: str, db=Depends(get_database)):
    """Get a specific question by ID"""
    
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    question = await db.questions.find_one({"_id": ObjectId(question_id)})
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    question["_id"] = str(question["_id"])
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question_update: QuestionUpdate,
    db=Depends(get_database)
):
    """Update a question"""
    
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    # Get existing question
    existing_question = await db.questions.find_one({"_id": ObjectId(question_id)})
    if not existing_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if question is under review
    if existing_question.get("status") == "under_review":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit question while under review"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in question_update.dict(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update question
    await db.questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": update_data}
    )
    
    # Fetch and return updated question
    updated_question = await db.questions.find_one({"_id": ObjectId(question_id)})
    updated_question["_id"] = str(updated_question["_id"])
    
    return updated_question


@router.patch("/{question_id}/archive", status_code=status.HTTP_200_OK)
async def archive_question(question_id: str, db=Depends(get_database)):
    """Archive a question"""
    
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    result = await db.questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": {"archived": True, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return {"message": "Question archived successfully"}


@router.patch("/{question_id}/restore", status_code=status.HTTP_200_OK)
async def restore_question(question_id: str, db=Depends(get_database)):
    """Restore an archived question"""
    
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    result = await db.questions.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": {"archived": False, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return {"message": "Question restored successfully"}


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(question_id: str, db=Depends(get_database)):
    """Delete a question (hard delete)"""
    
    if not ObjectId.is_valid(question_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID"
        )
    
    result = await db.questions.delete_one({"_id": ObjectId(question_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return None
