from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB Configuration
    mongodb_url: str = "mongodb://admin:admin123@mongodb:27017"
    database_name: str = "els_database"
    
    # Application Configuration
    environment: str = "development"
    debug: bool = True
    
    # API Configuration
    api_title: str = "ELS System API"
    api_version: str = "1.0.0"
    api_description: str = "FastAPI application with MongoDB for ELS System"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
