from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel, EmailStr

from ..models.user import UserCreate, UserUpdate, UserResponse
from ..config.database import get_database

router = APIRouter(prefix="/users", tags=["Users"])


class LoginRequest(BaseModel):
    """Login request model"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response model"""
    user: UserResponse
    message: str = "Login successful"


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db=Depends(get_database)):
    """Login user (mock authentication - accepts any password)"""
    
    # Find user by email
    user = await db.users.find_one({"email": login_data.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Mock authentication - accept any password
    # In production, use password hashing (bcrypt)
    
    # Remove password from response
    if "password" in user:
        del user["password"]
    
    # Convert ObjectId to string
    user["_id"] = str(user["_id"])
    user["id"] = user["_id"]  # Add id field for compatibility
    
    return LoginResponse(user=user)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db=Depends(get_database)):
    """Create a new user"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document (password stored as-is for now, should be hashed in production)
    user_dict = user.model_dump()
    user_dict["created_at"] = datetime.utcnow()
    
    # Insert into database
    result = await db.users.insert_one(user_dict)
    
    # Fetch and return created user (without password)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    # Remove password from response
    if "password" in created_user:
        del created_user["password"]
    
    return created_user


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 10,
    role: str = None,
    db=Depends(get_database)
):
    """Get all users with optional filtering"""
    
    query = {}
    if role:
        query["role"] = role
    
    cursor = db.users.find(query).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for user in users:
        user["_id"] = str(user["_id"])
    
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db=Depends(get_database)):
    """Get a specific user by ID"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user["_id"] = str(user["_id"])
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, db=Depends(get_database)):
    """Update a user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    # Get existing user
    existing_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in user_update.dict(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update user
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # Fetch and return updated user
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    updated_user["_id"] = str(updated_user["_id"])
    
    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, db=Depends(get_database)):
    """Delete a user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return None
