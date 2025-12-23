import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class RateModel(Base):
    """
    Rate structure for a loan product.
    Supports multiple promotional rate options and floating rate configuration.
    """
    __tablename__ = "rate_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_product_id = Column(UUID(as_uuid=True), ForeignKey("loan_products.id"), nullable=False, unique=True)
    
    # Promotional rate options (multiple tiers possible)
    promo_options = Column(JSONB, default=list)
    # Structure: [
    #   {
    #     "option_name": "Standard Fixed",
    #     "fixed_months": 12,
    #     "fixed_rate_pct": 6.5,
    #     "conditions_text": "Min 1B VND loan amount"
    #   },
    #   {
    #     "option_name": "Extended Fixed",
    #     "fixed_months": 24,
    #     "fixed_rate_pct": 7.0,
    #     "conditions_text": "Payroll account required"
    #   }
    # ]
    
    # Floating rate configuration
    floating = Column(JSONB, default=dict)
    # Structure: {
    #   "floating_index_name": "12M Deposit Average",
    #   "floating_margin_pct": 3.5,
    #   "reset_frequency_months": 3,  # 1, 3, or 6
    #   "caps_floors": {
    #     "rate_floor_pct": 8.0,
    #     "rate_cap_pct": 15.0,
    #     "annual_adjustment_cap_pct": 2.0
    #   },
    #   "reference_rate_source_url": "https://bank.com/rates"
    # }
    
    # Assumed base reference rate when time series is unavailable
    reference_rate_base_pct = Column(Numeric(5, 2), default=5.0)
    
    # Documentation
    notes = Column(Text)
    assumptions = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    loan_product = relationship("LoanProduct", back_populates="rate_model")

