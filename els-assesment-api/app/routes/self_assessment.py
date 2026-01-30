from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from ..models.self_assessment import (
    SelfAssessmentCreate,
    SelfAssessmentResponse,
    SelfAssessmentResultCreate,
    SelfAssessmentResultUpdate,
    SelfAssessmentResultResponse
)
from ..config.database import get_database
from ..utils.database_utils import ensure_self_assessments_collection

router = APIRouter(prefix="/self-assessments", tags=["Self Assessments"])


# Self-Assessment (Questions Structure) Routes
@router.post("/questions", response_model=SelfAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_self_assessment(
    assessment: SelfAssessmentCreate,
    db=Depends(get_database)
):
    """Create a new self-assessment question structure"""
    
    # Check if category already exists
    existing = await db.self_assessments.find_one({"category": assessment.category})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Self-assessment for category '{assessment.category}' already exists"
        )
    
    # Convert to dict and prepare for insertion
    assessment_dict = assessment.model_dump()
    assessment_dict["created_at"] = datetime.utcnow()
    
    # Insert into database
    result = await db.self_assessments.insert_one(assessment_dict)
    
    # Fetch and return created assessment
    created_assessment = await db.self_assessments.find_one({"_id": result.inserted_id})
    created_assessment["_id"] = str(created_assessment["_id"])
    
    return created_assessment


@router.get("/questions", response_model=List[SelfAssessmentResponse])
async def get_self_assessments(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_database)
):
    """Get all self-assessment question structures"""
    
    # Ensure collection exists and is initialized
    await ensure_self_assessments_collection(db)
    
    query = {}
    if category:
        query["category"] = category
    
    cursor = db.self_assessments.find(query).skip(skip).limit(limit)
    assessments = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for assessment in assessments:
        assessment["_id"] = str(assessment["_id"])
    
    return assessments


@router.get("/questions/{assessment_id}", response_model=SelfAssessmentResponse)
async def get_self_assessment(assessment_id: str, db=Depends(get_database)):
    """Get a specific self-assessment by ID"""
    
    if not ObjectId.is_valid(assessment_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid assessment ID"
        )
    
    assessment = await db.self_assessments.find_one({"_id": ObjectId(assessment_id)})
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Self-assessment not found"
        )
    
    assessment["_id"] = str(assessment["_id"])
    return assessment


@router.get("/questions/category/{category}", response_model=SelfAssessmentResponse)
async def get_self_assessment_by_category(category: str, db=Depends(get_database)):
    """Get self-assessment by category"""
    
    # Ensure collection exists and is initialized
    await ensure_self_assessments_collection(db)
    
    assessment = await db.self_assessments.find_one({"category": category})
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Self-assessment for category '{category}' not found"
        )
    
    assessment["_id"] = str(assessment["_id"])
    return assessment


# Self-Assessment Result Routes
@router.post("/results", response_model=SelfAssessmentResultResponse, status_code=status.HTTP_201_CREATED)
async def create_self_assessment_result(
    result: SelfAssessmentResultCreate,
    db=Depends(get_database)
):
    """Create a new self-assessment result"""
    
    # Validate user_id
    if not ObjectId.is_valid(result.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(result.user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user already has a result (update instead of create)
    existing_result = await db.self_assessment_results.find_one(
        {"user_id": ObjectId(result.user_id)}
    )
    
    if existing_result:
        # Update existing result
        update_data = {
            "detailedRatings": result.detailedRatings,
            "aggregatedResults": result.aggregatedResults,
            "completed": True,
            "completedAt": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.self_assessment_results.update_one(
            {"_id": existing_result["_id"]},
            {"$set": update_data}
        )
        
        # Fetch and return updated result
        updated_result = await db.self_assessment_results.find_one(
            {"_id": existing_result["_id"]}
        )
        updated_result["_id"] = str(updated_result["_id"])
        updated_result["user_id"] = str(updated_result["user_id"])
        return updated_result
    
    # Create new result
    result_dict = result.model_dump()
    result_dict["user_id"] = ObjectId(result.user_id)
    result_dict["completed"] = True
    result_dict["completedAt"] = datetime.utcnow()
    result_dict["created_at"] = datetime.utcnow()
    
    # Insert into database
    insert_result = await db.self_assessment_results.insert_one(result_dict)
    
    # Fetch and return created result
    created_result = await db.self_assessment_results.find_one({"_id": insert_result.inserted_id})
    created_result["_id"] = str(created_result["_id"])
    created_result["user_id"] = str(created_result["user_id"])
    
    return created_result


@router.get("/results", response_model=List[SelfAssessmentResultResponse])
async def get_self_assessment_results(
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_database)
):
    """Get all self-assessment results"""
    
    query = {}
    if user_id:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID"
            )
        query["user_id"] = ObjectId(user_id)
    
    cursor = db.self_assessment_results.find(query).skip(skip).limit(limit).sort("created_at", -1)
    results = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for result in results:
        result["_id"] = str(result["_id"])
        result["user_id"] = str(result["user_id"])
    
    return results


@router.get("/results/{result_id}", response_model=SelfAssessmentResultResponse)
async def get_self_assessment_result(result_id: str, db=Depends(get_database)):
    """Get a specific self-assessment result by ID"""
    
    if not ObjectId.is_valid(result_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid result ID"
        )
    
    result = await db.self_assessment_results.find_one({"_id": ObjectId(result_id)})
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Self-assessment result not found"
        )
    
    result["_id"] = str(result["_id"])
    result["user_id"] = str(result["user_id"])
    return result


@router.get("/results/user/{user_id}")
async def get_user_self_assessment_result(user_id: str, db=Depends(get_database)):
    """Get self-assessment result for a specific user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    result = await db.self_assessment_results.find_one({"user_id": ObjectId(user_id)})
    
    if not result:
        # Return empty response instead of 404 for new users who haven't completed assessment
        return {"message": "No self-assessment result found for this user"}
    
    result["_id"] = str(result["_id"])
    result["user_id"] = str(result["user_id"])
    return result


@router.put("/results/{result_id}", response_model=SelfAssessmentResultResponse)
async def update_self_assessment_result(
    result_id: str,
    result_update: SelfAssessmentResultUpdate,
    db=Depends(get_database)
):
    """Update a self-assessment result"""
    
    if not ObjectId.is_valid(result_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid result ID"
        )
    
    # Get existing result
    existing_result = await db.self_assessment_results.find_one({"_id": ObjectId(result_id)})
    if not existing_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Self-assessment result not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in result_update.model_dump(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update result
    await db.self_assessment_results.update_one(
        {"_id": ObjectId(result_id)},
        {"$set": update_data}
    )
    
    # Fetch and return updated result
    updated_result = await db.self_assessment_results.find_one({"_id": ObjectId(result_id)})
    updated_result["_id"] = str(updated_result["_id"])
    updated_result["user_id"] = str(updated_result["user_id"])
    
    return updated_result


@router.delete("/results/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_self_assessment_result(result_id: str, db=Depends(get_database)):
    """Delete a self-assessment result"""
    
    if not ObjectId.is_valid(result_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid result ID"
        )
    
    result = await db.self_assessment_results.delete_one({"_id": ObjectId(result_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Self-assessment result not found"
        )
    
    return None

