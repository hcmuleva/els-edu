from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .config import settings, connect_to_mongo, close_mongo_connection
from .routes import users_router, subjects_router, questions_router, self_assessment_router, quiz_router
from .routes.init import router as init_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting application...")
    await connect_to_mongo()
    
    # Ensure collections exist and are initialized
    try:
        from .utils.database_utils import ensure_collections_exist
        from .config.database import db
        if db.client:
            database = db.client[settings.database_name]
            await ensure_collections_exist(database)
    except Exception as e:
        logger.warning(f"Could not auto-initialize collections: {e}")
        # Don't fail startup - collections will be created on first use
    
    logger.info("Application started successfully!")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down application...")
    await close_mongo_connection()
    logger.info("Application shut down successfully!")


# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - Health check"""
    return {
        "status": "ok",
        "message": "Welcome to ELS System API",
        "version": settings.api_version,
        "docs": "/api/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "ELS System API",
        "version": settings.api_version,
        "environment": settings.environment
    }


# Include routers
app.include_router(users_router, prefix="/api")
app.include_router(subjects_router, prefix="/api")
app.include_router(questions_router, prefix="/api")
app.include_router(self_assessment_router, prefix="/api")
app.include_router(quiz_router, prefix="/api")
app.include_router(init_router, prefix="/api")


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors"""
    return {
        "error": "Not Found",
        "message": f"The requested resource was not found",
        "path": str(request.url)
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors"""
    logger.error(f"Internal error: {exc}")
    return {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
