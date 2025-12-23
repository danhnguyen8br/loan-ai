import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class FeesPenalties(Base):
    """
    Fee structure and penalty rules for a loan product.
    Comprehensive model covering upfront, recurring, prepayment, and late fees.
    """
    __tablename__ = "fees_penalties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loan_product_id = Column(UUID(as_uuid=True), ForeignKey("loan_products.id"), nullable=False, unique=True)
    
    # Upfront fees (at disbursement)
    upfront = Column(JSONB, default=dict)
    # Structure: {
    #   "origination_fee_pct": 0.5,
    #   "origination_min_vnd": 500000,
    #   "origination_max_vnd": 50000000,
    #   "appraisal_fee_vnd": 2000000,
    #   "disbursement_fee_vnd": 0,
    #   "disbursement_fee_pct": 0,
    #   "legal_fees_note": "Notarization and registration at borrower's cost"
    # }
    
    # Recurring fees (during loan lifetime)
    recurring = Column(JSONB, default=dict)
    # Structure: {
    #   "account_maintenance_fee_vnd": 50000,  # per month
    #   "insurance_annual_pct": 0.05,  # 0.05% of balance/year
    #   "insurance_vnd": 0,  # Alternative: fixed amount
    #   "insurance_basis": "on_balance" | "on_property_value",
    #   "mandatory_insurance_flag": true
    # }
    
    # Prepayment fees
    prepayment = Column(JSONB, default=dict)
    # Structure: {
    #   "prepayment_schedule": [
    #     {"months_from": 1, "months_to": 12, "fee_pct": 3.0},
    #     {"months_from": 13, "months_to": 24, "fee_pct": 2.0},
    #     {"months_from": 25, "months_to": 36, "fee_pct": 1.0},
    #     {"months_from": 37, "months_to": null, "fee_pct": 0}
    #   ],
    #   "partial_prepayment_min_vnd": 50000000,
    #   "partial_prepayment_note": "Max 2 partial prepayments per year"
    # }
    
    # Late payment and overdue fees
    late_overdue = Column(JSONB, default=dict)
    # Structure: {
    #   "late_payment_fee_rule": "150% of standard interest rate on overdue amount",
    #   "overdue_interest_rule": "Standard rate + 2% per annum",
    #   "grace_days_before_late": 3,
    #   "penalty_notes": "Bank may demand early repayment after 90 days overdue"
    # }
    
    # Additional notes
    notes = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    loan_product = relationship("LoanProduct", back_populates="fees_penalties")

