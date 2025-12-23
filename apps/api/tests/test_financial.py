"""
Comprehensive unit tests for the financial calculation engine.

Tests cover:
- Amortization schedule generation (annuity and equal principal)
- Grace period handling
- Rate reset calculations
- Prepayment fee calculations
- IRR/APR computation
- Stress testing scenarios
"""
import pytest
from decimal import Decimal
import math

from app.services.financial import (
    annuity_payment,
    equal_principal_payment,
    equal_principal_schedule,
    generate_amortization_schedule,
    calculate_irr,
    calculate_apr,
    calculate_prepayment_fee,
    stress_test_scenarios,
    RateStructure,
    FeeStructure,
    PrepaymentInfo,
    AmortizationSchedule,
    LoanCostSummary,
)


class TestAnnuityPayment:
    """Tests for the annuity payment calculation."""
    
    def test_basic_annuity_payment(self):
        """Test standard annuity payment calculation."""
        # 500M VND, 10% annual rate, 120 months (10 years)
        payment = annuity_payment(500_000_000, 0.10, 120)
        
        # Expected payment around 6.6M/month
        assert 6_000_000 < payment < 7_000_000
    
    def test_zero_interest_rate(self):
        """Test annuity with zero interest - should equal principal/months."""
        principal = 1_000_000_000
        months = 100
        payment = annuity_payment(principal, 0.0, months)
        
        expected = principal / months
        assert abs(payment - expected) < 1  # Allow rounding
    
    def test_zero_principal(self):
        """Test annuity with zero principal."""
        payment = annuity_payment(0, 0.10, 120)
        assert payment == 0.0
    
    def test_zero_months(self):
        """Test annuity with zero months."""
        payment = annuity_payment(1_000_000_000, 0.10, 0)
        assert payment == 0.0
    
    def test_high_interest_rate(self):
        """Test annuity with high interest rate (20%)."""
        payment = annuity_payment(500_000_000, 0.20, 120)
        
        # Higher rate means higher payment
        low_rate_payment = annuity_payment(500_000_000, 0.10, 120)
        assert payment > low_rate_payment
    
    def test_total_payment_exceeds_principal(self):
        """Test that total payments exceed principal (interest accumulation)."""
        principal = 500_000_000
        payment = annuity_payment(principal, 0.10, 120)
        total_paid = payment * 120
        
        assert total_paid > principal


class TestEqualPrincipalPayment:
    """Tests for equal principal (declining) payment calculation."""
    
    def test_basic_equal_principal(self):
        """Test standard equal principal calculation."""
        principal = 500_000_000
        remaining = 500_000_000
        months = 120
        
        principal_portion, interest_portion, payment = equal_principal_payment(
            principal, remaining, 0.10, months
        )
        
        # Principal portion should be constant
        expected_principal = principal / months
        assert abs(principal_portion - expected_principal) < 1
        
        # First month interest on full balance
        expected_interest = remaining * (0.10 / 12)
        assert abs(interest_portion - expected_interest) < 1
        
        # Total payment
        assert abs(payment - (principal_portion + interest_portion)) < 1
    
    def test_declining_payments(self):
        """Test that payments decline over time with equal principal."""
        schedule = equal_principal_schedule(500_000_000, 0.10, 120)
        
        # Payments should decline
        assert schedule[0] > schedule[-1]
        
        # All payments positive
        assert all(p > 0 for p in schedule)
        
        # First payment higher than last
        assert schedule[0] - schedule[-1] > 1_000_000


class TestAmortizationSchedule:
    """Tests for full amortization schedule generation."""
    
    def test_basic_annuity_schedule(self):
        """Test basic annuity schedule generation."""
        rate_structure = RateStructure(
            fixed_rate_pct=10.0,
            fixed_months=120,
        )
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
            repayment_method="annuity",
        )
        
        assert len(schedule.payments) == 120
        assert schedule.total_principal > 0
        assert schedule.total_interest > 0
        
        # Final balance should be zero (or very close)
        assert schedule.payments[-1].remaining_balance < 1
    
    def test_equal_principal_schedule(self):
        """Test equal principal schedule generation."""
        rate_structure = RateStructure(
            fixed_rate_pct=10.0,
            fixed_months=120,
        )
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
            repayment_method="equal_principal",
        )
        
        assert len(schedule.payments) == 120
        
        # First payment should be higher than last
        assert schedule.payments[0].payment > schedule.payments[-1].payment
    
    def test_rate_reset_after_fixed_period(self):
        """Test that rate resets after fixed period ends."""
        rate_structure = RateStructure(
            fixed_rate_pct=6.0,
            fixed_months=12,
            floating_margin_pct=3.5,
            reference_rate_pct=5.0,
        )
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=24,
            rate_structure=rate_structure,
            repayment_method="annuity",
        )
        
        # Rate should be 6% for first 12 months
        assert schedule.payments[0].rate_applied == 0.06
        assert schedule.payments[11].rate_applied == 0.06
        
        # Rate should be 5% + 3.5% = 8.5% after
        assert schedule.payments[12].rate_applied == 0.085
    
    def test_grace_period_principal(self):
        """Test grace period for principal payments."""
        rate_structure = RateStructure(fixed_rate_pct=10.0, fixed_months=24)
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=24,
            rate_structure=rate_structure,
            repayment_method="annuity",
            grace_principal_months=3,
        )
        
        # First 3 months should have zero principal
        for i in range(3):
            assert schedule.payments[i].principal == 0
            assert schedule.payments[i].is_grace_period is True
            # But should still pay interest
            assert schedule.payments[i].interest > 0
        
        # After grace period, principal payments start
        assert schedule.payments[3].principal > 0
    
    def test_prepayment_terminates_schedule(self):
        """Test that prepayment terminates the schedule early."""
        rate_structure = RateStructure(fixed_rate_pct=10.0, fixed_months=120)
        fee_structure = FeeStructure(
            prepayment_schedule=[
                {"months_from": 1, "months_to": 12, "fee_pct": 3.0},
                {"months_from": 13, "months_to": None, "fee_pct": 0},
            ]
        )
        prepay_info = PrepaymentInfo(prepayment_month=24)
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
            fee_structure=fee_structure,
            prepayment_info=prepay_info,
        )
        
        # Schedule should be truncated at prepayment month
        assert len(schedule.payments) == 24
        
        # Last payment should include prepayment fee (0% since > 12 months)
        assert schedule.payments[-1].remaining_balance == 0
    
    def test_stress_scenario_increases_rate(self):
        """Test that stress scenario increases floating rate."""
        rate_structure = RateStructure(
            fixed_rate_pct=6.0,
            fixed_months=12,
            floating_margin_pct=3.0,
            reference_rate_pct=5.0,
        )
        
        # Base scenario
        base_schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=24,
            rate_structure=rate_structure,
            scenario_bump=0.0,
        )
        
        # +2% stress
        stress_schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=24,
            rate_structure=rate_structure,
            scenario_bump=0.02,
        )
        
        # Post-fixed period rate should be higher in stress scenario
        # Base: 5% + 3% = 8%
        # Stress: 5% + 3% + 2% = 10%
        assert base_schedule.payments[12].rate_applied == 0.08
        assert stress_schedule.payments[12].rate_applied == 0.10
        
        # Total interest should be higher in stress scenario
        assert stress_schedule.total_interest > base_schedule.total_interest


class TestPrepaymentFee:
    """Tests for prepayment fee calculation."""
    
    def test_prepayment_fee_first_year(self):
        """Test prepayment fee in first year."""
        fee_structure = FeeStructure(
            prepayment_schedule=[
                {"months_from": 1, "months_to": 12, "fee_pct": 3.0},
                {"months_from": 13, "months_to": 24, "fee_pct": 2.0},
                {"months_from": 25, "months_to": None, "fee_pct": 0},
            ]
        )
        
        remaining = 400_000_000
        fee = calculate_prepayment_fee(remaining, month=6, fee_structure=fee_structure)
        
        expected = remaining * 0.03
        assert fee == expected
    
    def test_prepayment_fee_second_year(self):
        """Test prepayment fee in second year."""
        fee_structure = FeeStructure(
            prepayment_schedule=[
                {"months_from": 1, "months_to": 12, "fee_pct": 3.0},
                {"months_from": 13, "months_to": 24, "fee_pct": 2.0},
                {"months_from": 25, "months_to": None, "fee_pct": 0},
            ]
        )
        
        remaining = 400_000_000
        fee = calculate_prepayment_fee(remaining, month=18, fee_structure=fee_structure)
        
        expected = remaining * 0.02
        assert fee == expected
    
    def test_prepayment_fee_after_penalty_period(self):
        """Test prepayment fee after penalty period ends."""
        fee_structure = FeeStructure(
            prepayment_schedule=[
                {"months_from": 1, "months_to": 12, "fee_pct": 3.0},
                {"months_from": 13, "months_to": None, "fee_pct": 0},
            ]
        )
        
        remaining = 400_000_000
        fee = calculate_prepayment_fee(remaining, month=36, fee_structure=fee_structure)
        
        assert fee == 0
    
    def test_no_fee_structure(self):
        """Test prepayment fee when no structure provided."""
        fee = calculate_prepayment_fee(400_000_000, month=6, fee_structure=None)
        assert fee == 0


class TestIRRCalculation:
    """Tests for Internal Rate of Return calculation."""
    
    def test_simple_irr(self):
        """Test IRR with simple known cashflows."""
        # Investment of 1000, returns of 100 for 12 months, plus 1000 at end
        # This is essentially a 10% annual return
        cashflows = [1000]  # Initial investment (positive = inflow)
        for _ in range(11):
            cashflows.append(-100)  # Monthly payments
        cashflows.append(-1100)  # Final payment with principal return
        
        irr = calculate_irr(cashflows)
        
        # Monthly IRR should be close to 0.833% (10%/12)
        assert 0.005 < irr < 0.015
    
    def test_irr_convergence(self):
        """Test that IRR converges for reasonable cashflows."""
        # Standard loan cashflow
        principal = 1_000_000
        monthly_payment = 10_000
        months = 120
        
        cashflows = [principal]
        for _ in range(months):
            cashflows.append(-monthly_payment)
        
        irr = calculate_irr(cashflows)
        
        # Should converge to some positive value
        assert irr > 0
    
    def test_apr_from_schedule(self):
        """Test APR calculation from amortization schedule."""
        rate_structure = RateStructure(fixed_rate_pct=10.0, fixed_months=120)
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
        )
        
        apr = calculate_apr(
            principal=500_000_000,
            schedule=schedule,
            upfront_fees=2_000_000,  # 2M upfront fees
        )
        
        # APR should be slightly higher than stated rate due to fees
        assert apr > 0.10
        assert apr < 0.15  # But not unreasonably high


class TestStressTestScenarios:
    """Tests for stress testing functionality."""
    
    def test_three_scenarios_returned(self):
        """Test that three scenarios are returned."""
        rate_structure = RateStructure(
            fixed_rate_pct=6.0,
            fixed_months=12,
            floating_margin_pct=3.0,
            reference_rate_pct=5.0,
        )
        
        scenarios = stress_test_scenarios(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
        )
        
        assert "+0%" in scenarios
        assert "+2%" in scenarios
        assert "+4%" in scenarios
    
    def test_stress_increases_costs(self):
        """Test that stress scenarios increase costs."""
        rate_structure = RateStructure(
            fixed_rate_pct=6.0,
            fixed_months=12,
            floating_margin_pct=3.0,
            reference_rate_pct=5.0,
        )
        
        scenarios = stress_test_scenarios(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
        )
        
        base = scenarios["+0%"]
        stress_2 = scenarios["+2%"]
        stress_4 = scenarios["+4%"]
        
        # Total costs should increase with stress
        assert stress_2.total_interest > base.total_interest
        assert stress_4.total_interest > stress_2.total_interest
        
        # APR should increase with stress
        assert stress_2.apr > base.apr
        assert stress_4.apr > stress_2.apr
    
    def test_horizon_limits_costs(self):
        """Test that horizon limits cost calculation."""
        rate_structure = RateStructure(
            fixed_rate_pct=6.0,
            fixed_months=12,
            floating_margin_pct=3.0,
            reference_rate_pct=5.0,
        )
        
        # Full term
        full_scenarios = stress_test_scenarios(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
        )
        
        # Limited horizon (5 years)
        limited_scenarios = stress_test_scenarios(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
            horizon_months=60,
        )
        
        # Costs should be lower with limited horizon
        assert limited_scenarios["+0%"].total_interest < full_scenarios["+0%"].total_interest


class TestFeeCalculations:
    """Tests for fee structure calculations."""
    
    def test_upfront_fee_calculation(self):
        """Test upfront fee calculation in schedule."""
        rate_structure = RateStructure(fixed_rate_pct=10.0, fixed_months=120)
        fee_structure = FeeStructure(
            origination_fee_pct=0.5,
            origination_min_vnd=500_000,
            appraisal_fee_vnd=2_000_000,
        )
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=120,
            rate_structure=rate_structure,
            fee_structure=fee_structure,
        )
        
        # Upfront fees: 0.5% of 500M = 2.5M + 2M appraisal = 4.5M
        expected_upfront = 500_000_000 * 0.005 + 2_000_000
        assert schedule.total_fees >= expected_upfront
    
    def test_insurance_fee_calculation(self):
        """Test recurring insurance fee calculation."""
        rate_structure = RateStructure(fixed_rate_pct=10.0, fixed_months=12)
        fee_structure = FeeStructure(
            insurance_annual_pct=0.05,  # 0.05% of balance per year
            insurance_basis="on_balance",
        )
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=12,
            rate_structure=rate_structure,
            fee_structure=fee_structure,
        )
        
        # Should have some insurance charges
        assert schedule.total_insurance > 0


class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""
    
    def test_very_short_term(self):
        """Test with very short loan term."""
        rate_structure = RateStructure(fixed_rate_pct=10.0, fixed_months=6)
        
        schedule = generate_amortization_schedule(
            principal=100_000_000,
            tenor_months=6,
            rate_structure=rate_structure,
        )
        
        assert len(schedule.payments) == 6
        assert schedule.payments[-1].remaining_balance < 1
    
    def test_very_long_term(self):
        """Test with very long loan term (30 years)."""
        rate_structure = RateStructure(fixed_rate_pct=8.0, fixed_months=360)
        
        schedule = generate_amortization_schedule(
            principal=2_000_000_000,
            tenor_months=360,
            rate_structure=rate_structure,
        )
        
        assert len(schedule.payments) == 360
        assert schedule.payments[-1].remaining_balance < 100  # Allow small rounding
    
    def test_small_loan_amount(self):
        """Test with small loan amount."""
        rate_structure = RateStructure(fixed_rate_pct=10.0, fixed_months=12)
        
        schedule = generate_amortization_schedule(
            principal=10_000_000,  # 10M VND
            tenor_months=12,
            rate_structure=rate_structure,
        )
        
        assert len(schedule.payments) == 12
        assert schedule.total_principal > 9_999_000  # Close to 10M
    
    def test_high_rate(self):
        """Test with high interest rate."""
        rate_structure = RateStructure(fixed_rate_pct=20.0, fixed_months=60)
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=60,
            rate_structure=rate_structure,
        )
        
        # Total interest should be substantial
        assert schedule.total_interest > 200_000_000  # More than 200M interest
    
    def test_full_grace_period(self):
        """Test with grace period equal to tenor (interest-only)."""
        rate_structure = RateStructure(fixed_rate_pct=10.0, fixed_months=12)
        
        schedule = generate_amortization_schedule(
            principal=500_000_000,
            tenor_months=12,
            rate_structure=rate_structure,
            grace_principal_months=11,  # 11 months grace, 1 month to pay all
        )
        
        # First 11 payments should be interest-only
        for i in range(11):
            assert schedule.payments[i].principal == 0
        
        # Last payment should cover all principal
        assert schedule.payments[-1].principal > 400_000_000


class TestLegacyCompatibility:
    """Tests for legacy function compatibility."""
    
    def test_equal_principal_schedule_legacy(self):
        """Test legacy equal_principal_schedule function."""
        schedule = equal_principal_schedule(500_000_000, 0.10, 120)
        
        assert len(schedule) == 120
        assert schedule[0] > schedule[-1]  # Declining payments
    
    def test_simulate_two_stage_annuity(self):
        """Test legacy simulate_two_stage_annuity function."""
        from app.services.financial import simulate_two_stage_annuity
        
        payments, remaining = simulate_two_stage_annuity(
            principal=500_000_000,
            total_months=120,
            fixed_rate=0.06,
            fixed_months=12,
            post_fixed_rate=0.10,
        )
        
        assert len(payments) == 120
        
        # Remaining after fixed period should be less than principal
        assert remaining < 500_000_000
        assert remaining > 0
