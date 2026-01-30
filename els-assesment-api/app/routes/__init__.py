from .users import router as users_router
from .subjects import router as subjects_router
from .questions import router as questions_router
from .self_assessment import router as self_assessment_router
from .quiz import router as quiz_router

__all__ = ["users_router", "subjects_router", "questions_router", "self_assessment_router", "quiz_router"]
