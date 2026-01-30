from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from .user import PyObjectId


class QuestionBase(BaseModel):
    """Base Question model"""
    subject_id: str
    topic_id: str
    question_text: str = Field(..., min_length=10)
    question_type: str = Field(..., pattern="^(multiple_choice|true_false|short_answer|essay)$")
    difficulty_level: str = Field(..., pattern="^(Beginner|Intermediate|Advanced)$")
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    tags: Optional[List[str]] = []
    points: int = Field(default=1, ge=1)


class QuestionCreate(QuestionBase):
    """Question creation model"""
    pass


class QuestionUpdate(BaseModel):
    """Question update model"""
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None
    question_text: Optional[str] = Field(None, min_length=10)
    question_type: Optional[str] = Field(None, pattern="^(multiple_choice|true_false|short_answer|essay)$")
    difficulty_level: Optional[str] = Field(None, pattern="^(Beginner|Intermediate|Advanced)$")
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    tags: Optional[List[str]] = None
    points: Optional[int] = Field(None, ge=1)


class QuestionInDB(QuestionBase):
    """Question model as stored in database"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "subject_id": "507f1f77bcf86cd799439011",
                "topic_id": "507f1f77bcf86cd799439012",
                "question_text": "What is 2 + 2?",
                "question_type": "multiple_choice",
                "difficulty_level": "Beginner",
                "options": ["2", "3", "4", "5"],
                "correct_answer": "4",
                "explanation": "2 plus 2 equals 4",
                "tags": ["arithmetic", "addition"],
                "points": 1,
                "status": "draft"
            }
        }
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    status: str = Field(default="draft")  # draft, under_review, approved, rejected
    created_by: Optional[str] = None
    version: int = Field(default=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    archived: bool = Field(default=False)


class QuestionResponse(BaseModel):
    """Question response model"""
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(alias="_id")
    subject_id: str
    topic_id: str
    question_text: str
    question_type: str
    difficulty_level: str
    options: Optional[List[str]]
    correct_answer: str
    explanation: Optional[str]
    tags: Optional[List[str]]
    points: int
    status: str
    created_at: datetime
