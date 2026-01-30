from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from datetime import datetime

from ..models.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from ..config.database import get_database

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(subject: SubjectCreate, db=Depends(get_database)):
    """Create a new subject"""
    
    # Check if code already exists
    existing_subject = await db.subjects.find_one({"code": subject.code})
    if existing_subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject code already exists"
        )
    
    # Create subject document
    subject_dict = subject.dict()
    subject_dict["created_at"] = datetime.utcnow()
    
    # Insert into database
    result = await db.subjects.insert_one(subject_dict)
    
    # Fetch and return created subject
    created_subject = await db.subjects.find_one({"_id": result.inserted_id})
    created_subject["_id"] = str(created_subject["_id"])
    
    return created_subject


@router.get("/", response_model=List[SubjectResponse])
async def get_subjects(
    skip: int = 0,
    limit: int = 10,
    level: str = None,
    db=Depends(get_database)
):
    """Get all subjects with optional filtering"""
    
    query = {}
    if level:
        query["level"] = level
    
    cursor = db.subjects.find(query).skip(skip).limit(limit)
    subjects = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for subject in subjects:
        subject["_id"] = str(subject["_id"])
    
    return subjects


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(subject_id: str, db=Depends(get_database)):
    """Get a specific subject by ID"""
    
    if not ObjectId.is_valid(subject_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subject ID"
        )
    
    subject = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    subject["_id"] = str(subject["_id"])
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    subject_update: SubjectUpdate,
    db=Depends(get_database)
):
    """Update a subject"""
    
    if not ObjectId.is_valid(subject_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subject ID"
        )
    
    # Get existing subject
    existing_subject = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    if not existing_subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in subject_update.dict(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update subject
    await db.subjects.update_one(
        {"_id": ObjectId(subject_id)},
        {"$set": update_data}
    )
    
    # Fetch and return updated subject
    updated_subject = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    updated_subject["_id"] = str(updated_subject["_id"])
    
    return updated_subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(subject_id: str, db=Depends(get_database)):
    """Delete a subject"""
    
    if not ObjectId.is_valid(subject_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subject ID"
        )
    
    result = await db.subjects.delete_one({"_id": ObjectId(subject_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found"
        )
    
    return None
