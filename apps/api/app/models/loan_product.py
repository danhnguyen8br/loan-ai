import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Numeric, DateTime, Date, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class LoanPurpose(str, enum.Enum):
    """Purpose of the loan"""
    HOME_PURCHASE = "HOME_PURCHASE"
    CONSTRUCTION = "CONSTRUCTION"
    REPAIR = "REPAIR"
    REFINANCE = "REFINANCE"
    DEBT_SWAP = "DEBT_SWAP"
    BUSINESS_SECURED = "BUSINESS_SECURED"


class RepaymentMethod(str, enum.Enum):
    """Repayment calculation method"""
    ANNUITY = "annuity"  # Equal total payment (PMT)
    EQUAL_PRINCIPAL = "equal_principal"  # Declining payment


class PaymentFrequency(str, enum.Enum):
    """Payment frequency"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class LoanProduct(Base):
    __tablename__ = "loan_products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_id = Column(UUID(as_uuid=True), ForeignKey("banks.id"), nullable=False)

    # Basic info
    name = Column(String, nullable=False)
    purpose = Column(SQLEnum(LoanPurpose), nullable=False)
    description = Column(Text)
    target_segment = Column(JSONB, default=list)  # e.g., ["SALARIED", "BUSINESS_OWNER"]
    
    # Currency and validity
    currency = Column(String, default="VND", nullable=False)
    effective_from = Column(Date)
    effective_to = Column(Date)
    
    # Loan amount constraints
    min_loan_amount = Column(Numeric(18, 2))
    max_loan_amount = Column(Numeric(18, 2))
    max_ltv_pct = Column(Numeric(5, 2))  # e.g., 70.00 for 70%
    
    # Term constraints
    min_term_months = Column(Integer)
    max_term_months = Column(Integer)
    max_age_at_maturity = Column(Integer)  # e.g., 65 or 70
    
    # Eligibility requirements (JSONB for flexibility)
    eligibility = Column(JSONB, default=dict)
    # Structure: {
    #   "income_type_supported": ["SALARY", "BUSINESS", "RENTAL", "OTHER"],
    #   "min_income_vnd": 15000000,
    #   "employment_tenure_months": 12,
    #   "credit_requirements_text": "No bad debt in last 5 years",
    #   "required_relationships": ["payroll", "CASA"]  # e.g., must have payroll account
    # }
    
    # Collateral requirements
    collateral = Column(JSONB, default=dict)
    # Structure: {
    #   "collateral_types": ["HOUSE", "LAND", "APT", "OFF_PLAN", "OTHER"],
    #   "legal_constraints_text": ["Red book required", "No disputes"],
    #   "appraisal_method_note": "Bank-appointed appraiser"
    # }
    
    # Repayment structure
    repayment = Column(JSONB, default=dict)
    # Structure: {
    #   "repayment_method": "annuity" | "equal_principal",
    #   "payment_frequency": "monthly",
    #   "grace_principal_months": 0,
    #   "grace_interest_months": 0
    # }
    
    # Legacy fields for backward compatibility (can be removed later)
    rate_fixed_months = Column(Integer)
    rate_fixed = Column(Numeric(5, 2))
    floating_margin = Column(Numeric(5, 2))
    reference_rate_name = Column(String)
    constraints_json = Column(JSONB)  # Old format - to be deprecated
    sla_days_estimate = Column(Integer)
    reference_url = Column(String)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    bank = relationship("Bank", back_populates="loan_products")
    rate_model = relationship("RateModel", back_populates="loan_product", uselist=False, cascade="all, delete-orphan")
    fees_penalties = relationship("FeesPenalties", back_populates="loan_product", uselist=False, cascade="all, delete-orphan")
    source_audits = relationship("SourceAudit", back_populates="loan_product", foreign_keys="SourceAudit.loan_product_id")
