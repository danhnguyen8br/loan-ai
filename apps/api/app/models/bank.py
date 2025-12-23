import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BankType(str, enum.Enum):
    """Type of bank ownership"""
    SOCB = "SOCB"  # State-Owned Commercial Bank
    PRIVATE = "PRIVATE"  # Private/Joint-Stock Commercial Bank
    FOREIGN = "FOREIGN"  # Foreign Bank


class Bank(Base):
    __tablename__ = "banks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)
    bank_type = Column(SQLEnum(BankType), nullable=False, default=BankType.PRIVATE)
    
    # Contact and presence
    logo_url = Column(String)
    official_site = Column(String)
    contact_hotline = Column(String)
    description = Column(Text)
    coverage_provinces = Column(JSONB, default=list)  # Array of province codes
    
    # Processing SLA (in days)
    processing_sla = Column(JSONB, default=dict)
    # Structure: {
    #   "pre_approval_days": int,
    #   "appraisal_days": int,
    #   "final_approval_days": int,
    #   "disbursement_days": int
    # }
    
    # Data sourcing and verification
    source_urls = Column(JSONB, default=list)  # Array of URLs
    last_verified_at = Column(DateTime)
    last_crawled_at = Column(DateTime)
    data_confidence_score = Column(Integer, default=50)  # 0-100
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    loan_products = relationship("LoanProduct", back_populates="bank")
    source_audits = relationship("SourceAudit", back_populates="bank", foreign_keys="SourceAudit.bank_id")
