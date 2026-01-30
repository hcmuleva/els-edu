from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from .user import PyObjectId


class AssessmentOption(BaseModel):
    """Individual option within a skill type"""
    id: str
    name: str
    question: str
    type: Optional[str] = None  # e.g., "SQL", "NoSQL" for databases


class SkillType(BaseModel):
    """Skill type within a category"""
    id: str
    skillType: str
    description: str
    options: List[AssessmentOption]
    aggregateTo: str  # Maps to expected format


class SelfAssessmentBase(BaseModel):
    """Base self-assessment model"""
    category: str  # development, testing, devops, agentic-ai, mobile-app
    skillTypes: List[SkillType]
    version: str = Field(default="1.0.0")  # Version of assessment structure


class SelfAssessmentCreate(SelfAssessmentBase):
    """Self-assessment creation model"""
    pass


class SelfAssessmentInDB(SelfAssessmentBase):
    """Self-assessment as stored in database"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class SelfAssessmentResponse(BaseModel):
    """Self-assessment response model"""
    model_config = ConfigDict(
        populate_by_name=True,
    )
    id: str = Field(alias="_id")
    category: str
    skillTypes: List[Dict[str, Any]]
    version: str
    created_at: datetime
    updated_at: Optional[datetime] = None


# Self-Assessment Result Models
class DetailedRating(BaseModel):
    """Individual rating for a specific option"""
    ratingKey: str  # e.g., "development-dev-languages-js"
    rating: int = Field(..., ge=1, le=10)


class SelfAssessmentResultBase(BaseModel):
    """Base self-assessment result model"""
    user_id: PyObjectId  # Reference to user
    detailedRatings: Dict[str, int]  # ratingKey -> rating
    aggregatedResults: Dict[str, Dict[str, float]]  # category -> {skill: rating}
    completed: bool = False
    completedAt: Optional[datetime] = None


class SelfAssessmentResultCreate(BaseModel):
    """Self-assessment result creation model"""
    user_id: str
    detailedRatings: Dict[str, int]
    aggregatedResults: Dict[str, Dict[str, float]]


class SelfAssessmentResultUpdate(BaseModel):
    """Self-assessment result update model"""
    detailedRatings: Optional[Dict[str, int]] = None
    aggregatedResults: Optional[Dict[str, Dict[str, float]]] = None
    completed: Optional[bool] = None
    completedAt: Optional[datetime] = None


class SelfAssessmentResultInDB(SelfAssessmentResultBase):
    """Self-assessment result as stored in database"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class SelfAssessmentResultResponse(BaseModel):
    """Self-assessment result response model"""
    model_config = ConfigDict(
        populate_by_name=True,
    )
    id: str = Field(alias="_id")
    user_id: str
    detailedRatings: Dict[str, int]
    aggregatedResults: Dict[str, Dict[str, float]]
    completed: bool
    completedAt: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

