"""
Recommendation Schemas for Mortgage MVP

Provides comprehensive recommendation output including:
- Multi-scenario cost comparisons
- APR and detailed cost breakdowns
- Data confidence and assumptions
"""
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, List, Any


class ScenarioResult(BaseModel):
    """Cost metrics for a single stress scenario."""
    apr: float
    monthly_payment_first_12m: float
    monthly_payment_post_promo: float
    total_interest: float
    total_fees: float
    total_cost: float
    prepayment_fee: float = 0.0  # Fee if prepaying at this scenario


class PrepaymentAtPromoEnd(BaseModel):
    """Cost breakdown if loan is fully prepaid at end of promotional period."""
    prepayment_month: int  # Month when promo ends
    remaining_principal: float
    prepayment_fee: float
    total_interest_paid: float
    total_fees_paid: float
    total_cost_to_exit: float  # principal + interest + fees + prepayment fee


class EstimatedCosts(BaseModel):
    """Cost estimates for a loan product (legacy compatibility)."""
    month1_payment: float
    year1_total: float
    total_3y: float
    total_5y: float
    stress_max_monthly: float


class ProductRecommendation(BaseModel):
    """Single product recommendation with full details."""
    product_id: UUID
    bank_name: str
    product_name: str
    
    # Scoring
    fit_score: int  # 0-100 overall score
    approval_bucket: str  # LOW, MEDIUM, HIGH
    approval_score: Optional[float] = None
    cost_score: Optional[float] = None
    stability_score: Optional[float] = None
    speed_score: Optional[float] = None
    penalties_score: Optional[float] = None
    
    # Explanations
    why_fit: List[str]
    risks: List[str]
    
    # Cost details
    estimated_costs: EstimatedCosts
    scenarios: Optional[Dict[str, ScenarioResult]] = None  # +0%, +2%, +4%
    apr: Optional[float] = None  # IRR-based APR for base scenario
    
    # Rate details
    rate_details: Optional[Dict[str, Any]] = None
    
    # Repayment configuration
    grace_principal_months: int = 0  # Number of months with no principal payment
    repayment_method: str = "annuity"  # "annuity" or "equal_principal"
    
    # Term optimization (new)
    suggested_tenor_months: Optional[int] = None  # Optimal term based on repayment strategy
    
    # Prepayment at promo end scenario
    prepayment_at_promo_end: Optional[PrepaymentAtPromoEnd] = None
    
    # Processing
    estimated_disbursement_days: Optional[int] = None
    
    # Confidence and transparency
    data_confidence_score: Optional[int] = None  # 0-100
    assumptions_used: Optional[List[str]] = None
    
    # Actions
    next_steps: List[str]
    
    # Metadata
    catalog_last_updated: datetime


class RejectedProduct(BaseModel):
    """Product that didn't pass eligibility filters."""
    product_id: UUID
    bank_name: str
    product_name: str
    reasons: List[str]
    reason_code: Optional[str] = None
    reason_detail: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Complete recommendation result."""
    id: UUID
    application_id: UUID
    generated_at: datetime
    top: List[ProductRecommendation]
    rejected: List[RejectedProduct]
    application_snapshot: Optional[Dict[str, Any]] = None
    scenarios: Optional[Dict[str, Any]] = None  # Product ID -> scenario results
    next_steps: Optional[List[str]] = None
