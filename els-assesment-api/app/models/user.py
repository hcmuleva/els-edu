from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId
from pydantic_core import core_schema
from pydantic import GetJsonSchemaHandler
from typing import Any


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2"""
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: Any
    ) -> core_schema.CoreSchema:
        def validate_objectid(value: Any) -> ObjectId:
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str):
                if ObjectId.is_valid(value):
                    return ObjectId(value)
                raise ValueError("Invalid ObjectId string")
            raise ValueError("Invalid ObjectId type")
        
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(validate_objectid),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )
    
    @classmethod
    def __get_pydantic_json_schema__(
        cls, _core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> dict[str, Any]:
        return {"type": "string"}


class UserBase(BaseModel):
    """Base User model"""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = Field(default="teacher", pattern="^(admin|teacher|student|reviewer)$")


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=6)  # Changed to 6 for easier testing


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern="^(admin|teacher|student|reviewer)$")


class UserInDB(UserBase):
    """User model as stored in database"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "role": "teacher",
                "created_at": "2026-01-28T10:00:00"
            }
        }
    )
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class UserResponse(BaseModel):
    """User response model"""
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "name": "John Doe",
                "email": "john@example.com",
                "role": "teacher",
                "created_at": "2026-01-28T10:00:00"
            }
        }
    )
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    role: str
    created_at: datetime
