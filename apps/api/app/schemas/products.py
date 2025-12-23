"""
Product Schemas for Mortgage MVP

Full product schema including:
- Rate model with promo options and floating configuration
- Fee structure with upfront, recurring, and prepayment fees
- Eligibility and collateral requirements
"""
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional, Dict, Any, List


# ============================================================================
# Rate Model Schemas
# ============================================================================

class PromoOption(BaseModel):
    """A single promotional rate option."""
    option_name: Optional[str] = None
    fixed_months: int
    fixed_rate_pct: float
    conditions_text: Optional[str] = None


class FloatingConfig(BaseModel):
    """Floating rate configuration."""
    floating_index_name: Optional[str] = None  # e.g., "12M Deposit Average"
    floating_margin_pct: float = 0
    reset_frequency_months: Optional[int] = None  # 1, 3, or 6
    caps_floors: Optional[Dict[str, float]] = None
    reference_rate_source_url: Optional[str] = None


class RateModelBase(BaseModel):
    promo_options: List[PromoOption] = []
    floating: Optional[FloatingConfig] = None
    reference_rate_base_pct: Optional[float] = 5.0
    notes: Optional[str] = None
    assumptions: Optional[str] = None


class RateModelCreate(RateModelBase):
    pass


class RateModelResponse(RateModelBase):
    id: UUID
    loan_product_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Fees & Penalties Schemas
# ============================================================================

class UpfrontFees(BaseModel):
    """Upfront fees at disbursement."""
    origination_fee_pct: Optional[float] = 0
    origination_min_vnd: Optional[float] = 0
    origination_max_vnd: Optional[float] = None
    appraisal_fee_vnd: Optional[float] = 0
    disbursement_fee_vnd: Optional[float] = 0
    disbursement_fee_pct: Optional[float] = 0
    legal_fees_note: Optional[str] = None


class RecurringFees(BaseModel):
    """Recurring fees during loan lifetime."""
    account_maintenance_fee_vnd: Optional[float] = 0
    insurance_annual_pct: Optional[float] = 0
    insurance_vnd: Optional[float] = 0
    insurance_basis: Optional[str] = "on_balance"  # on_balance or on_property_value
    mandatory_insurance_flag: Optional[bool] = False


class PrepaymentTier(BaseModel):
    """A single prepayment fee tier."""
    months_from: int
    months_to: Optional[int] = None  # None = no upper limit
    fee_pct: float


class PrepaymentFees(BaseModel):
    """Prepayment fee structure."""
    prepayment_schedule: List[PrepaymentTier] = []
    partial_prepayment_min_vnd: Optional[float] = None
    partial_prepayment_note: Optional[str] = None


class LateOverdueFees(BaseModel):
    """Late payment and overdue rules."""
    late_payment_fee_rule: Optional[str] = None
    overdue_interest_rule: Optional[str] = None
    grace_days_before_late: Optional[int] = 3
    penalty_notes: Optional[str] = None


class FeesPenaltiesBase(BaseModel):
    upfront: Optional[UpfrontFees] = None
    recurring: Optional[RecurringFees] = None
    prepayment: Optional[PrepaymentFees] = None
    late_overdue: Optional[LateOverdueFees] = None
    notes: Optional[str] = None


class FeesPenaltiesCreate(FeesPenaltiesBase):
    pass


class FeesPenaltiesResponse(FeesPenaltiesBase):
    id: UUID
    loan_product_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Eligibility & Collateral Schemas
# ============================================================================

class EligibilityRequirements(BaseModel):
    """Eligibility requirements for a loan product."""
    income_type_supported: List[str] = []  # SALARY, BUSINESS, RENTAL, OTHER
    min_income_vnd: Optional[float] = None
    employment_tenure_months: Optional[int] = None
    credit_requirements_text: Optional[str] = None
    required_relationships: List[str] = []  # payroll, CASA, card, insurance


class CollateralRequirements(BaseModel):
    """Collateral requirements for a loan product."""
    collateral_types: List[str] = []  # HOUSE, LAND, APT, OFF_PLAN, OTHER
    legal_constraints_text: List[str] = []
    appraisal_method_note: Optional[str] = None


class RepaymentConfig(BaseModel):
    """Repayment configuration."""
    repayment_method: str = "annuity"  # annuity or equal_principal
    payment_frequency: str = "monthly"
    grace_principal_months: int = 0
    grace_interest_months: int = 0


# ============================================================================
# Product Schemas
# ============================================================================

class ProductBase(BaseModel):
    bank_id: UUID
    name: str
    purpose: str  # HOME_PURCHASE, CONSTRUCTION, REPAIR, REFINANCE, DEBT_SWAP, BUSINESS_SECURED
    description: Optional[str] = None
    target_segment: List[str] = []  # SALARIED, BUSINESS_OWNER, etc.
    
    # Currency and validity
    currency: str = "VND"
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    
    # Loan constraints
    min_loan_amount: Optional[float] = None
    max_loan_amount: Optional[float] = None
    max_ltv_pct: Optional[float] = None
    min_term_months: Optional[int] = None
    max_term_months: Optional[int] = None
    max_age_at_maturity: Optional[int] = None
    
    # Complex requirements
    eligibility: Optional[EligibilityRequirements] = None
    collateral: Optional[CollateralRequirements] = None
    repayment: Optional[RepaymentConfig] = None
    
    # Legacy fields
    rate_fixed_months: Optional[int] = None
    rate_fixed: Optional[float] = None
    floating_margin: Optional[float] = None
    reference_rate_name: Optional[str] = None
    constraints_json: Optional[Dict[str, Any]] = None
    sla_days_estimate: Optional[int] = None
    reference_url: Optional[str] = None
    
    is_active: bool = True


class ProductCreate(ProductBase):
    # Optionally include rate model and fees in creation
    rate_model: Optional[RateModelCreate] = None
    fees_penalties: Optional[FeesPenaltiesCreate] = None


class ProductUpdate(BaseModel):
    # All fields optional for partial updates
    bank_id: Optional[UUID] = None
    name: Optional[str] = None
    purpose: Optional[str] = None
    description: Optional[str] = None
    target_segment: Optional[List[str]] = None
    currency: Optional[str] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    min_loan_amount: Optional[float] = None
    max_loan_amount: Optional[float] = None
    max_ltv_pct: Optional[float] = None
    min_term_months: Optional[int] = None
    max_term_months: Optional[int] = None
    max_age_at_maturity: Optional[int] = None
    eligibility: Optional[EligibilityRequirements] = None
    collateral: Optional[CollateralRequirements] = None
    repayment: Optional[RepaymentConfig] = None
    rate_fixed_months: Optional[int] = None
    rate_fixed: Optional[float] = None
    floating_margin: Optional[float] = None
    reference_rate_name: Optional[str] = None
    constraints_json: Optional[Dict[str, Any]] = None
    sla_days_estimate: Optional[int] = None
    reference_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    bank_name: Optional[str] = None
    
    # Related entities
    rate_model: Optional[RateModelResponse] = None
    fees_penalties: Optional[FeesPenaltiesResponse] = None

    class Config:
        from_attributes = True


# ============================================================================
# Bank Schemas
# ============================================================================

class ProcessingSLA(BaseModel):
    """Bank processing SLA in days."""
    pre_approval_days: Optional[int] = None
    appraisal_days: Optional[int] = None
    final_approval_days: Optional[int] = None
    disbursement_days: Optional[int] = None


class BankBase(BaseModel):
    name: str
    short_name: str
    bank_type: str = "PRIVATE"  # SOCB, PRIVATE, FOREIGN
    logo_url: Optional[str] = None
    official_site: Optional[str] = None
    contact_hotline: Optional[str] = None
    description: Optional[str] = None
    coverage_provinces: List[str] = []
    processing_sla: Optional[ProcessingSLA] = None
    source_urls: List[str] = []
    data_confidence_score: Optional[int] = 50
    is_active: bool = True


class BankCreate(BankBase):
    pass


class BankUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    bank_type: Optional[str] = None
    logo_url: Optional[str] = None
    official_site: Optional[str] = None
    contact_hotline: Optional[str] = None
    description: Optional[str] = None
    coverage_provinces: Optional[List[str]] = None
    processing_sla: Optional[ProcessingSLA] = None
    source_urls: Optional[List[str]] = None
    last_verified_at: Optional[datetime] = None
    last_crawled_at: Optional[datetime] = None
    data_confidence_score: Optional[int] = None
    is_active: Optional[bool] = None


class BankResponse(BankBase):
    id: UUID
    last_verified_at: Optional[datetime] = None
    last_crawled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    product_count: Optional[int] = None
    active_product_count: Optional[int] = None

    class Config:
        from_attributes = True


class BankStatusUpdate(BaseModel):
    is_active: bool


# ============================================================================
# Source Audit Schemas
# ============================================================================

class SourceAuditBase(BaseModel):
    source_type: str  # WEB, PDF, MANUAL
    source_url: Optional[str] = None
    raw_text_snapshot: Optional[str] = None
    notes: Optional[str] = None


class SourceAuditCreate(SourceAuditBase):
    bank_id: Optional[UUID] = None
    loan_product_id: Optional[UUID] = None


class SourceAuditResponse(SourceAuditBase):
    id: UUID
    bank_id: Optional[UUID] = None
    loan_product_id: Optional[UUID] = None
    html_pdf_hash: Optional[str] = None
    page_version_hash: Optional[str] = None
    crawled_at: datetime
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True
