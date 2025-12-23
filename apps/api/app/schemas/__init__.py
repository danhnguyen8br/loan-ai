# Re-export all schemas for easy importing
from app.schemas import applications
from app.schemas import products
from app.schemas import recommendations
from app.schemas import users
from app.schemas import ai_comparison

__all__ = [
    "applications",
    "products",
    "recommendations",
    "users",
    "ai_comparison",
]

