"""
Financial Calculation Engine for Mortgage MVP

This module provides comprehensive mortgage calculation functions including:
- Amortization schedule generation (annuity and equal principal)
- Grace period handling
- Rate reset calculations
- Prepayment fee calculations
- IRR-based APR computation
- Stress testing scenarios

All calculations are pure functions for determinism and testability.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
import math


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class MonthlyPayment:
    """Represents a single month's payment breakdown in the amortization schedule."""
    month: int
    interest: float
    principal: float
    payment: float
    remaining_balance: float
    fees: float = 0.0
    insurance: float = 0.0
    rate_applied: float = 0.0  # Annual rate used for this month
    is_grace_period: bool = False


@dataclass
class AmortizationSchedule:
    """Complete amortization schedule with summary metrics."""
    payments: List[MonthlyPayment]
    total_interest: float = 0.0
    total_principal: float = 0.0
    total_payments: float = 0.0
    total_fees: float = 0.0
    total_insurance: float = 0.0


@dataclass
class RateStructure:
    """Rate configuration for a loan product."""
    fixed_rate_pct: float = 0.0  # Annual fixed rate as percentage (e.g., 6.5 for 6.5%)
    fixed_months: int = 0
    floating_margin_pct: float = 0.0  # Margin over reference rate
    reference_rate_pct: float = 5.0  # Assumed reference rate when not available
    
    def get_rate_for_month(self, month: int, scenario_bump: float = 0.0) -> float:
        """Get the applicable annual rate for a given month."""
        if month <= self.fixed_months:
            return self.fixed_rate_pct / 100
        else:
            # Floating rate = reference + margin + scenario bump
            return (self.reference_rate_pct + self.floating_margin_pct + scenario_bump * 100) / 100


@dataclass
class FeeStructure:
    """Fee configuration for a loan product."""
    # Upfront fees
    origination_fee_pct: float = 0.0
    origination_min_vnd: float = 0.0
    origination_max_vnd: float = float('inf')
    appraisal_fee_vnd: float = 0.0
    disbursement_fee_vnd: float = 0.0
    disbursement_fee_pct: float = 0.0
    
    # Recurring fees
    account_maintenance_fee_vnd: float = 0.0  # Monthly
    insurance_annual_pct: float = 0.0  # Percentage of balance
    insurance_vnd: float = 0.0  # Fixed annual amount
    insurance_basis: str = "on_balance"  # "on_balance" or "on_property_value"
    property_value_vnd: float = 0.0  # For insurance calculation
    
    # Prepayment schedule: list of {months_from, months_to, fee_pct}
    prepayment_schedule: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class PrepaymentInfo:
    """Prepayment configuration."""
    prepayment_month: Optional[int] = None
    prepayment_amount_vnd: Optional[float] = None  # None = full payoff
    is_partial: bool = False


@dataclass 
class LoanCostSummary:
    """Summary of all loan costs over a horizon."""
    total_interest: float
    total_fees: float
    total_insurance: float
    total_cost_excluding_principal: float
    total_out_of_pocket: float
    apr: float
    monthly_payment_first_12m: float
    monthly_payment_post_promo: float
    prepayment_fee: float = 0.0


# ============================================================================
# Core Amortization Functions
# ============================================================================

def annuity_payment(principal: float, annual_rate: float, months: int) -> float:
    """
    Compute constant monthly payment for an annuity schedule.
    
    Args:
        principal: Loan principal amount
        annual_rate: Annual interest rate as decimal (e.g., 0.065 for 6.5%)
        months: Total number of months
        
    Returns:
        Monthly payment amount
    """
    if principal <= 0 or months <= 0:
        return 0.0

    monthly_rate = max(annual_rate, 0.0) / 12
    if monthly_rate == 0:
        return principal / months

    factor = (1 + monthly_rate) ** months
    payment = principal * monthly_rate * factor / (factor - 1)
    return float(payment)


def equal_principal_payment(
    principal: float, 
    remaining_balance: float,
    annual_rate: float, 
    total_months: int
) -> tuple[float, float, float]:
    """
    Compute payment for equal principal (declining) method.
    
    Returns:
        Tuple of (principal_portion, interest_portion, total_payment)
    """
    if principal <= 0 or total_months <= 0:
        return 0.0, 0.0, 0.0
    
    monthly_principal = principal / total_months
    monthly_rate = max(annual_rate, 0.0) / 12
    interest = remaining_balance * monthly_rate
    payment = monthly_principal + interest
    
    return float(monthly_principal), float(interest), float(payment)


def generate_amortization_schedule(
    principal: float,
    tenor_months: int,
    rate_structure: RateStructure,
    repayment_method: str = "annuity",
    grace_principal_months: int = 0,
    grace_interest_months: int = 0,
    fee_structure: Optional[FeeStructure] = None,
    prepayment_info: Optional[PrepaymentInfo] = None,
    scenario_bump: float = 0.0,
) -> AmortizationSchedule:
    """
    Generate a complete amortization schedule.
    
    Args:
        principal: Loan principal amount
        tenor_months: Total loan term in months
        rate_structure: Rate configuration
        repayment_method: "annuity" or "equal_principal"
        grace_principal_months: Number of months with no principal payment
        grace_interest_months: Number of months with no interest payment (rare)
        fee_structure: Optional fee configuration
        prepayment_info: Optional prepayment configuration
        scenario_bump: Rate bump for stress testing (e.g., 0.02 for +2%)
        
    Returns:
        Complete AmortizationSchedule with all payments
    """
    if principal <= 0 or tenor_months <= 0:
        return AmortizationSchedule(payments=[])
    
    payments: List[MonthlyPayment] = []
    remaining = float(principal)
    total_interest = 0.0
    total_principal = 0.0
    total_fees = 0.0
    total_insurance = 0.0
    
    # Calculate upfront fees
    upfront_fees = 0.0
    if fee_structure:
        upfront_fees = _calculate_upfront_fees(principal, fee_structure)
        total_fees += upfront_fees
    
    # Track current rate period for recalculation
    current_rate = rate_structure.get_rate_for_month(1, scenario_bump)
    months_at_current_rate = 0
    remaining_at_rate_start = remaining
    
    for month in range(1, tenor_months + 1):
        # Check for prepayment
        if prepayment_info and prepayment_info.prepayment_month == month:
            prepay_fee = _calculate_prepayment_fee(
                remaining, 
                month, 
                fee_structure.prepayment_schedule if fee_structure else []
            )
            
            # Add final payment with prepayment
            final_payment = MonthlyPayment(
                month=month,
                interest=0,
                principal=remaining,
                payment=remaining + prepay_fee,
                remaining_balance=0,
                fees=prepay_fee,
                rate_applied=current_rate,
            )
            payments.append(final_payment)
            total_principal += remaining
            total_fees += prepay_fee
            break
        
        # Get rate for this month
        new_rate = rate_structure.get_rate_for_month(month, scenario_bump)
        
        # If rate changed, recalculate payment
        if abs(new_rate - current_rate) > 1e-10:
            current_rate = new_rate
            months_at_current_rate = 0
            remaining_at_rate_start = remaining
        
        months_at_current_rate += 1
        monthly_rate = current_rate / 12
        
        # Check if in grace period
        is_principal_grace = month <= grace_principal_months
        is_interest_grace = month <= grace_interest_months
        
        # Calculate interest
        if is_interest_grace:
            interest = 0.0
        else:
            interest = remaining * monthly_rate
        
        # Calculate principal
        if is_principal_grace:
            principal_payment = 0.0
            payment = interest
        else:
            # Remaining months excluding grace already passed
            remaining_months = tenor_months - month + 1
            
            if repayment_method == "equal_principal":
                # Equal principal: distribute remaining principal over remaining months
                principal_payment = remaining / remaining_months
                payment = principal_payment + interest
            else:  # annuity
                # Recalculate annuity payment based on remaining balance and remaining term
                payment = annuity_payment(remaining, current_rate, remaining_months)
                principal_payment = payment - interest
        
        # Ensure we don't pay more principal than remaining
        principal_payment = min(principal_payment, remaining)
        remaining = max(0, remaining - principal_payment)
        
        # Calculate recurring fees and insurance
        monthly_fees = 0.0
        monthly_insurance = 0.0
        if fee_structure:
            monthly_fees = fee_structure.account_maintenance_fee_vnd
            monthly_insurance = _calculate_monthly_insurance(
                remaining + principal_payment,  # Balance at start of month
                fee_structure
            )
        
        total_fees += monthly_fees
        total_insurance += monthly_insurance
        
        mp = MonthlyPayment(
            month=month,
            interest=interest,
            principal=principal_payment,
            payment=payment,
            remaining_balance=remaining,
            fees=monthly_fees,
            insurance=monthly_insurance,
            rate_applied=current_rate,
            is_grace_period=is_principal_grace or is_interest_grace,
        )
        payments.append(mp)
        total_interest += interest
        total_principal += principal_payment
        
        if remaining <= 0:
            break
    
    return AmortizationSchedule(
        payments=payments,
        total_interest=total_interest,
        total_principal=total_principal,
        total_payments=sum(p.payment for p in payments),
        total_fees=total_fees,
        total_insurance=total_insurance,
    )


# ============================================================================
# Fee Calculations
# ============================================================================

def _calculate_upfront_fees(principal: float, fee_structure: FeeStructure) -> float:
    """Calculate total upfront fees at disbursement."""
    total = 0.0
    
    # Origination fee
    origination = principal * (fee_structure.origination_fee_pct / 100)
    origination = max(origination, fee_structure.origination_min_vnd)
    origination = min(origination, fee_structure.origination_max_vnd)
    total += origination
    
    # Fixed fees
    total += fee_structure.appraisal_fee_vnd
    total += fee_structure.disbursement_fee_vnd
    total += principal * (fee_structure.disbursement_fee_pct / 100)
    
    return total


def _calculate_monthly_insurance(balance: float, fee_structure: FeeStructure) -> float:
    """Calculate monthly insurance cost."""
    if fee_structure.insurance_vnd > 0:
        return fee_structure.insurance_vnd / 12
    
    if fee_structure.insurance_annual_pct > 0:
        if fee_structure.insurance_basis == "on_property_value" and fee_structure.property_value_vnd > 0:
            return fee_structure.property_value_vnd * (fee_structure.insurance_annual_pct / 100) / 12
        else:
            return balance * (fee_structure.insurance_annual_pct / 100) / 12
    
    return 0.0


def _calculate_prepayment_fee(
    remaining_balance: float, 
    month: int, 
    prepayment_schedule: List[Dict[str, Any]]
) -> float:
    """
    Calculate prepayment fee based on schedule.
    
    Schedule format: [{"months_from": 1, "months_to": 12, "fee_pct": 3.0}, ...]
    """
    if not prepayment_schedule:
        return 0.0
    
    for tier in prepayment_schedule:
        months_from = tier.get("months_from", 0)
        months_to = tier.get("months_to")
        fee_pct = tier.get("fee_pct", 0)
        
        if months_to is None:
            months_to = float('inf')
        
        if months_from <= month <= months_to:
            return remaining_balance * (fee_pct / 100)
    
    return 0.0


def calculate_prepayment_fee(
    remaining_balance: float,
    month: int,
    fee_structure: Optional[FeeStructure] = None,
) -> float:
    """Public function to calculate prepayment fee."""
    if not fee_structure:
        return 0.0
    return _calculate_prepayment_fee(
        remaining_balance, 
        month, 
        fee_structure.prepayment_schedule
    )


# ============================================================================
# APR/IRR Calculation
# ============================================================================

def calculate_irr(cashflows: List[float], max_iterations: int = 100, tolerance: float = 1e-10) -> float:
    """
    Calculate Internal Rate of Return using Newton-Raphson method.
    
    Args:
        cashflows: List of cashflows where index 0 is time 0, etc.
                   Positive = inflow, Negative = outflow
        max_iterations: Maximum iterations for convergence
        tolerance: Convergence tolerance
        
    Returns:
        Monthly IRR as decimal
    """
    if not cashflows or len(cashflows) < 2:
        return 0.0
    
    # Initial guess
    rate = 0.01  # 1% monthly
    
    for _ in range(max_iterations):
        # Calculate NPV and its derivative
        npv = 0.0
        npv_derivative = 0.0
        
        for t, cf in enumerate(cashflows):
            discount = (1 + rate) ** t
            npv += cf / discount
            if t > 0:
                npv_derivative -= t * cf / ((1 + rate) ** (t + 1))
        
        if abs(npv_derivative) < 1e-20:
            break
        
        # Newton-Raphson update
        new_rate = rate - npv / npv_derivative
        
        # Bound the rate to reasonable values
        new_rate = max(-0.5, min(new_rate, 1.0))
        
        if abs(new_rate - rate) < tolerance:
            return new_rate
        
        rate = new_rate
    
    return rate


def calculate_apr(
    principal: float,
    schedule: AmortizationSchedule,
    upfront_fees: float = 0.0,
    prepayment_fee: float = 0.0,
) -> float:
    """
    Calculate APR using IRR-based effective rate.
    
    The APR is computed as: APR = (1 + monthly_irr)^12 - 1
    
    Cashflow structure:
    - t=0: +net_disbursement (principal - upfront_fees)
    - t=1..n: -(payment + fees + insurance)
    - At payoff: include prepayment fee if applicable
    """
    if not schedule.payments:
        return 0.0
    
    # Build cashflow list
    cashflows = []
    
    # t=0: Net disbursement received by borrower
    net_disbursement = principal - upfront_fees
    cashflows.append(net_disbursement)
    
    # t=1..n: Payments made by borrower
    for i, payment in enumerate(schedule.payments):
        total_payment = payment.payment + payment.fees + payment.insurance
        
        # If this is the last payment, add prepayment fee
        if i == len(schedule.payments) - 1:
            total_payment += prepayment_fee
        
        cashflows.append(-total_payment)
    
    # Calculate monthly IRR
    monthly_irr = calculate_irr(cashflows)
    
    # Convert to annual APR
    apr = (1 + monthly_irr) ** 12 - 1
    
    return apr


# ============================================================================
# Stress Testing
# ============================================================================

def stress_test_scenarios(
    principal: float,
    tenor_months: int,
    rate_structure: RateStructure,
    repayment_method: str = "annuity",
    grace_principal_months: int = 0,
    fee_structure: Optional[FeeStructure] = None,
    prepayment_info: Optional[PrepaymentInfo] = None,
    horizon_months: Optional[int] = None,
) -> Dict[str, LoanCostSummary]:
    """
    Run stress test scenarios with different rate bumps.
    
    Returns cost summaries for base (+0%), +2%, and +4% scenarios.
    """
    scenarios = [0.0, 0.02, 0.04]
    results = {}
    
    horizon = horizon_months or tenor_months
    
    for bump in scenarios:
        schedule = generate_amortization_schedule(
            principal=principal,
            tenor_months=tenor_months,
            rate_structure=rate_structure,
            repayment_method=repayment_method,
            grace_principal_months=grace_principal_months,
            fee_structure=fee_structure,
            prepayment_info=prepayment_info,
            scenario_bump=bump,
        )
        
        # Calculate costs over horizon
        horizon_payments = [p for p in schedule.payments if p.month <= horizon]
        
        total_interest = sum(p.interest for p in horizon_payments)
        total_fees = sum(p.fees for p in horizon_payments)
        total_insurance = sum(p.insurance for p in horizon_payments)
        
        # Add upfront fees
        upfront_fees = 0.0
        if fee_structure:
            upfront_fees = _calculate_upfront_fees(principal, fee_structure)
            total_fees += upfront_fees
        
        # Calculate prepayment fee if applicable
        prepay_fee = 0.0
        if prepayment_info and prepayment_info.prepayment_month:
            # Find remaining balance at prepayment
            for p in schedule.payments:
                if p.month == prepayment_info.prepayment_month:
                    prepay_fee = p.fees  # Already calculated in schedule
                    break
        
        # Calculate APR
        apr = calculate_apr(principal, schedule, upfront_fees, prepay_fee)
        
        # Monthly payment averages
        first_12 = [p.payment for p in horizon_payments[:12]]
        post_promo = [p.payment for p in schedule.payments if p.month > rate_structure.fixed_months]
        
        monthly_first_12 = sum(first_12) / len(first_12) if first_12 else 0
        monthly_post_promo = sum(post_promo) / len(post_promo) if post_promo else 0
        
        total_payments = sum(p.payment for p in horizon_payments)
        total_cost_excl = total_interest + total_fees + total_insurance
        total_out_of_pocket = upfront_fees + total_payments + total_insurance + prepay_fee
        
        scenario_name = f"+{int(bump * 100)}%"
        results[scenario_name] = LoanCostSummary(
            total_interest=total_interest,
            total_fees=total_fees,
            total_insurance=total_insurance,
            total_cost_excluding_principal=total_cost_excl,
            total_out_of_pocket=total_out_of_pocket,
            apr=apr,
            monthly_payment_first_12m=monthly_first_12,
            monthly_payment_post_promo=monthly_post_promo,
            prepayment_fee=prepay_fee,
        )
    
    return results


# ============================================================================
# Legacy Compatibility Functions
# ============================================================================

def equal_principal_schedule(principal: float, annual_rate: float, months: int) -> List[float]:
    """
    Return payment schedule for equal principal (declining interest).
    Legacy function for backward compatibility.
    """
    if principal <= 0 or months <= 0:
        return []

    monthly_principal = principal / months
    monthly_rate = max(annual_rate, 0.0) / 12
    remaining = principal
    payments: List[float] = []

    for _ in range(months):
        interest = remaining * monthly_rate
        payment = monthly_principal + interest
        payments.append(float(payment))
        remaining = max(0.0, remaining - monthly_principal)

    return payments


def simulate_two_stage_annuity(
    principal: float,
    total_months: int,
    fixed_rate: float,
    fixed_months: int,
    post_fixed_rate: float,
) -> tuple[List[float], float]:
    """
    Simulate annuity payments where the rate can reset after the fixed period.
    Legacy function for backward compatibility.
    
    Returns the full payment schedule and the remaining principal after the fixed period.
    """
    rate_structure = RateStructure(
        fixed_rate_pct=fixed_rate * 100,
        fixed_months=fixed_months,
        floating_margin_pct=0,
        reference_rate_pct=post_fixed_rate * 100,
    )
    
    schedule = generate_amortization_schedule(
        principal=principal,
        tenor_months=total_months,
        rate_structure=rate_structure,
        repayment_method="annuity",
    )
    
    payments = [p.payment for p in schedule.payments]
    
    # Find remaining balance after fixed period
    remaining_after_fixed = principal
    for p in schedule.payments:
        if p.month <= fixed_months:
            remaining_after_fixed = p.remaining_balance
    
    return payments, remaining_after_fixed


def summarize_costs(payments: List[float]) -> dict:
    """Summaries used by the API response. Legacy function."""
    if not payments:
        return {
            "month1_payment": 0.0,
            "year1_total": 0.0,
            "total_3y": 0.0,
            "total_5y": 0.0,
        }

    def partial_total(months: int) -> float:
        return float(sum(payments[: min(months, len(payments))]))

    return {
        "month1_payment": float(payments[0]),
        "year1_total": partial_total(12),
        "total_3y": partial_total(36),
        "total_5y": partial_total(60),
    }


def cost_estimates_with_stress(
    principal: float,
    tenor_months: int,
    rate_fixed: float,
    rate_fixed_months: int,
    post_fixed_rate: float,
) -> dict:
    """
    Build the EstimatedCosts payload based on two-stage annuity and stress (+1%/+2%).
    Legacy function for backward compatibility.
    """
    rate_structure = RateStructure(
        fixed_rate_pct=rate_fixed * 100,
        fixed_months=rate_fixed_months,
        floating_margin_pct=0,
        reference_rate_pct=post_fixed_rate * 100,
    )
    
    schedule = generate_amortization_schedule(
        principal=principal,
        tenor_months=tenor_months,
        rate_structure=rate_structure,
    )
    
    payments = [p.payment for p in schedule.payments]
    summaries = summarize_costs(payments)
    
    # Stress test only affects the post-fixed period
    stress_payment = max(payments) if payments else 0.0
    post_period_months = max(0, tenor_months - max(rate_fixed_months, 0))
    
    if post_period_months > 0 and schedule.payments:
        # Find remaining balance after fixed period
        remaining_after_fixed = principal
        for p in schedule.payments:
            if p.month == rate_fixed_months:
                remaining_after_fixed = p.remaining_balance
                break
        
        if remaining_after_fixed > 0:
            stress_plus_one = annuity_payment(remaining_after_fixed, post_fixed_rate + 0.01, post_period_months)
            stress_plus_two = annuity_payment(remaining_after_fixed, post_fixed_rate + 0.02, post_period_months)
            stress_payment = max(stress_payment, stress_plus_one, stress_plus_two)

    summaries["stress_max_monthly"] = float(stress_payment)
    return summaries
