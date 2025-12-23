from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.schemas import applications as schemas
from app.services import applications as service

router = APIRouter()


@router.post("/", response_model=schemas.ApplicationResponse)
def create_application(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db)
):
    """Create a new loan application draft"""
    return service.create_application(db, application)


@router.get("/{application_id}", response_model=schemas.ApplicationResponse)
def get_application(application_id: UUID, db: Session = Depends(get_db)):
    """Get application by ID"""
    app = service.get_application(db, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.put("/{application_id}", response_model=schemas.ApplicationResponse)
def update_application(
    application_id: UUID,
    application: schemas.ApplicationUpdate,
    db: Session = Depends(get_db)
):
    """Update application with wizard data"""
    app = service.update_application(db, application_id, application)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.post("/{application_id}/compute", response_model=schemas.ComputeMetricsResponse)
def compute_metrics(application_id: UUID, db: Session = Depends(get_db)):
    """Compute DSR, LTV, and payment simulations"""
    app = service.get_application(db, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return service.compute_metrics(db, application_id)
