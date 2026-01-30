from motor.motor_asyncio import AsyncIOMotorClient
from .settings import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    
    
db = Database()


async def get_database():
    """Get database instance"""
    return db.client[settings.database_name]


async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        logger.info("Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(settings.mongodb_url)
        
        # Verify connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
        
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    try:
        logger.info("Closing MongoDB connection...")
        db.client.close()
        logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")
