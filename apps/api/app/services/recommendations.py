"""
Recommendation Engine for Mortgage MVP

This module provides comprehensive product recommendation functionality:
- Multi-factor scoring (cost, stability, approval, speed, penalties)
- Scenario comparison (+0%, +2%, +4% stress tests)
- Enhanced output with APR, confidence scores, assumptions
- Term optimization based on repayment strategy
"""
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from typing import Any, Dict, Tuple, Optional, List
from decimal import Decimal
from datetime import datetime, date

from app.models.recommendation import RecommendationRun
from app.models.application import Application, RepaymentStrategy
from app.models.loan_product import LoanProduct
from app.models.rate_model import RateModel
from app.models.fees_penalties import FeesPenalties
from app.services.applications import calculate_application_metrics
from app.services.financial import (
    RateStructure,
    FeeStructure,
    PrepaymentInfo,
    generate_amortization_schedule,
    stress_test_scenarios,
    calculate_apr,
    LoanCostSummary,
)
from app.schemas import recommendations as schemas


# ============================================================================
# Term Optimization Logic Based on Repayment Strategy
# ============================================================================

def _get_optimal_tenor(
    application: Application,
    product: LoanProduct,
) -> int:
    """
    Determine optimal loan term based on repayment strategy.
    
    Strategy guidelines:
    - UNCERTAIN: Max term available (25-30 years) for flexibility
    - EARLY_EXIT: Still use max term (easier approval) but focus on prepayment fees
    - LONG_HOLD: Term matching cash flow needs, typically 15-20 years
    
    Returns optimal term in months.
    """
    # If user specified a term, use it
    if application.tenor_months:
        return application.tenor_months
    
    # Get product term bounds
    min_term = product.min_term_months or 12
    max_term = product.max_term_months or 360  # 30 years default max
    
    strategy = application.repayment_strategy
    
    if strategy == RepaymentStrategy.UNCERTAIN:
        # Max term for maximum flexibility
        return max_term
    elif strategy == RepaymentStrategy.EARLY_EXIT:
        # Max term for easier approval, but we'll score prepayment fees heavily
        return max_term
    elif strategy == RepaymentStrategy.LONG_HOLD:
        # Balanced term - 20 years is typical for long-hold
        target_term = 240  # 20 years
        return max(min_term, min(target_term, max_term))
    else:
        # Default to max term
        return max_term


def _calculate_strategy_adjusted_score(
    base_scores: Dict[str, float],
    application: Application,
    product: LoanProduct,
    scenarios: Dict[str, LoanCostSummary],
) -> Dict[str, float]:
    """
    Adjust scoring weights based on repayment strategy.
    
    Strategy-specific weight adjustments:
    - UNCERTAIN: Balance all factors, emphasize prepayment flexibility
    - EARLY_EXIT: Heavily weight prepayment fees, de-emphasize long-term stability
    - LONG_HOLD: Heavily weight stability and margin, de-emphasize prepayment
    """
    strategy = application.repayment_strategy
    
    # Default weights
    weights = {
        "cost": 0.35,
        "stability": 0.25,
        "approval": 0.20,
        "speed": 0.10,
        "penalties": 0.10,
    }
    
    if strategy == RepaymentStrategy.UNCERTAIN:
        # Balanced but emphasize prepayment flexibility
        weights = {
            "cost": 0.30,
            "stability": 0.20,
            "approval": 0.20,
            "speed": 0.10,
            "penalties": 0.20,  # Higher weight for prepayment flexibility
        }
    elif strategy == RepaymentStrategy.EARLY_EXIT:
        # Heavy emphasis on prepayment fees and short-term cost
        weights = {
            "cost": 0.25,
            "stability": 0.10,  # Don't care much about long-term stability
            "approval": 0.20,
            "speed": 0.15,
            "penalties": 0.30,  # Very high weight for low prepayment fees
        }
        # Also adjust penalties score to focus on early months
        base_scores["penalties"] = _calculate_early_exit_penalties_score(
            product, application, scenarios.get("+0%")
        )
    elif strategy == RepaymentStrategy.LONG_HOLD:
        # Heavy emphasis on margin and stability
        weights = {
            "cost": 0.35,
            "stability": 0.35,  # High weight for long-term stability
            "approval": 0.20,
            "speed": 0.05,
            "penalties": 0.05,  # Low weight - not planning to prepay
        }
        # Adjust stability score to focus on floating rate transparency
        base_scores["stability"] = _calculate_long_hold_stability_score(
            product, scenarios.get("+0%"), scenarios.get("+4%")
        )
    
    # Calculate weighted total
    total = sum(weights[k] * base_scores.get(k, 50) for k in weights)
    
    return {
        **base_scores,
        "total": total,
        "weights": weights,  # Include weights for transparency
    }


def _calculate_early_exit_penalties_score(
    product: LoanProduct,
    application: Application,
    scenario: Optional[LoanCostSummary],
) -> float:
    """
    Calculate penalties score specifically for EARLY_EXIT strategy.
    
    Focus on prepayment fees in the 12-36 month range.
    """
    if not product.fees_penalties:
        return 80.0  # No fees = good
    
    prepayment = product.fees_penalties.prepayment or {}
    schedule = prepayment.get("prepayment_schedule", [])
    
    if not schedule:
        return 80.0
    
    # Calculate average fee for months 12-36
    fee_at_12m = _get_prepay_fee_at_month(schedule, 12)
    fee_at_24m = _get_prepay_fee_at_month(schedule, 24)
    fee_at_36m = _get_prepay_fee_at_month(schedule, 36)
    
    avg_fee = (fee_at_12m + fee_at_24m + fee_at_36m) / 3
    
    # Score: 0% avg fee = 100, 3% avg fee = 0
    return max(0, min(100, 100 - avg_fee * (100 / 3)))


def _calculate_long_hold_stability_score(
    product: LoanProduct,
    base: Optional[LoanCostSummary],
    stress: Optional[LoanCostSummary],
) -> float:
    """
    Calculate stability score specifically for LONG_HOLD strategy.
    
    Focus on:
    - Floating margin (lower is better)
    - Rate transparency (has clear reference rate source)
    - Payment volatility under stress
    """
    if not base or not stress:
        return 50.0
    
    score = 50.0
    
    # Floating margin component
    rate_structure = _build_rate_structure(product)
    margin = rate_structure.floating_margin_pct
    
    # Lower margin = better (2% = average, 1% = great, 4% = bad)
    margin_score = max(0, min(100, 100 - (margin - 1) * (100 / 3)))
    score += margin_score * 0.3
    
    # Rate transparency
    if product.rate_model:
        floating = product.rate_model.floating or {}
        if isinstance(floating, dict) and floating.get("reference_rate_source_url"):
            score += 10  # Bonus for transparent rate source
        if isinstance(floating, dict) and floating.get("caps_floors"):
            score += 10  # Bonus for having rate caps
    
    # Payment volatility under +4% stress
    if base.monthly_payment_first_12m > 0:
        volatility = (stress.monthly_payment_post_promo - base.monthly_payment_first_12m) / base.monthly_payment_first_12m
        volatility_score = max(0, min(100, 100 - volatility * 500))
        score += volatility_score * 0.3
    
    return min(100, max(0, score))


def _get_prepay_fee_at_month(schedule: List[Dict], month: int) -> float:
    """Get prepayment fee percentage at a specific month."""
    for tier in schedule:
        months_from = tier.get("months_from", 0)
        months_to = tier.get("months_to")
        
        if month >= months_from:
            if months_to is None or month <= months_to:
                return tier.get("fee_pct", 0)
    
    return 0.0


# ============================================================================
# Main Recommendation Function
# ============================================================================

def generate_recommendations(db: Session, application_id: UUID) -> schemas.RecommendationResponse:
    """Generate loan product recommendations for an application."""
    # Get application with all relationships
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise ValueError("Application not found")

    metrics = calculate_application_metrics(application)
    user_input = _extract_user_input(application, metrics)
    
    # Get all active products with their relationships
    products = (
        db.query(LoanProduct)
        .options(
            joinedload(LoanProduct.bank),
            joinedload(LoanProduct.rate_model),
            joinedload(LoanProduct.fees_penalties),
        )
        .filter(LoanProduct.is_active == True)
        .all()
    )

    ranked_recommendations: List[Tuple[schemas.ProductRecommendation, float]] = []
    rejected_products: List[schemas.RejectedProduct] = []
    all_scenarios: Dict[str, Any] = {}

    for product in products:
        # Determine optimal term for this product based on strategy
        optimal_tenor = _get_optimal_tenor(application, product)
        
        # Create a modified application view with optimal tenor for calculations
        effective_tenor = application.tenor_months if application.tenor_months else optimal_tenor
        
        # Check hard filters (with effective tenor)
        passes, reasons = _apply_hard_filters_with_tenor(
            application, metrics, product, user_input, effective_tenor
        )
        
        if not passes:
            primary_reason = reasons[0] if reasons else "UNKNOWN"
            rejected_products.append(
                schemas.RejectedProduct(
                    product_id=product.id,
                    bank_name=product.bank.name if product.bank else "Unknown Bank",
                    product_name=product.name,
                    reasons=reasons,
                    reason_code=primary_reason,
                    reason_detail=_get_reason_detail(primary_reason),
                )
            )
            continue

        # Calculate costs and scores for this product
        rate_structure = _build_rate_structure(product)
        fee_structure = _build_fee_structure(product)
        prepay_info = _build_prepay_info(application)
        
        # Determine horizon based on strategy
        if application.repayment_strategy == RepaymentStrategy.EARLY_EXIT:
            # For early exit, use 36 months as typical horizon
            horizon = application.planned_hold_months or 36
        else:
            horizon = application.planned_hold_months or effective_tenor
        
        # Run stress test scenarios with optimal/effective tenor
        scenarios = stress_test_scenarios(
            principal=float(application.loan_amount),
            tenor_months=effective_tenor,
            rate_structure=rate_structure,
            repayment_method=_get_repayment_method(product),
            grace_principal_months=_get_grace_months(product),
            fee_structure=fee_structure,
            prepayment_info=prepay_info,
            horizon_months=horizon,
        )
        
        # Calculate base multi-factor score
        base_scores = _calculate_multi_factor_score(
            product, application, metrics, user_input, scenarios
        )
        
        # Adjust scores based on repayment strategy
        scores = _calculate_strategy_adjusted_score(
            base_scores, application, product, scenarios
        )
        
        # Build recommendation object with optimal tenor info
        base_scenario = scenarios.get("+0%")
        rec = _build_recommendation(
            product, scores, scenarios, base_scenario, application, metrics,
            suggested_tenor=optimal_tenor,
        )
        
        ranked_recommendations.append((rec, scores["total"]))
        all_scenarios[str(product.id)] = {
            scenario: {
                "apr": s.apr,
                "monthly_payment_first_12m": s.monthly_payment_first_12m,
                "monthly_payment_post_promo": s.monthly_payment_post_promo,
                "total_interest": s.total_interest,
                "total_fees": s.total_fees,
                "total_cost": s.total_cost_excluding_principal,
            }
            for scenario, s in scenarios.items()
        }

    # Sort by total score (descending)
    top_recommendations = [
        entry[0]
        for entry in sorted(
            ranked_recommendations,
            key=lambda item: -item[1],
        )[:5]
    ]

    # Create audit record
    recommendation_run = RecommendationRun(
        application_id=application_id,
        application_snapshot={
            "purpose": application.purpose,
            "loan_amount": float(application.loan_amount),
            "tenor_months": application.tenor_months,
            "planned_hold_months": application.planned_hold_months,
            "metrics": metrics,
            "preferences": application.preferences or {},
        },
        top_recommendations=[rec.model_dump(mode="json") for rec in top_recommendations],
        rejected_products=[rej.model_dump(mode="json") for rej in rejected_products],
        scenarios=all_scenarios,
    )
    db.add(recommendation_run)
    db.commit()
    db.refresh(recommendation_run)

    # Generate next steps
    next_steps = _generate_next_steps(application, top_recommendations)

    return schemas.RecommendationResponse(
        id=recommendation_run.id,
        application_id=application_id,
        generated_at=recommendation_run.generated_at,
        top=top_recommendations,
        rejected=rejected_products,
        application_snapshot=recommendation_run.application_snapshot,
        scenarios=all_scenarios,
        next_steps=next_steps,
    )


def get_recommendation(db: Session, recommendation_id: UUID) -> Optional[schemas.RecommendationResponse]:
    """Get recommendation by ID."""
    rec = db.query(RecommendationRun).filter(RecommendationRun.id == recommendation_id).first()
    if not rec:
        return None

    top = [schemas.ProductRecommendation(**item) for item in rec.top_recommendations]
    rejected = [schemas.RejectedProduct(**item) for item in rec.rejected_products]

    # Get next steps from recommendations
    all_next_steps = []
    for item in top:
        all_next_steps.extend(item.next_steps)
    unique_next_steps = list(dict.fromkeys(all_next_steps))

    return schemas.RecommendationResponse(
        id=rec.id,
        application_id=rec.application_id,
        generated_at=rec.generated_at,
        top=top,
        rejected=rejected,
        application_snapshot=rec.application_snapshot,
        scenarios=rec.scenarios or {},
        next_steps=unique_next_steps,
    )


# ============================================================================
# Hard Filter Functions
# ============================================================================

def _apply_hard_filters_with_tenor(
    application: Application,
    metrics: dict,
    product: LoanProduct,
    user_input: dict,
    effective_tenor: int,
) -> Tuple[bool, List[str]]:
    """Apply hard eligibility filters with effective tenor. Returns (passes, list of rejection reasons)."""
    reasons: List[str] = []

    # Purpose match - allow NEW_PURCHASE to match HOME_PURCHASE (legacy)
    if product.purpose:
        app_purpose = application.purpose
        product_purpose = product.purpose.value
        
        # Map new purposes to legacy purposes for matching
        purpose_matches = (
            app_purpose == product_purpose or
            (app_purpose == "NEW_PURCHASE" and product_purpose in ["HOME_PURCHASE", "NEW_PURCHASE"]) or
            (app_purpose == "HOME_PURCHASE" and product_purpose == "NEW_PURCHASE")
        )
        
        if not purpose_matches:
            reasons.append("PURPOSE_NOT_SUPPORTED")

    # Term bounds (using effective tenor)
    if product.min_term_months and effective_tenor < product.min_term_months:
        reasons.append("TENOR_TOO_SHORT")
    if product.max_term_months and effective_tenor > product.max_term_months:
        reasons.append("TENOR_TOO_LONG")

    # LTV check
    property_value = user_input.get("property_value", 0)
    if property_value > 0 and product.max_ltv_pct:
        max_loan = property_value * (float(product.max_ltv_pct) / 100)
        if float(application.loan_amount) > max_loan:
            reasons.append("LTV_EXCEEDS_MAX")

    # Loan amount bounds
    if product.min_loan_amount and float(application.loan_amount) < float(product.min_loan_amount):
        reasons.append("LOAN_AMOUNT_TOO_LOW")
    if product.max_loan_amount and float(application.loan_amount) > float(product.max_loan_amount):
        reasons.append("LOAN_AMOUNT_TOO_HIGH")

    # Eligibility checks from product
    eligibility = product.eligibility or {}
    
    # Income type
    income_types_supported = eligibility.get("income_type_supported", [])
    if income_types_supported and application.income_type:
        if application.income_type.value not in income_types_supported:
            reasons.append("INCOME_TYPE_NOT_SUPPORTED")

    # Minimum income
    min_income = eligibility.get("min_income_vnd")
    if min_income and metrics.get("total_income"):
        if metrics["total_income"] < min_income:
            reasons.append("INCOME_BELOW_MIN")

    # Collateral type check
    collateral_config = product.collateral or {}
    allowed_types = collateral_config.get("collateral_types", [])
    if allowed_types and application.collaterals:
        if not any(c.collateral_type in allowed_types for c in application.collaterals):
            reasons.append("COLLATERAL_TYPE_NOT_ALLOWED")

    # Geographic coverage (skip for new flow - no geo required)
    if product.bank and product.bank.coverage_provinces:
        provinces = product.bank.coverage_provinces
        if application.geo_location and application.geo_location not in provinces:
            reasons.append("GEO_NOT_SUPPORTED")

    # Legacy constraints_json support
    hard_rules = (product.constraints_json or {}).get("hard", {})
    
    max_dsr = hard_rules.get("max_dsr")
    if max_dsr is not None and metrics.get("dsr") is not None:
        if metrics["dsr"] > max_dsr:
            reasons.append("DSR_EXCEEDS_MAX")

    return len(reasons) == 0, reasons


def _apply_hard_filters(
    application: Application,
    metrics: dict,
    product: LoanProduct,
    user_input: dict,
) -> Tuple[bool, List[str]]:
    """Apply hard eligibility filters. Returns (passes, list of rejection reasons)."""
    effective_tenor = application.tenor_months or 240  # Default 20 years
    return _apply_hard_filters_with_tenor(application, metrics, product, user_input, effective_tenor)


# ============================================================================
# Score Calculation Functions
# ============================================================================

def _calculate_multi_factor_score(
    product: LoanProduct,
    application: Application,
    metrics: dict,
    user_input: dict,
    scenarios: Dict[str, LoanCostSummary],
) -> Dict[str, float]:
    """
    Calculate multi-factor score using weighted combination.
    
    Weights:
    - Cost score: 35%
    - Stability score: 25%
    - Approval score: 20%
    - Speed score: 10%
    - Penalties score: 10%
    """
    base_scenario = scenarios.get("+0%")
    stress_4pct = scenarios.get("+4%")
    
    # Cost score (35%): Based on APR and total cost
    cost_score = _calculate_cost_score(base_scenario, float(application.loan_amount))
    
    # Stability score (25%): Based on payment volatility and promo length
    stability_score = _calculate_stability_score(product, base_scenario, stress_4pct, user_input)
    
    # Approval score (20%): Based on income/proof/credit vs requirements
    approval_score = _calculate_approval_score(product, application, metrics)
    
    # Speed score (10%): Based on SLA vs disbursement need
    speed_score = _calculate_speed_score(product, application)
    
    # Penalties score (10%): Based on prepayment fee severity
    penalties_score = _calculate_penalties_score(product, application, base_scenario)
    
    # Weighted total
    total = (
        0.35 * cost_score +
        0.25 * stability_score +
        0.20 * approval_score +
        0.10 * speed_score +
        0.10 * penalties_score
    )
    
    return {
        "total": total,
        "cost": cost_score,
        "stability": stability_score,
        "approval": approval_score,
        "speed": speed_score,
        "penalties": penalties_score,
    }


def _calculate_cost_score(scenario: Optional[LoanCostSummary], principal: float) -> float:
    """Calculate cost score based on APR and total cost."""
    if not scenario:
        return 50.0
    
    # APR component: Lower is better. Assume typical range 8-15%
    apr_pct = scenario.apr * 100
    apr_score = max(0, min(100, 100 - (apr_pct - 8) * (100 / 7)))
    
    # Total cost relative to principal
    cost_ratio = scenario.total_cost_excluding_principal / principal if principal > 0 else 0
    # Assume 30% total cost over life is average, 10% is great, 50% is bad
    cost_score = max(0, min(100, 100 - (cost_ratio - 0.10) * (100 / 0.40)))
    
    return (apr_score + cost_score) / 2


def _calculate_stability_score(
    product: LoanProduct,
    base: Optional[LoanCostSummary],
    stress: Optional[LoanCostSummary],
    user_input: dict,
) -> float:
    """Calculate stability score based on payment volatility and fixed period."""
    if not base or not stress:
        return 50.0
    
    # Payment volatility: How much does payment increase under stress?
    if base.monthly_payment_first_12m > 0:
        volatility = (stress.monthly_payment_post_promo - base.monthly_payment_first_12m) / base.monthly_payment_first_12m
    else:
        volatility = 0
    
    # Score inversely proportional to volatility (20% increase = 0 points)
    volatility_score = max(0, min(100, 100 - volatility * 500))
    
    # Fixed period length bonus
    fixed_months = product.rate_fixed_months or 0
    if product.rate_model and product.rate_model.promo_options:
        # Get longest fixed period from promo options
        for option in product.rate_model.promo_options:
            if isinstance(option, dict) and option.get("fixed_months", 0) > fixed_months:
                fixed_months = option["fixed_months"]
    
    # More fixed months = higher stability (24+ months = 100 points)
    fixed_score = min(100, fixed_months * (100 / 24))
    
    # User preference for stability
    stability_pref = user_input.get("priority_cost_vs_stability", 50) / 100
    
    return volatility_score * (1 - stability_pref * 0.3) + fixed_score * (stability_pref * 0.3 + 0.35)


def _calculate_approval_score(
    product: LoanProduct,
    application: Application,
    metrics: dict,
) -> float:
    """Calculate approval likelihood score based on requirements vs profile."""
    score = 70.0  # Base score
    
    eligibility = product.eligibility or {}
    hard_rules = (product.constraints_json or {}).get("hard", {})
    
    # DSR margin
    max_dsr = hard_rules.get("max_dsr")
    dsr = metrics.get("dsr")
    if max_dsr and dsr is not None:
        margin = (max_dsr - dsr) / max_dsr if max_dsr > 0 else 0
        score += margin * 15  # Up to +15 points for good DSR margin
    
    # LTV margin
    max_ltv = hard_rules.get("max_ltv") or (float(product.max_ltv_pct) / 100 if product.max_ltv_pct else None)
    ltv = metrics.get("ltv")
    if max_ltv and ltv is not None:
        margin = (max_ltv - ltv) / max_ltv if max_ltv > 0 else 0
        score += margin * 10  # Up to +10 points for good LTV margin
    
    # Proof strength bonus
    if application.proof_strength:
        proof_bonus = {"STRONG": 10, "MEDIUM": 5, "WEAK": -5}
        score += proof_bonus.get(application.proof_strength.value, 0)
    
    # Credit flags penalty
    credit_flags = application.credit_flags or {}
    if credit_flags.get("has_late_payments"):
        score -= 15
    if credit_flags.get("cic_bad_debt"):
        score -= 25
    
    return max(0, min(100, score))


def _calculate_speed_score(product: LoanProduct, application: Application) -> float:
    """Calculate speed score based on SLA vs disbursement need."""
    # Get SLA days
    sla_days = product.sla_days_estimate or 30
    if product.bank and product.bank.processing_sla:
        sla = product.bank.processing_sla
        sla_days = (
            (sla.get("pre_approval_days") or 0) +
            (sla.get("appraisal_days") or 0) +
            (sla.get("final_approval_days") or 0) +
            (sla.get("disbursement_days") or 0)
        )
    
    if not application.need_disbursement_by_date:
        # No urgency - base score on absolute SLA
        # 7 days = 100, 60 days = 50
        return max(50, min(100, 100 - (sla_days - 7) * (50 / 53)))
    
    # Calculate days until needed
    days_until_needed = (application.need_disbursement_by_date - date.today()).days
    
    if sla_days <= days_until_needed:
        # Can meet deadline - bonus based on margin
        margin = (days_until_needed - sla_days) / days_until_needed if days_until_needed > 0 else 1
        return min(100, 80 + margin * 20)
    else:
        # Cannot meet deadline - penalty
        return max(0, 50 - (sla_days - days_until_needed) * 5)


def _calculate_penalties_score(
    product: LoanProduct,
    application: Application,
    scenario: Optional[LoanCostSummary],
) -> float:
    """Calculate penalties score based on prepayment fee severity."""
    if not scenario or not application.expected_prepayment_month:
        return 80.0  # Default good score if no prepayment planned
    
    prepay_fee = scenario.prepayment_fee
    loan_amount = float(application.loan_amount)
    
    if loan_amount <= 0:
        return 80.0
    
    # Fee as percentage of loan
    fee_pct = (prepay_fee / loan_amount) * 100
    
    # 0% = 100 points, 3% = 0 points
    return max(0, min(100, 100 - fee_pct * (100 / 3)))


# ============================================================================
# Helper Functions
# ============================================================================

def _extract_user_input(application: Application, metrics: dict) -> dict:
    """Extract user input data for scoring."""
    property_value = 0
    if application.estimated_property_value_vnd:
        property_value = float(application.estimated_property_value_vnd)
    elif application.collaterals:
        property_value = sum(float(c.estimated_value) for c in application.collaterals)
    
    preferences = application.preferences or {}
    
    return {
        "property_value": property_value,
        "priority_cost_vs_stability": preferences.get("priority_cost_vs_stability", 50),
        "min_fixed_months_preference": preferences.get("min_fixed_months_preference", 0),
        "max_monthly_payment_cap": preferences.get("max_monthly_payment_cap_vnd"),
        "avoid_mandatory_insurance": preferences.get("avoid_mandatory_insurance", False),
        "need_fast_approval": preferences.get("need_fast_approval", False),
    }


def _build_rate_structure(product: LoanProduct) -> RateStructure:
    """Build RateStructure from product data."""
    fixed_rate = float(product.rate_fixed or 0)
    fixed_months = product.rate_fixed_months or 0
    floating_margin = float(product.floating_margin or 0)
    reference_rate = 5.0  # Default
    
    # Try to get from rate_model
    if product.rate_model:
        rm = product.rate_model
        if rm.promo_options:
            # Use first promo option
            first_option = rm.promo_options[0] if isinstance(rm.promo_options, list) else {}
            if isinstance(first_option, dict):
                fixed_rate = first_option.get("fixed_rate_pct", fixed_rate)
                fixed_months = first_option.get("fixed_months", fixed_months)
        
        floating = rm.floating or {}
        if isinstance(floating, dict):
            floating_margin = floating.get("floating_margin_pct", floating_margin)
        
        if rm.reference_rate_base_pct:
            reference_rate = float(rm.reference_rate_base_pct)
    
    return RateStructure(
        fixed_rate_pct=fixed_rate,
        fixed_months=fixed_months,
        floating_margin_pct=floating_margin,
        reference_rate_pct=reference_rate,
    )


def _build_fee_structure(product: LoanProduct) -> FeeStructure:
    """Build FeeStructure from product data."""
    if not product.fees_penalties:
        return FeeStructure()
    
    fp = product.fees_penalties
    upfront = fp.upfront or {}
    recurring = fp.recurring or {}
    prepayment = fp.prepayment or {}
    
    return FeeStructure(
        origination_fee_pct=upfront.get("origination_fee_pct", 0),
        origination_min_vnd=upfront.get("origination_min_vnd", 0),
        origination_max_vnd=upfront.get("origination_max_vnd", float('inf')),
        appraisal_fee_vnd=upfront.get("appraisal_fee_vnd", 0),
        disbursement_fee_vnd=upfront.get("disbursement_fee_vnd", 0),
        disbursement_fee_pct=upfront.get("disbursement_fee_pct", 0),
        account_maintenance_fee_vnd=recurring.get("account_maintenance_fee_vnd", 0),
        insurance_annual_pct=recurring.get("insurance_annual_pct", 0),
        insurance_vnd=recurring.get("insurance_vnd", 0),
        insurance_basis=recurring.get("insurance_basis", "on_balance"),
        prepayment_schedule=prepayment.get("prepayment_schedule", []),
    )


def _build_prepay_info(application: Application) -> Optional[PrepaymentInfo]:
    """Build PrepaymentInfo from application."""
    if not application.expected_prepayment_month:
        return None
    
    return PrepaymentInfo(
        prepayment_month=application.expected_prepayment_month,
        prepayment_amount_vnd=float(application.expected_prepayment_amount_vnd) if application.expected_prepayment_amount_vnd else None,
        is_partial=application.expected_prepayment_amount_vnd is not None,
    )


def _get_repayment_method(product: LoanProduct) -> str:
    """Get repayment method from product."""
    repayment = product.repayment or {}
    return repayment.get("repayment_method", "annuity")


def _get_grace_months(product: LoanProduct) -> int:
    """Get grace period months from product."""
    repayment = product.repayment or {}
    return repayment.get("grace_principal_months", 0)


def _calculate_prepayment_at_promo_end(
    product: LoanProduct,
    application: Application,
    rate_structure: RateStructure,
    fee_structure: FeeStructure,
    effective_tenor: Optional[int] = None,
) -> Optional[schemas.PrepaymentAtPromoEnd]:
    """
    Calculate total cost if loan is fully prepaid at the end of the promotional period.
    
    This helps users understand the exit cost if they plan to refinance or sell
    right after the fixed-rate period ends.
    """
    fixed_months = rate_structure.fixed_months
    if fixed_months <= 0:
        return None
    
    principal = float(application.loan_amount)
    # Use effective tenor (from strategy calculation) or fallback
    tenor_months = effective_tenor or application.tenor_months or 240  # Default 20 years
    grace_months = _get_grace_months(product)
    repayment_method = _get_repayment_method(product)
    
    # Create prepayment info for end of promo period
    prepay_info = PrepaymentInfo(
        prepayment_month=fixed_months,
        prepayment_amount_vnd=None,  # Full payoff
        is_partial=False,
    )
    
    # Generate schedule up to prepayment month
    schedule = generate_amortization_schedule(
        principal=principal,
        tenor_months=tenor_months,
        rate_structure=rate_structure,
        repayment_method=repayment_method,
        grace_principal_months=grace_months,
        fee_structure=fee_structure,
        prepayment_info=prepay_info,
        scenario_bump=0.0,
    )
    
    if not schedule.payments:
        return None
    
    # Sum up costs
    total_interest_paid = sum(p.interest for p in schedule.payments)
    total_fees_paid = sum(p.fees for p in schedule.payments)
    
    # Add upfront fees
    from app.services.financial import _calculate_upfront_fees
    upfront_fees = _calculate_upfront_fees(principal, fee_structure)
    total_fees_paid += upfront_fees
    
    # Find remaining principal and prepayment fee at exit
    last_payment = schedule.payments[-1]
    remaining_principal = last_payment.remaining_balance
    
    # Get prepayment fee from the last payment (it's included in fees)
    prepayment_fee = last_payment.fees if last_payment.month == fixed_months else 0
    
    # If prepayment happened, remaining should be 0 and we paid it off
    # We need to calculate the remaining principal BEFORE prepayment
    if remaining_principal == 0 and len(schedule.payments) > 1:
        # The prepayment happened, so find balance before prepayment
        for p in schedule.payments:
            if p.month == fixed_months - 1:
                remaining_principal = p.remaining_balance
                break
        if remaining_principal == 0:
            # Fallback: estimate from schedule
            remaining_principal = schedule.payments[-1].principal
    
    # Actually, for prepayment at month N, we pay off the remaining balance at that point
    # Let's recalculate without prepayment to get the remaining balance
    schedule_no_prepay = generate_amortization_schedule(
        principal=principal,
        tenor_months=tenor_months,
        rate_structure=rate_structure,
        repayment_method=repayment_method,
        grace_principal_months=grace_months,
        fee_structure=fee_structure,
        prepayment_info=None,  # No prepayment
        scenario_bump=0.0,
    )
    
    remaining_at_promo_end = principal
    interest_to_promo_end = 0.0
    fees_to_promo_end = upfront_fees
    
    for p in schedule_no_prepay.payments:
        if p.month <= fixed_months:
            remaining_at_promo_end = p.remaining_balance
            interest_to_promo_end += p.interest
            fees_to_promo_end += p.fees
    
    # Calculate prepayment fee at promo end
    from app.services.financial import _calculate_prepayment_fee
    prepay_fee = _calculate_prepayment_fee(
        remaining_at_promo_end,
        fixed_months,
        fee_structure.prepayment_schedule
    )
    
    total_cost_to_exit = (
        remaining_at_promo_end +  # Principal still owed
        interest_to_promo_end +   # Interest paid so far
        fees_to_promo_end +       # Fees paid so far
        prepay_fee                # Prepayment penalty
    )
    
    return schemas.PrepaymentAtPromoEnd(
        prepayment_month=fixed_months,
        remaining_principal=remaining_at_promo_end,
        prepayment_fee=prepay_fee,
        total_interest_paid=interest_to_promo_end,
        total_fees_paid=fees_to_promo_end,
        total_cost_to_exit=total_cost_to_exit,
    )


def _build_recommendation(
    product: LoanProduct,
    scores: Dict[str, float],
    scenarios: Dict[str, LoanCostSummary],
    base_scenario: Optional[LoanCostSummary],
    application: Application,
    metrics: dict,
    suggested_tenor: Optional[int] = None,
) -> schemas.ProductRecommendation:
    """Build ProductRecommendation from calculated data."""
    rate_structure = _build_rate_structure(product)
    
    # Build estimated costs
    estimated_costs = schemas.EstimatedCosts(
        month1_payment=base_scenario.monthly_payment_first_12m if base_scenario else 0,
        year1_total=base_scenario.monthly_payment_first_12m * 12 if base_scenario else 0,
        total_3y=base_scenario.total_interest * 0.3 if base_scenario else 0,  # Approximate
        total_5y=base_scenario.total_interest * 0.5 if base_scenario else 0,
        stress_max_monthly=scenarios["+4%"].monthly_payment_post_promo if "+4%" in scenarios else 0,
    )
    
    # Build scenario data
    scenario_data = {}
    for scenario_name, summary in scenarios.items():
        scenario_data[scenario_name] = schemas.ScenarioResult(
            apr=summary.apr,
            monthly_payment_first_12m=summary.monthly_payment_first_12m,
            monthly_payment_post_promo=summary.monthly_payment_post_promo,
            total_interest=summary.total_interest,
            total_fees=summary.total_fees,
            total_cost=summary.total_cost_excluding_principal,
            prepayment_fee=summary.prepayment_fee,
        )
    
    # Get grace period and repayment method
    grace_principal_months = _get_grace_months(product)
    repayment_method = _get_repayment_method(product)
    
    # Calculate prepayment at promo end scenario
    prepayment_at_promo_end = _calculate_prepayment_at_promo_end(
        product, application, rate_structure, _build_fee_structure(product),
        effective_tenor=suggested_tenor,
    )
    
    # Generate explanations
    why_fit, risks = _generate_explanations(product, application, metrics, scores, base_scenario)
    
    # Generate next steps
    next_steps = _next_steps_from_context(application, product)
    
    # Get data confidence
    data_confidence = product.bank.data_confidence_score if product.bank else 50
    
    # Build assumptions
    assumptions = _build_assumptions(product, rate_structure)
    
    return schemas.ProductRecommendation(
        product_id=product.id,
        bank_name=product.bank.name if product.bank else "Unknown Bank",
        product_name=product.name,
        fit_score=int(round(scores["total"])),
        approval_bucket=_bucket_from_score(scores["approval"]),
        approval_score=scores["approval"],
        cost_score=scores["cost"],
        stability_score=scores["stability"],
        speed_score=scores["speed"],
        penalties_score=scores["penalties"],
        why_fit=why_fit,
        risks=risks,
        estimated_costs=estimated_costs,
        scenarios=scenario_data,
        rate_details={
            "fixed_months": rate_structure.fixed_months,
            "fixed_rate": rate_structure.fixed_rate_pct,
            "floating_margin": rate_structure.floating_margin_pct,
            "reference_rate": rate_structure.reference_rate_pct,
        },
        grace_principal_months=grace_principal_months,
        repayment_method=repayment_method,
        suggested_tenor_months=suggested_tenor,
        prepayment_at_promo_end=prepayment_at_promo_end,
        apr=base_scenario.apr if base_scenario else 0,
        estimated_disbursement_days=product.sla_days_estimate or 30,
        data_confidence_score=data_confidence,
        assumptions_used=assumptions,
        next_steps=next_steps,
        catalog_last_updated=product.updated_at,
    )


def _generate_explanations(
    product: LoanProduct,
    application: Application,
    metrics: dict,
    scores: Dict[str, float],
    base_scenario: Optional[LoanCostSummary],
) -> Tuple[List[str], List[str]]:
    """Generate why_fit and risks explanations."""
    why_fit: List[str] = []
    risks: List[str] = []
    
    # Cost explanations
    if scores["cost"] >= 70:
        why_fit.append(f"Competitive cost with APR of {base_scenario.apr * 100:.2f}%" if base_scenario else "Competitive interest rates")
    elif scores["cost"] < 50:
        risks.append("Higher total cost compared to other options")
    
    # Stability explanations
    if scores["stability"] >= 70:
        fixed_months = product.rate_fixed_months or 0
        why_fit.append(f"{fixed_months}-month fixed rate provides payment stability")
    if scores["stability"] < 50:
        risks.append("Payment may increase significantly after fixed period ends")
    
    # Approval explanations
    if scores["approval"] >= 70:
        why_fit.append("Strong match with eligibility requirements")
    elif scores["approval"] < 50:
        risks.append("Profile may require additional documentation for approval")
    
    # Speed explanations
    if application.need_disbursement_by_date and scores["speed"] >= 70:
        why_fit.append("Likely to meet your disbursement timeline")
    elif application.need_disbursement_by_date and scores["speed"] < 50:
        risks.append("May not meet your requested disbursement date")
    
    # Prepayment explanations
    if application.expected_prepayment_month:
        if scores["penalties"] >= 70:
            why_fit.append("Low prepayment fees for your planned payoff timeline")
        elif scores["penalties"] < 50:
            risks.append("Significant prepayment fee if you pay off early as planned")
    
    # Default explanations
    if not why_fit:
        why_fit.append("Meets basic eligibility requirements")
    
    return why_fit, risks


def _next_steps_from_context(application: Application, product: LoanProduct) -> List[str]:
    """Generate next steps based on application context."""
    steps: List[str] = []
    
    # Proof strength
    if application.proof_strength and application.proof_strength.value == "WEAK":
        steps.append("Strengthen income documentation with bank statements or tax returns")
    
    # Credit flags
    credit_flags = application.credit_flags or {}
    if credit_flags.get("has_late_payments"):
        steps.append("Review and resolve any overdue accounts on credit history")
    
    # Collateral
    if application.legal_status and application.legal_status.value == "PENDING":
        steps.append("Complete property documentation (red book/ownership papers)")
    
    # Generic steps
    steps.append(f"Contact {product.bank.short_name if product.bank else 'the bank'} to confirm current rates and terms")
    
    return steps[:4]  # Limit to 4 steps


def _generate_next_steps(application: Application, recommendations: List[schemas.ProductRecommendation]) -> List[str]:
    """Generate overall next steps for the user."""
    steps: List[str] = []
    
    stuck_reasons = application.stuck_reasons or []
    coach_map = {
        "CIC_ISSUE": "Pull latest CIC report and resolve any overdue accounts.",
        "INCOME_UNPROVEN": "Upload bank statements or tax returns to prove income.",
        "COLLATERAL_LEGAL": "Provide legal documents showing collateral ownership is clear.",
        "DOCS_INCOMPLETE": "Complete required documents such as ID, proof of income, and collateral papers.",
        "LTV_TOO_HIGH": "Consider lowering the requested amount or increasing down payment to reduce LTV.",
        "NEED_FAST_DISBURSEMENT": "Prepare full document set in advance to shorten processing time.",
    }
    
    for reason in stuck_reasons:
        if reason in coach_map:
            steps.append(coach_map[reason])
    
    # Add generic steps
    if recommendations:
        steps.append("Compare the top recommended products using the scenario comparison feature")
        steps.append("Schedule a consultation with your preferred bank to discuss application")
    
    if not steps:
        steps.append("Prepare income proof and collateral documents to speed up processing")
    
    return list(dict.fromkeys(steps))  # Remove duplicates


def _build_assumptions(product: LoanProduct, rate_structure: RateStructure) -> List[str]:
    """Build list of assumptions used in calculations."""
    assumptions = []
    
    assumptions.append(f"Reference rate assumed at {rate_structure.reference_rate_pct}% for floating period")
    assumptions.append("Monthly compounding used for interest calculations")
    assumptions.append("All fees included at stated rates; actual fees may vary")
    
    if product.rate_model and product.rate_model.assumptions:
        assumptions.append(product.rate_model.assumptions)
    
    return assumptions


def _bucket_from_score(score: float) -> str:
    """Convert numeric score to approval bucket."""
    if score >= 75:
        return "HIGH"
    if score >= 50:
        return "MEDIUM"
    return "LOW"


def _get_reason_detail(reason_code: str) -> str:
    """Get human-readable reason detail."""
    details = {
        "PURPOSE_NOT_SUPPORTED": "Product does not support your loan purpose",
        "TENOR_TOO_SHORT": "Requested term is below minimum allowed",
        "TENOR_TOO_LONG": "Requested term exceeds maximum allowed",
        "LTV_EXCEEDS_MAX": "Loan-to-value ratio exceeds product limit",
        "LOAN_AMOUNT_TOO_LOW": "Loan amount is below minimum",
        "LOAN_AMOUNT_TOO_HIGH": "Loan amount exceeds maximum",
        "INCOME_TYPE_NOT_SUPPORTED": "Income type not accepted for this product",
        "INCOME_BELOW_MIN": "Monthly income below minimum requirement",
        "COLLATERAL_TYPE_NOT_ALLOWED": "Collateral type not accepted",
        "GEO_NOT_SUPPORTED": "Property location not in bank's coverage area",
        "DSR_EXCEEDS_MAX": "Debt service ratio exceeds limit",
    }
    return details.get(reason_code, reason_code.replace("_", " ").title())
