from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.schemas import recommendations as schemas
from app.services import recommendations as service

router = APIRouter()


@router.post("/{application_id}/recommend", response_model=schemas.RecommendationResponse)
def generate_recommendations(
    application_id: UUID,
    db: Session = Depends(get_db)
):
    """Generate loan product recommendations for an application"""
    try:
        return service.generate_recommendations(db, application_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")


@router.get("/{recommendation_id}", response_model=schemas.RecommendationResponse)
def get_recommendation(recommendation_id: UUID, db: Session = Depends(get_db)):
    """Get recommendation by ID"""
    recommendation = service.get_recommendation(db, recommendation_id)
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return recommendation
