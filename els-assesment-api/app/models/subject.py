from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from bson import ObjectId
from .user import PyObjectId


class SubjectBase(BaseModel):
    """Base Subject model"""
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    level: str = Field(..., pattern="^(Elementary|Middle School|High School|College)$")


class SubjectCreate(SubjectBase):
    """Subject creation model"""
    pass


class SubjectUpdate(BaseModel):
    """Subject update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    level: Optional[str] = Field(None, pattern="^(Elementary|Middle School|High School|College)$")


class SubjectInDB(SubjectBase):
    """Subject model as stored in database"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "Mathematics",
                "code": "MATH-101",
                "description": "Basic Mathematics",
                "level": "High School",
                "created_at": "2026-01-28T10:00:00"
            }
        }
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class SubjectResponse(BaseModel):
    """Subject response model"""
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "name": "Mathematics",
                "code": "MATH-101",
                "description": "Basic Mathematics",
                "level": "High School",
                "created_at": "2026-01-28T10:00:00"
            }
        }
    )
    id: str = Field(alias="_id")
    name: str
    code: str
    description: Optional[str]
    level: str
    created_at: datetime
