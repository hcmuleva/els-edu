from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from .user import PyObjectId


class QuizOption(BaseModel):
    """Answer option for a quiz question"""
    id: str
    text: str
    isCorrect: bool = False


class QuizQuestion(BaseModel):
    """Individual quiz question"""
    question: str = Field(..., min_length=10)
    options: List[QuizOption] = Field(..., min_items=2, max_items=6)
    explanation: Optional[str] = None
    difficulty: str = Field(..., pattern="^(Beginner|Intermediate|Advanced)$")
    points: int = Field(default=1, ge=1, le=10)
    tags: List[str] = Field(default_factory=list)  # e.g., ["JavaScript", "ES6", "Async"]


class QuizQuestionBase(BaseModel):
    """Base quiz question model"""
    category: str  # development, testing, devops, agentic-ai, mobile-app
    skillType: str  # e.g., "Programming Languages", "Frontend Technologies"
    question: str
    options: List[Dict[str, Any]]  # List of option dicts
    correctAnswer: str  # ID of correct option
    explanation: Optional[str] = None
    difficulty: str = Field(..., pattern="^(Beginner|Intermediate|Advanced)$")
    points: int = Field(default=1, ge=1, le=10)
    tags: List[str] = Field(default_factory=list)


class QuizQuestionCreate(QuizQuestionBase):
    """Quiz question creation model"""
    pass


class QuizQuestionUpdate(BaseModel):
    """Quiz question update model"""
    question: Optional[str] = None
    options: Optional[List[Dict[str, Any]]] = None
    correctAnswer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[str] = Field(None, pattern="^(Beginner|Intermediate|Advanced)$")
    points: Optional[int] = Field(None, ge=1, le=10)
    tags: Optional[List[str]] = None


class QuizQuestionInDB(QuizQuestionBase):
    """Quiz question as stored in database"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class QuizQuestionResponse(BaseModel):
    """Quiz question response model (without correct answer for quiz taking)"""
    model_config = ConfigDict(
        populate_by_name=True,
    )
    id: str = Field(alias="_id")
    category: str
    skillType: str
    question: str
    options: List[Dict[str, Any]]
    difficulty: str
    points: int
    tags: List[str]
    explanation: Optional[str] = None
    created_at: datetime


class QuizQuestionWithAnswer(QuizQuestionResponse):
    """Quiz question with correct answer (for admin/review)"""
    correctAnswer: str


class QuizSessionBase(BaseModel):
    """Base quiz session model"""
    user_id: PyObjectId
    category: str
    questions: List[str]  # List of question IDs
    answers: Dict[str, str] = Field(default_factory=dict)  # questionId -> selectedOptionId
    score: Optional[float] = None
    totalPoints: int = 0
    completed: bool = False
    startedAt: datetime = Field(default_factory=datetime.utcnow)
    completedAt: Optional[datetime] = None
    timeSpent: Optional[int] = None  # in seconds


class QuizSessionCreate(BaseModel):
    """Quiz session creation model"""
    user_id: str
    category: str
    difficulty: Optional[str] = None  # Filter questions by difficulty
    skillType: Optional[str] = None  # Filter questions by skill type
    questionCount: int = Field(default=10, ge=5, le=50)


class QuizSessionResponse(BaseModel):
    """Quiz session response model"""
    model_config = ConfigDict(
        populate_by_name=True,
    )
    id: str = Field(alias="_id")
    user_id: str
    category: str
    questions: List[str]
    answers: Dict[str, str]
    score: Optional[float] = None
    totalPoints: int
    completed: bool
    startedAt: datetime
    completedAt: Optional[datetime] = None
    timeSpent: Optional[int] = None

