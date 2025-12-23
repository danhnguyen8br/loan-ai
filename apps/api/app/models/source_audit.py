import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class SourceType(str, enum.Enum):
    """Type of data source"""
    WEB = "WEB"  # Crawled from website
    PDF = "PDF"  # Extracted from PDF document
    MANUAL = "MANUAL"  # Manually entered by admin


class SourceAudit(Base):
    """
    Audit trail for data sources.
    Tracks where product/bank data came from and stores raw snapshots for verification.
    """
    __tablename__ = "source_audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Can link to either a bank or a loan product
    bank_id = Column(UUID(as_uuid=True), ForeignKey("banks.id"), nullable=True)
    loan_product_id = Column(UUID(as_uuid=True), ForeignKey("loan_products.id"), nullable=True)
    
    # Source information
    source_type = Column(SQLEnum(SourceType), nullable=False)
    source_url = Column(String)
    
    # Raw content snapshot
    raw_text_snapshot = Column(Text)  # Extracted text content
    html_pdf_hash = Column(String)  # Hash of the original file for change detection
    page_version_hash = Column(String)  # Hash of the page structure
    
    # Metadata
    crawled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_by = Column(String)  # Admin username who verified
    verified_at = Column(DateTime)
    notes = Column(Text)
    
    # Relationships
    bank = relationship("Bank", back_populates="source_audits", foreign_keys=[bank_id])
    loan_product = relationship("LoanProduct", back_populates="source_audits", foreign_keys=[loan_product_id])

