import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class RecommendationRun(Base):
    """Audit log of recommendation generations"""
    __tablename__ = "recommendation_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)

    # Snapshot of application at recommendation time
    application_snapshot = Column(JSONB, nullable=False)

    # Recommendation results
    top_recommendations = Column(JSONB, nullable=False)  # Array of recommended products with scores
    rejected_products = Column(JSONB, nullable=False)  # Array of rejected products with reasons
    scenarios = Column(JSONB, default=dict)  # Stress test scenarios per product

    # Metadata
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="recommendations")
