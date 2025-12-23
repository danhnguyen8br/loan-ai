"""
Application Schemas for Mortgage MVP

Extended user input model with:
- Property and purchase details
- Comparison horizon and prepayment planning
- Credit profile and preferences
- Repayment strategy for term optimization
"""
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class ApplicationPurpose(str, Enum):
    """Loan purpose types - simplified to 2 main options."""
    NEW_PURCHASE = "NEW_PURCHASE"  # Mua tài sản mới (nhà, chung cư)
    REFINANCE = "REFINANCE"        # Tái tài trợ khoản vay
    # Legacy purposes kept for backward compatibility
    HOME_PURCHASE = "HOME_PURCHASE"
    CONSTRUCTION = "CONSTRUCTION"
    REPAIR = "REPAIR"
    DEBT_SWAP = "DEBT_SWAP"
    BUSINESS_SECURED = "BUSINESS_SECURED"


class RepaymentStrategy(str, Enum):
    """
    Repayment strategy preference - drives term optimization and cost calculations.
    
    - UNCERTAIN: Not sure how long to keep loan → max term + reasonable prepayment fees
    - EARLY_EXIT: Plan to pay off in 12-36 months → low/decreasing prepayment fees
    - LONG_HOLD: Keep >5 years → focus on margin + floating rate transparency
    """
    UNCERTAIN = "UNCERTAIN"
    EARLY_EXIT = "EARLY_EXIT"
    LONG_HOLD = "LONG_HOLD"


# ============================================================================
# Income Schemas
# ============================================================================

class IncomeBase(BaseModel):
    source: str  # SALARY, BUSINESS, RENTAL, OTHER
    monthly_net: float
    proof_type: Optional[str] = None  # BANK_STATEMENT, TAX_RETURN, PAYSLIP
    proof_strength: Optional[str] = None  # STRONG, MEDIUM, WEAK


class IncomeCreate(IncomeBase):
    pass


class IncomeResponse(IncomeBase):
    id: UUID
    application_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Debt Schemas
# ============================================================================

class DebtBase(BaseModel):
    debt_type: str  # MORTGAGE, PERSONAL_LOAN, CREDIT_CARD, CAR_LOAN, OTHER
    monthly_payment: float
    outstanding_balance: Optional[float] = None
    remaining_months: Optional[int] = None


class DebtCreate(DebtBase):
    pass


class DebtResponse(DebtBase):
    id: UUID
    application_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Collateral Schemas
# ============================================================================

class CollateralBase(BaseModel):
    collateral_type: str  # HOUSE, LAND, APT, OFF_PLAN, COMMERCIAL, OTHER
    estimated_value: float
    location: Optional[str] = None  # Province code
    district: Optional[str] = None
    legal_status: Optional[str] = None  # CLEAR, PENDING, DISPUTED
    property_age_years: Optional[int] = None
    has_red_book: Optional[str] = None  # YES, NO, PENDING


class CollateralCreate(CollateralBase):
    pass


class CollateralResponse(CollateralBase):
    id: UUID
    application_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Preferences Schema
# ============================================================================

class UserPreferences(BaseModel):
    """User preferences for loan recommendations."""
    priority_cost_vs_stability: Optional[int] = Field(
        default=50, 
        ge=0, 
        le=100,
        description="0=lowest cost priority, 100=maximum stability priority"
    )
    min_fixed_months_preference: Optional[int] = Field(
        default=None,
        description="Minimum desired fixed rate period in months"
    )
    max_monthly_payment_cap_vnd: Optional[float] = Field(
        default=None,
        description="Maximum acceptable monthly payment"
    )
    avoid_mandatory_insurance: Optional[bool] = False
    need_fast_approval: Optional[bool] = False


# ============================================================================
# Credit Flags Schema
# ============================================================================

class CreditFlags(BaseModel):
    """Credit history indicators."""
    has_late_payments: Optional[bool] = False
    cic_bad_debt: Optional[bool] = False
    previous_loan_restructured: Optional[bool] = False
    cic_score: Optional[int] = None


# ============================================================================
# Application Schemas
# ============================================================================

class ApplicationBase(BaseModel):
    # Loan details
    purpose: str  # NEW_PURCHASE, REFINANCE (main) + legacy values
    loan_amount: float  # loan_amount_requested_vnd
    tenor_months: Optional[int] = None  # Now optional - auto-calculated based on strategy
    
    # Repayment strategy (new)
    repayment_strategy: Optional[str] = None  # UNCERTAIN, EARLY_EXIT, LONG_HOLD
    
    # Property/Purchase details (for NEW_PURCHASE)
    purchase_price_vnd: Optional[float] = None
    down_payment_vnd: Optional[float] = None
    
    # Refinance details (for REFINANCE)
    current_outstanding_balance_vnd: Optional[float] = None  # Outstanding balance at other bank
    
    # Comparison and prepayment planning
    planned_hold_months: Optional[int] = None  # Horizon H for cost comparison
    expected_prepayment_month: Optional[int] = None
    expected_prepayment_amount_vnd: Optional[float] = None  # None = full payoff
    
    # Timing
    need_disbursement_by_date: Optional[date] = None
    
    # Location (legacy - removed from new flow but kept for compatibility)
    geo_location: Optional[str] = None  # Province code: HCM, HN, DN, etc.
    
    # Borrower profile
    income_type: Optional[str] = None  # SALARY, BUSINESS, RENTAL, OTHER
    monthly_income_vnd: Optional[float] = None
    proof_strength: Optional[str] = None  # STRONG, MEDIUM, WEAK
    existing_debts_monthly_payment_vnd: Optional[float] = None
    
    # Credit history
    credit_flags: Optional[CreditFlags] = None
    
    # Property details
    property_type: Optional[str] = None  # HOUSE, LAND, APT, OFF_PLAN, COMMERCIAL, OTHER
    property_location_province: Optional[str] = None
    property_location_district: Optional[str] = None
    legal_status: Optional[str] = None  # CLEAR, PENDING, DISPUTED
    estimated_property_value_vnd: Optional[float] = None
    
    # Preferences
    preferences: Optional[UserPreferences] = None
    
    # Legacy
    stuck_reasons: Optional[List[str]] = None


class ApplicationCreate(ApplicationBase):
    incomes: List[IncomeCreate] = []
    debts: List[DebtCreate] = []
    collaterals: List[CollateralCreate] = []


class ApplicationUpdate(BaseModel):
    # All fields optional for partial updates
    purpose: Optional[str] = None
    loan_amount: Optional[float] = None
    tenor_months: Optional[int] = None
    repayment_strategy: Optional[str] = None
    purchase_price_vnd: Optional[float] = None
    down_payment_vnd: Optional[float] = None
    current_outstanding_balance_vnd: Optional[float] = None
    planned_hold_months: Optional[int] = None
    expected_prepayment_month: Optional[int] = None
    expected_prepayment_amount_vnd: Optional[float] = None
    need_disbursement_by_date: Optional[date] = None
    geo_location: Optional[str] = None
    income_type: Optional[str] = None
    monthly_income_vnd: Optional[float] = None
    proof_strength: Optional[str] = None
    existing_debts_monthly_payment_vnd: Optional[float] = None
    credit_flags: Optional[CreditFlags] = None
    property_type: Optional[str] = None
    property_location_province: Optional[str] = None
    property_location_district: Optional[str] = None
    legal_status: Optional[str] = None
    estimated_property_value_vnd: Optional[float] = None
    preferences: Optional[UserPreferences] = None
    stuck_reasons: Optional[List[str]] = None
    
    # Related entities
    incomes: Optional[List[IncomeCreate]] = None
    debts: Optional[List[DebtCreate]] = None
    collaterals: Optional[List[CollateralCreate]] = None


class ApplicationResponse(ApplicationBase):
    id: UUID
    user_id: Optional[UUID]
    status: str
    created_at: datetime
    updated_at: datetime
    incomes: List[IncomeResponse] = []
    debts: List[DebtResponse] = []
    collaterals: List[CollateralResponse] = []

    class Config:
        from_attributes = True


# ============================================================================
# Computed Metrics Schema
# ============================================================================

class ComputeMetricsResponse(BaseModel):
    """Computed financial metrics for an application."""
    application_id: UUID
    ltv: Optional[float] = None  # Loan-to-Value ratio
    dsr: Optional[float] = None  # Debt Service Ratio
    dti: Optional[float] = None  # Debt-to-Income ratio
    monthly_net_income: float
    total_monthly_debt_payments: float
    estimated_monthly_payment: Optional[float] = None
    available_for_new_debt: Optional[float] = None  # Income - existing debts
