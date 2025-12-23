import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Numeric, DateTime, Date, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PROCESSING = "PROCESSING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ProofStrength(str, enum.Enum):
    """Strength of income documentation"""
    STRONG = "STRONG"  # Official tax returns, audited statements
    MEDIUM = "MEDIUM"  # Bank statements, payslips
    WEAK = "WEAK"  # Self-declared, informal documentation


class IncomeType(str, enum.Enum):
    """Type of income source"""
    SALARY = "SALARY"
    BUSINESS = "BUSINESS"
    RENTAL = "RENTAL"
    OTHER = "OTHER"


class CollateralType(str, enum.Enum):
    """Type of collateral property"""
    HOUSE = "HOUSE"
    LAND = "LAND"
    APT = "APT"  # Apartment/Condo
    OFF_PLAN = "OFF_PLAN"  # Property under construction
    COMMERCIAL = "COMMERCIAL"
    OTHER = "OTHER"


class LegalStatus(str, enum.Enum):
    """Legal status of the collateral property"""
    CLEAR = "CLEAR"  # Red book, no encumbrances
    PENDING = "PENDING"  # Documentation in progress
    DISPUTED = "DISPUTED"  # Legal issues present


class RepaymentStrategy(str, enum.Enum):
    """
    Repayment strategy preference - drives term optimization and cost calculations.
    """
    UNCERTAIN = "UNCERTAIN"    # Not sure how long to keep → max term + reasonable prepayment fees
    EARLY_EXIT = "EARLY_EXIT"  # Pay off in 12-36 months → low/decreasing prepayment fees
    LONG_HOLD = "LONG_HOLD"    # Keep >5 years → focus on margin + floating rate transparency


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # ===== Loan Details =====
    purpose = Column(String, nullable=False)  # NEW_PURCHASE, REFINANCE (main) + legacy
    loan_amount = Column(Numeric(18, 2), nullable=False)  # loan_amount_requested_vnd
    tenor_months = Column(Integer, nullable=True)  # Now optional - auto-calculated based on strategy
    
    # Repayment strategy (new)
    repayment_strategy = Column(SQLEnum(RepaymentStrategy), nullable=True)
    
    # Property/Purchase details (for NEW_PURCHASE)
    purchase_price_vnd = Column(Numeric(18, 2))
    down_payment_vnd = Column(Numeric(18, 2))
    
    # Refinance details (for REFINANCE)
    current_outstanding_balance_vnd = Column(Numeric(18, 2))  # Outstanding at other bank
    
    # Comparison and prepayment planning
    planned_hold_months = Column(Integer)  # Horizon H for cost comparison
    expected_prepayment_month = Column(Integer)  # When user plans to prepay
    expected_prepayment_amount_vnd = Column(Numeric(18, 2))  # Amount (null = full payoff)
    
    # Timing requirements
    need_disbursement_by_date = Column(Date)
    
    # Location (legacy - removed from new flow but kept for compatibility)
    geo_location = Column(String)  # Province code: HCM, HN, DN, etc.

    # ===== Borrower Profile =====
    # Primary income info
    income_type = Column(SQLEnum(IncomeType))
    monthly_income_vnd = Column(Numeric(18, 2))
    proof_strength = Column(SQLEnum(ProofStrength))
    
    # Existing obligations
    existing_debts_monthly_payment_vnd = Column(Numeric(18, 2))
    
    # Credit history
    credit_flags = Column(JSONB, default=dict)
    # Structure: {
    #   "has_late_payments": false,
    #   "cic_bad_debt": false,
    #   "previous_loan_restructured": false,
    #   "cic_score": 750
    # }
    
    # ===== Property/Collateral Details =====
    property_type = Column(SQLEnum(CollateralType))
    property_location_province = Column(String)
    property_location_district = Column(String)
    legal_status = Column(SQLEnum(LegalStatus))
    estimated_property_value_vnd = Column(Numeric(18, 2))
    
    # ===== User Preferences =====
    preferences = Column(JSONB, default=dict)
    # Structure: {
    #   "priority_cost_vs_stability": 50,  # 0=lowest cost, 100=maximum stability
    #   "min_fixed_months_preference": 12,
    #   "max_monthly_payment_cap_vnd": 50000000,
    #   "avoid_mandatory_insurance": false,
    #   "need_fast_approval": false
    # }
    
    # Legacy fields for backward compatibility
    stuck_reasons = Column(JSONB)  # Array of codes: CIC_ISSUE, INCOME_UNPROVEN, etc.

    # Status
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.DRAFT, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    incomes = relationship("ApplicationIncome", back_populates="application", cascade="all, delete-orphan")
    debts = relationship("ApplicationDebt", back_populates="application", cascade="all, delete-orphan")
    collaterals = relationship("ApplicationCollateral", back_populates="application", cascade="all, delete-orphan")
    recommendations = relationship("RecommendationRun", back_populates="application")


class ApplicationIncome(Base):
    __tablename__ = "application_incomes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)

    source = Column(String, nullable=False)  # SALARY, BUSINESS, RENTAL, etc.
    monthly_net = Column(Numeric(18, 2), nullable=False)
    proof_type = Column(String)  # BANK_STATEMENT, TAX_RETURN, PAYSLIP
    proof_strength = Column(SQLEnum(ProofStrength))

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="incomes")


class ApplicationDebt(Base):
    __tablename__ = "application_debts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)

    debt_type = Column(String, nullable=False)  # MORTGAGE, PERSONAL_LOAN, CREDIT_CARD, etc.
    monthly_payment = Column(Numeric(18, 2), nullable=False)
    outstanding_balance = Column(Numeric(18, 2))
    remaining_months = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="debts")


class ApplicationCollateral(Base):
    __tablename__ = "application_collaterals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)

    collateral_type = Column(String, nullable=False)  # HOUSE, CONDO, LAND, etc.
    estimated_value = Column(Numeric(18, 2), nullable=False)
    location = Column(String)  # City/Province code
    district = Column(String)
    legal_status = Column(SQLEnum(LegalStatus))
    
    # Additional property details
    property_age_years = Column(Integer)
    has_red_book = Column(String)  # YES, NO, PENDING

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="collaterals")
