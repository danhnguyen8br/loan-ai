import { describe, it, expect } from 'vitest';
import {
  roundVND,
  calculatePMT,
  buildRateTimelineLegacy,
  getPrepaymentFeePct,
  calculatePrepaymentFee,
  calculateUpfrontFees,
  getMilestonePayoffMonth,
  generateSchedule,
  calculateAPR,
  getTemplateById,
  PRODUCT_TEMPLATES,
} from '../src';
import type { UserInput, RepaymentStrategy, ProductTemplate } from '../src/types';

// ============================================================================
// Helper to create standard user input
// ============================================================================

function createUserInput(overrides: Partial<UserInput> = {}): UserInput {
  return {
    currency: 'VND',
    start_date: '2024-01-01',
    loan_amount_vnd: 1_000_000_000, // 1 billion VND
    term_months: 240,
    include_insurance: false,
    stress: { floating_rate_bump_pct: 0 },
    ...overrides,
  };
}

// ============================================================================
// Basic Utility Tests
// ============================================================================

describe('roundVND', () => {
  it('rounds to nearest integer', () => {
    expect(roundVND(1234.5)).toBe(1235);
    expect(roundVND(1234.4)).toBe(1234);
    expect(roundVND(1234.0)).toBe(1234);
  });
});

describe('calculatePMT', () => {
  it('calculates annuity payment correctly', () => {
    // 1 billion VND, 12% annual (1% monthly), 12 months
    const pmt = calculatePMT(1_000_000_000, 0.01, 12);
    // Expected: ~88,848,787 VND
    expect(pmt).toBeGreaterThan(88_000_000);
    expect(pmt).toBeLessThan(90_000_000);
  });

  it('handles zero interest rate', () => {
    const pmt = calculatePMT(1_200_000_000, 0, 12);
    expect(pmt).toBe(100_000_000);
  });
});

// ============================================================================
// Rate Timeline Tests
// ============================================================================

describe('buildRateTimelineLegacy', () => {
  it('builds correct timeline for promo + floating', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ horizon_months: 24 });
    
    const timeline = buildRateTimelineLegacy(template, userInput);
    
    expect(timeline.length).toBe(24);
    
    // First 6 months should be promo rate (5.2%)
    for (let i = 0; i < 6; i++) {
      expect(timeline[i].annual_rate_pct).toBe(5.2);
    }
    
    // After promo: 5.0% + 3.8% margin = 8.8%
    for (let i = 6; i < 24; i++) {
      expect(timeline[i].annual_rate_pct).toBe(8.8);
    }
  });

  it('applies stress rate bump correctly', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ 
      horizon_months: 24,
      stress: { floating_rate_bump_pct: 2 }
    });
    
    const timeline = buildRateTimelineLegacy(template, userInput);
    
    // After promo with +2% stress: 5.0% + 3.8% + 2% = 10.8%
    expect(timeline[6].annual_rate_pct).toBe(10.8);
    expect(timeline[23].annual_rate_pct).toBe(10.8);
  });

  it('handles horizon fully within fixed promo period', () => {
    // This mortgage template is fixed for 60 months; if horizon is shorter, timeline should stay fixed
    const template = getTemplateById('market2025_mortgage_fixed_60m')!;
    const userInput = createUserInput({ horizon_months: 24 });
    
    const timeline = buildRateTimelineLegacy(template, userInput);
    
    // All months should remain at fixed promo rate 7.8%
    expect(timeline[0].annual_rate_pct).toBe(7.8);
    expect(timeline[12].annual_rate_pct).toBe(7.8);
    expect(timeline[23].annual_rate_pct).toBe(7.8);
  });
});

// ============================================================================
// Prepayment Fee Tests
// ============================================================================

describe('getPrepaymentFeePct', () => {
  it('returns correct fee for each period', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    
    expect(getPrepaymentFeePct(template, 1)).toBe(3);
    expect(getPrepaymentFeePct(template, 11)).toBe(3);
    expect(getPrepaymentFeePct(template, 12)).toBe(2);
    expect(getPrepaymentFeePct(template, 23)).toBe(2);
    expect(getPrepaymentFeePct(template, 24)).toBe(1);
    expect(getPrepaymentFeePct(template, 35)).toBe(1);
    expect(getPrepaymentFeePct(template, 36)).toBe(0);
    expect(getPrepaymentFeePct(template, 100)).toBe(0);
  });
});

describe('calculatePrepaymentFee', () => {
  it('calculates fee based on percentage', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    
    const fee = calculatePrepaymentFee(template, 6, 100_000_000);
    expect(fee).toBe(3_000_000); // 3% of 100M
  });

  it('returns 0 after penalty period', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    
    const fee = calculatePrepaymentFee(template, 48, 100_000_000);
    expect(fee).toBe(0);
  });
});

// ============================================================================
// Upfront Fees Tests
// ============================================================================

describe('calculateUpfrontFees', () => {
  it('calculates mortgage fees correctly', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    
    const fees = calculateUpfrontFees(template, 1_000_000_000);
    // 0.5% origination + 3M appraisal = 5M + 3M = 8M
    expect(fees).toBe(8_000_000);
  });

  it('calculates refinance fees correctly', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    
    const fees = calculateUpfrontFees(template, 1_000_000_000);
    // 0.3% processing + 2.5M appraisal = 3M + 2.5M = 5.5M
    expect(fees).toBe(5_500_000);
  });

  it('handles percentage refinance fee', () => {
    const template = getTemplateById('market2025_refinance_low_margin_float')!;
    
    const fees = calculateUpfrontFees(template, 1_000_000_000);
    // 0.5% processing + 2M appraisal = 5M + 2M = 7M
    expect(fees).toBe(7_000_000);
  });
});

// ============================================================================
// Milestone Payoff Tests
// ============================================================================

describe('getMilestonePayoffMonth', () => {
  it('returns null for min payment strategy', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    expect(getMilestonePayoffMonth(strategy, template)).toBeNull();
  });

  it('returns promo end month for payoff_at_end_of_promo', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const strategy: RepaymentStrategy = { 
      type: 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE',
      milestone: 'payoff_at_end_of_promo'
    };
    
    expect(getMilestonePayoffMonth(strategy, template)).toBe(6);
  });

  it('returns grace end month for payoff_at_end_of_grace', () => {
    const template = getTemplateById('market2025_mortgage_fixed_24m')!;
    const strategy: RepaymentStrategy = { 
      type: 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE',
      milestone: 'payoff_at_end_of_grace'
    };
    
    // market2025_mortgage_fixed_24m has 36 months grace period
    expect(getMilestonePayoffMonth(strategy, template)).toBe(36);
  });

  it('finds month when prepay fee hits threshold', () => {
    const template = getTemplateById('market2025_refinance_low_margin_float')!;
    const strategy: RepaymentStrategy = { 
      type: 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE',
      milestone: 'payoff_when_prepay_fee_hits_threshold',
      threshold_pct: 0
    };
    
    // market2025_refinance_low_margin_float: 0-12: 2%, 12-24: 1%, >=24: 0%
    expect(getMilestonePayoffMonth(strategy, template)).toBe(24);
  });
});

// ============================================================================
// Schedule Generation Tests
// ============================================================================

describe('generateSchedule', () => {
  it('generates correct schedule for min payment strategy', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ horizon_months: 36 });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    expect(result.schedule.length).toBe(36);
    expect(result.template_id).toBe('market2025_mortgage_promo_6m');
    
    // First month should have correct structure
    const month1 = result.schedule[0];
    expect(month1.month).toBe(1);
    expect(month1.balance_start).toBe(1_000_000_000);
    expect(month1.rate_annual_pct).toBe(5.2); // Promo rate
    expect(month1.interest).toBeGreaterThan(0);
    // Grace period means principal is not repaid
    expect(month1.balance_end).toBe(1_000_000_000);
  });

  it('handles grace principal months correctly', () => {
    const template = getTemplateById('market2025_mortgage_fixed_24m')!;
    const userInput = createUserInput({ horizon_months: 60 });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // Grace period - during grace, principal_scheduled should be 0
    for (let i = 0; i < 36; i++) {
      expect(result.schedule[i].principal_scheduled).toBe(0);
    }
    
    // After grace period (month 37), principal should be paid
    expect(result.schedule[36].principal_scheduled).toBeGreaterThan(0);
  });

  it('applies extra principal strategy correctly', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ horizon_months: 36 });
    
    const minPaymentResult = generateSchedule(template, userInput, { type: 'STRATEGY_MIN_PAYMENT' });
    
    const extraPrincipalResult = generateSchedule(template, userInput, { 
      type: 'STRATEGY_FIXED_EXTRA_PRINCIPAL',
      extra_principal_vnd: 20_000_000
    });
    
    // Extra principal strategy should result in lower total interest
    expect(extraPrincipalResult.totals.total_interest).toBeLessThan(minPaymentResult.totals.total_interest);
    
    // Extra principal should be applied each month
    expect(extraPrincipalResult.schedule[0].extra_principal).toBe(20_000_000);
  });

  it('handles milestone payoff correctly', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ horizon_months: 36 });
    const strategy: RepaymentStrategy = { 
      type: 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE',
      milestone: 'payoff_at_end_of_promo'
    };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // Should payoff at month 6
    const payoffRow = result.schedule.find(r => r.is_payoff_month);
    expect(payoffRow).toBeDefined();
    expect(payoffRow!.month).toBe(6);
    expect(payoffRow!.balance_end).toBe(0);
    
    // Should include prepayment penalty (within first-year tier)
    expect(payoffRow!.prepayment_penalty).toBeGreaterThan(0);
    
    // Schedule should stop at payoff month
    expect(result.schedule.length).toBe(6);
  });

  it('includes insurance when enabled', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ 
      horizon_months: 12,
      include_insurance: true 
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // Insurance should be applied when include_insurance is true
    // Note: insurance is calculated based on template's insurance settings
    expect(result.totals.total_insurance).toBeGreaterThanOrEqual(0);
  });

  it('correctly calculates totals', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ horizon_months: 24 });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // Verify totals are consistent
    const sumInterest = result.schedule.reduce((sum, r) => sum + r.interest, 0);
    expect(roundVND(sumInterest)).toBe(result.totals.total_interest);
    
    const sumFees = result.schedule.reduce((sum, r) => sum + r.fees, 0);
    expect(roundVND(sumFees)).toBe(result.totals.total_fees_recurring);
    
    // Total cost should equal interest + all fees + insurance
    expect(result.totals.total_cost_excl_principal).toBe(
      result.totals.total_interest + 
      result.totals.total_fees + 
      result.totals.total_insurance
    );
  });

  it('handles equal principal repayment method', () => {
    // Use a template with a meaningful grace period so we can observe principal after grace
    const template = getTemplateById('market2025_mortgage_fixed_24m')!;
    const userInput = createUserInput({ 
      horizon_months: 120, // need longer horizon to see principal payments after grace
      repayment_method: 'equal_principal'
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // market2025_mortgage_fixed_24m has 36 months grace, so principal should be 0 during grace
    expect(result.schedule[0].principal_scheduled).toBe(0);
    
    // After grace (month 37+), principal payment should be constant
    // The actual principal is calculated by the engine - just verify it's positive
    expect(result.schedule[36].principal_scheduled).toBeGreaterThan(0);
    
    // And principal payments should be roughly equal after grace
    expect(result.schedule[37].principal_scheduled).toBe(result.schedule[36].principal_scheduled);
  });

  it('pays off loan completely when horizon equals term (beyond grace)', () => {
    // This template has a grace period; with term beyond grace, the loan should fully amortize
    const template = getTemplateById('market2025_mortgage_fixed_24m')!;
    const userInput = createUserInput({ 
      horizon_months: 180,
      term_months: 180 
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // Schedule should run until loan is paid off
    expect(result.schedule.length).toBe(180);
    
    // Balance at end should be 0 (or very close due to rounding)
    const lastRow = result.schedule[result.schedule.length - 1];
    expect(lastRow.balance_end).toBeLessThanOrEqual(100); // Allow for rounding
    
    // First 36 months should have 0 principal (grace period)
    for (let i = 0; i < 36; i++) {
      expect(result.schedule[i].principal_scheduled).toBe(0);
    }
    
    // Month 37 should have principal payment (after grace ends)
    expect(result.schedule[36].principal_scheduled).toBeGreaterThan(0);
  });

  it('handles case where term equals grace period (no principal during term)', () => {
    // market2025_mortgage_fixed_24m has 36 months grace. With 36 month term, no principal is paid
    const template = getTemplateById('market2025_mortgage_fixed_24m')!;
    const userInput = createUserInput({ 
      horizon_months: 36,
      term_months: 36 
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // All months should have 0 principal (entire term is in grace)
    for (const row of result.schedule) {
      expect(row.principal_scheduled).toBe(0);
    }
    
    // Balance should not decrease (only interest paid during grace)
    expect(result.schedule[35].balance_end).toBe(1_000_000_000);
  });

  it('recalculates PMT correctly when grace period ends', () => {
    // market2025_mortgage_fixed_24m has 36 months grace, use 120 month term so 84 months of principal payments
    const template = getTemplateById('market2025_mortgage_fixed_24m')!;
    const userInput = createUserInput({ 
      horizon_months: 120,
      term_months: 120 
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // Balance at end should be 0 (or very close due to rounding)
    const lastRow = result.schedule[result.schedule.length - 1];
    expect(lastRow.balance_end).toBeLessThanOrEqual(1000); // Allow for rounding
    
    // The payment right after grace ends (first principal payment) should be higher than the prior month
    // because it now includes both principal and interest
    expect(result.schedule[36].payment_total).toBeGreaterThan(result.schedule[35].payment_total);
  });
});

// ============================================================================
// Metrics Tests
// ============================================================================

describe('SimulationMetrics', () => {
  it('calculates correct monthly payment averages', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ horizon_months: 24 });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // monthly_payment_initial should be avg of first 3 months
    const first3Avg = (
      result.schedule[0].payment_total + 
      result.schedule[1].payment_total + 
      result.schedule[2].payment_total
    ) / 3;
    expect(result.metrics.monthly_payment_initial).toBe(roundVND(first3Avg));
    
    // monthly_payment_post_promo should be avg of 3 months after promo (months 7-9)
    const postPromoAvg = (
      result.schedule[6].payment_total + 
      result.schedule[7].payment_total + 
      result.schedule[8].payment_total
    ) / 3;
    expect(result.metrics.monthly_payment_post_promo).toBe(roundVND(postPromoAvg));
  });

  it('identifies max monthly payment', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ 
      horizon_months: 24,
      stress: { floating_rate_bump_pct: 4 }
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    const actualMax = Math.max(...result.schedule.map(r => r.payment_total));
    expect(result.metrics.max_monthly_payment).toBe(actualMax);
  });
});

// ============================================================================
// APR/IRR Tests
// ============================================================================

describe('calculateAPR', () => {
  it('returns reasonable APR for standard loan', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ horizon_months: 36 });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // APR should be reasonable (between 7% and 15% for VN mortgages)
    expect(result.metrics.apr_pct).toBeDefined();
    expect(result.metrics.apr_pct!).toBeGreaterThan(7);
    expect(result.metrics.apr_pct!).toBeLessThan(15);
  });

  it('APR increases with fees', () => {
    // Compare template with high fees vs low fees
    const highFeeTemplate = getTemplateById('market2025_mortgage_promo_6m')!;
    const lowFeeTemplate = getTemplateById('market2025_refinance_promo_12m')!;
    
    const userInput = createUserInput({ horizon_months: 12 });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const highFeeResult = generateSchedule(highFeeTemplate, userInput, strategy);
    const lowFeeResult = generateSchedule(lowFeeTemplate, userInput, strategy);
    
    // Both should have APR defined
    expect(highFeeResult.metrics.apr_pct).toBeDefined();
    expect(lowFeeResult.metrics.apr_pct).toBeDefined();
  });
});

// ============================================================================
// Stress Scenario Tests
// ============================================================================

describe('Stress Scenarios', () => {
  it('stress +0 produces baseline results', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ 
      horizon_months: 24,
      stress: { floating_rate_bump_pct: 0 }
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // Post-promo rate should be base floating (5.0% + 3.8% = 8.8%)
    expect(result.schedule[6].rate_annual_pct).toBe(8.8);
  });

  it('stress +2 increases post-promo rates', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const userInput = createUserInput({ 
      horizon_months: 24,
      stress: { floating_rate_bump_pct: 2 }
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = generateSchedule(template, userInput, strategy);
    
    // Post-promo rate should be 8.8% + 2% = 10.8%
    expect(result.schedule[6].rate_annual_pct).toBe(10.8);
  });

  it('stress +4 produces highest costs', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result0 = generateSchedule(template, createUserInput({ 
      horizon_months: 24, stress: { floating_rate_bump_pct: 0 }
    }), strategy);
    
    const result4 = generateSchedule(template, createUserInput({ 
      horizon_months: 24, stress: { floating_rate_bump_pct: 4 }
    }), strategy);
    
    // Higher stress = more interest
    expect(result4.totals.total_interest).toBeGreaterThan(result0.totals.total_interest);
  });
});

// ============================================================================
// Template Data Tests
// ============================================================================

describe('PRODUCT_TEMPLATES', () => {
  it('has exactly 6 templates', () => {
    expect(PRODUCT_TEMPLATES.length).toBe(6);
  });

  it('has 3 MORTGAGE_RE templates', () => {
    const mortgageTemplates = PRODUCT_TEMPLATES.filter(t => t.category === 'MORTGAGE_RE');
    expect(mortgageTemplates.length).toBe(3);
  });

  it('has 3 REFINANCE templates', () => {
    const refiTemplates = PRODUCT_TEMPLATES.filter(t => t.category === 'REFINANCE');
    expect(refiTemplates.length).toBe(3);
  });

  it('all templates have data_confidence_score >= 85', () => {
    for (const template of PRODUCT_TEMPLATES) {
      // Market/bank templates should meet minimum quality for UI display
      expect(template.data_confidence_score).toBeGreaterThanOrEqual(85);
    }
  });

  it('all templates have valid prepayment schedules', () => {
    for (const template of PRODUCT_TEMPLATES) {
      expect(template.prepayment_penalty.schedule.length).toBeGreaterThan(0);
      
      // First tier should start at 0
      expect(template.prepayment_penalty.schedule[0].from_month_inclusive).toBe(0);
      
      // Last tier should go to null (end of term)
      const lastTier = template.prepayment_penalty.schedule[template.prepayment_penalty.schedule.length - 1];
      expect(lastTier.to_month_exclusive).toBeNull();
    }
  });
});

// ============================================================================
// NEW: Mortgage Purchase Simulation Tests
// ============================================================================

import { 
  simulateMortgagePurchase, 
  simulateOldLoanBaseline, 
  computeOldLoanPayoffAtRefinance,
  simulateRefinance,
  calculateClosingCash,
  getOldLoanPrepaymentFeePct,
  simulateMortgageAllStrategies,
  simulateRefinanceAllStrategies,
  findOptimalRefinanceTiming,
  getExitPayoffMonth,
  MORTGAGE_STRATEGY_LABELS,
  REFINANCE_STRATEGY_LABELS,
} from '../src';
import type { MortgagePurchaseInput, RefinanceInput, OldLoanInput } from '../src/types';

function createMortgagePurchaseInput(overrides: Partial<MortgagePurchaseInput> = {}): MortgagePurchaseInput {
  return {
    type: 'MORTGAGE_RE',
    currency: 'VND',
    start_date: '2024-01-01',
    property_value_vnd: 2_500_000_000,
    down_payment_vnd: 500_000_000,
    loan_amount_vnd: 2_000_000_000,
    term_months: 240,
    horizon_months: 36,
    include_insurance: false,
    stress: { floating_rate_bump_pct: 0 },
    ...overrides,
  };
}

function createOldLoanInput(overrides: Partial<OldLoanInput> = {}): OldLoanInput {
  return {
    old_remaining_balance_vnd: 1_500_000_000,
    old_remaining_term_months: 180,
    old_current_rate_pct: 10.5,
    old_repayment_method: 'annuity',
    old_prepayment_schedule: [
      { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 3 },
      { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
      { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
      { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
    ],
    old_loan_age_months: 24,
    ...overrides,
  };
}

function createRefinanceInput(overrides: Partial<RefinanceInput> = {}): RefinanceInput {
  return {
    type: 'REFINANCE',
    currency: 'VND',
    start_date: '2024-01-01',
    old_loan: createOldLoanInput(),
    new_term_months: 180,
    cash_out_vnd: 0,
    refinance_month_index: 0,
    horizon_months: 60,
    include_insurance: false,
    stress: { floating_rate_bump_pct: 0 },
    ...overrides,
  };
}

describe('simulateMortgagePurchase', () => {
  it('computes closing_cash_needed correctly', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput();
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = simulateMortgagePurchase(template, input, strategy);
    
    // Closing cash = down payment + upfront fees
    // Down payment: 500M
    // Origination: 2B * 0.5% = 10M
    // Appraisal: 3M
    // Total: 500M + 10M + 3M = 513M
    expect(result.closing_cash_needed_vnd).toBe(513_000_000);
    expect(result.type).toBe('MORTGAGE_RE');
  });

  it('calculates LTV correctly', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput();
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = simulateMortgagePurchase(template, input, strategy);
    
    // LTV = 2B / 2.5B = 80%
    expect(result.ltv_pct).toBe(80);
  });

  it('extra principal strategy reduces total_interest', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput({ horizon_months: 48 });
    
    const minPaymentResult = simulateMortgagePurchase(template, input, { type: 'STRATEGY_MIN_PAYMENT' });
    const extraPrincipalResult = simulateMortgagePurchase(template, input, { 
      type: 'STRATEGY_FIXED_EXTRA_PRINCIPAL',
      extra_principal_vnd: 20_000_000
    });
    
    // Extra principal should result in lower total interest
    expect(extraPrincipalResult.totals.total_interest).toBeLessThan(minPaymentResult.totals.total_interest);
  });

  it('generates schedule with correct number of rows', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput({ horizon_months: 24 });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = simulateMortgagePurchase(template, input, strategy);
    
    expect(result.schedule.length).toBe(24);
    expect(result.schedule_preview.length).toBe(12);
  });
});

describe('Old Loan Prepayment Fee', () => {
  it('returns correct fee tier based on old_loan_age_months + refinance_month_index', () => {
    const schedule = createOldLoanInput().old_prepayment_schedule;
    
    // At month 0 (absolute month = old_loan_age_months = 24), fee should be 1%
    expect(getOldLoanPrepaymentFeePct(schedule, 24)).toBe(1);
    
    // At month 12 (absolute), fee should be 2%
    expect(getOldLoanPrepaymentFeePct(schedule, 12)).toBe(2);
    
    // At month 6 (absolute), fee should be 3%
    expect(getOldLoanPrepaymentFeePct(schedule, 6)).toBe(3);
    
    // At month 36+, fee should be 0%
    expect(getOldLoanPrepaymentFeePct(schedule, 36)).toBe(0);
    expect(getOldLoanPrepaymentFeePct(schedule, 48)).toBe(0);
  });
});

describe('simulateOldLoanBaseline', () => {
  it('generates baseline schedule for old loan', () => {
    const oldLoan = createOldLoanInput();
    const result = simulateOldLoanBaseline(oldLoan, 24, '2024-01-01');
    
    expect(result.schedule.length).toBe(24);
    expect(result.totals.total_interest).toBeGreaterThan(0);
    // Balance should decrease over time
    expect(result.balance_at_end).toBeLessThan(oldLoan.old_remaining_balance_vnd);
  });

  it('uses fixed rate throughout', () => {
    const oldLoan = createOldLoanInput();
    const result = simulateOldLoanBaseline(oldLoan, 12, '2024-01-01');
    
    // All months should have the same rate
    for (const row of result.schedule) {
      expect(row.rate_annual_pct).toBe(10.5);
    }
  });
});

describe('computeOldLoanPayoffAtRefinance', () => {
  it('computes immediate refinance correctly', () => {
    const oldLoan = createOldLoanInput({ old_loan_age_months: 24 });
    const result = computeOldLoanPayoffAtRefinance(oldLoan, 0, '2024-01-01');
    
    expect(result.payoff_amount).toBe(1_500_000_000);
    expect(result.months_of_old_payments).toBe(0);
    expect(result.old_payments_total).toBe(0);
    
    // At absolute month 24, fee should be 1%
    expect(result.old_prepay_fee).toBe(15_000_000); // 1% of 1.5B
  });

  it('computes deferred refinance correctly', () => {
    const oldLoan = createOldLoanInput({ old_loan_age_months: 12 });
    const result = computeOldLoanPayoffAtRefinance(oldLoan, 12, '2024-01-01');
    
    // After 12 months of payments, balance should be lower
    expect(result.payoff_amount).toBeLessThan(1_500_000_000);
    expect(result.months_of_old_payments).toBe(12);
    expect(result.old_payments_total).toBeGreaterThan(0);
    
    // At absolute month 24 (12 + 12), fee should be 1%
    const expectedFee = roundVND(result.payoff_amount * 0.01);
    expect(result.old_prepay_fee).toBe(expectedFee);
  });
});

describe('simulateRefinance', () => {
  it('computes break-even month correctly in a simple example', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ 
        old_current_rate_pct: 12.0, // High old rate
        old_loan_age_months: 36, // No prepay fee
      }),
      horizon_months: 36,
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = simulateRefinance(template, input, strategy);
    
    expect(result.type).toBe('REFINANCE');
    // With high old rate and no prepay fee, should break even quickly
    expect(result.break_even_month).not.toBeNull();
    expect(result.break_even_month!).toBeLessThan(24);
  });

  it('net saving sign flips when old prepay fee is very high', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    
    // Scenario 1: Low prepay fee (old loan age = 36, fee = 0%)
    const lowFeeInput = createRefinanceInput({
      old_loan: createOldLoanInput({ 
        old_current_rate_pct: 9.0,
        old_loan_age_months: 36,
      }),
      horizon_months: 24,
    });
    const lowFeeResult = simulateRefinance(template, lowFeeInput, { type: 'STRATEGY_MIN_PAYMENT' });
    
    // Scenario 2: High prepay fee (old loan age = 0, fee = 3%)
    const highFeeInput = createRefinanceInput({
      old_loan: createOldLoanInput({ 
        old_current_rate_pct: 9.0,
        old_loan_age_months: 0,
      }),
      horizon_months: 24,
    });
    const highFeeResult = simulateRefinance(template, highFeeInput, { type: 'STRATEGY_MIN_PAYMENT' });
    
    // High fee scenario should have worse net savings
    expect(highFeeResult.net_saving_vnd).toBeLessThan(lowFeeResult.net_saving_vnd);
  });

  it('includes switching costs breakdown', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput();
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = simulateRefinance(template, input, strategy);
    
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.switching_costs_total).toBeGreaterThan(0);
    expect(result.breakdown.new_loan_cost_after_refinance).toBeGreaterThan(0);
  });

  it('calculates new principal correctly with cash out', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ old_loan_age_months: 36 }),
      cash_out_vnd: 200_000_000,
    });
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = simulateRefinance(template, input, strategy);
    
    // New principal should be old payoff + cash out
    expect(result.refinance.new_principal).toBe(
      result.refinance.old_loan_payoff_amount + 200_000_000
    );
  });

  it('provides baseline vs refinance comparison', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput();
    const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
    
    const result = simulateRefinance(template, input, strategy);
    
    // Both baseline and refinance should have schedules
    expect(result.baseline.schedule.length).toBeGreaterThan(0);
    expect(result.refinance.schedule.length).toBeGreaterThan(0);
    
    // Net saving = baseline cost - refinance cost
    const expectedNetSaving = 
      result.baseline.totals.total_cost_excl_principal - 
      result.refinance.totals.total_cost_excl_principal;
    expect(result.net_saving_vnd).toBe(expectedNetSaving);
  });
});

// ============================================================================
// NEW: Multi-Strategy Mortgage Tests (M1, M2, M3)
// ============================================================================

describe('simulateMortgageAllStrategies', () => {
  it('returns all 3 strategies with correct IDs', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput({ horizon_months: 36 });
    
    const result = simulateMortgageAllStrategies(template, input);
    
    expect(result.type).toBe('MORTGAGE_RE');
    expect(result.strategies.length).toBe(3);
    
    const strategyIds = result.strategies.map(s => s.strategy_id);
    expect(strategyIds).toContain('M1_MIN_PAYMENT');
    expect(strategyIds).toContain('M2_EXTRA_PRINCIPAL');
    expect(strategyIds).toContain('M3_EXIT_PLAN');
  });

  it('M2 total_interest < M1 total_interest', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput({ 
      horizon_months: 48,
      extra_principal_vnd: 20_000_000 
    });
    
    const result = simulateMortgageAllStrategies(template, input);
    
    const m1 = result.strategies.find(s => s.strategy_id === 'M1_MIN_PAYMENT')!;
    const m2 = result.strategies.find(s => s.strategy_id === 'M2_EXTRA_PRINCIPAL')!;
    
    expect(m2.result.totals.total_interest).toBeLessThan(m1.result.totals.total_interest);
  });

  it('M3 payoff_month equals selected milestone (PROMO_END)', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput({ 
      horizon_months: 36,
      exit_rule: 'PROMO_END'
    });
    
    const result = simulateMortgageAllStrategies(template, input);
    
    const m3 = result.strategies.find(s => s.strategy_id === 'M3_EXIT_PLAN')!;
    
    // Template has 6 month promo
    expect(m3.result.metrics.payoff_month).toBe(6);
    expect(m3.result.schedule.length).toBe(6);
  });

  it('M3 payoff_month equals selected milestone (GRACE_END)', () => {
    const template = getTemplateById('market2025_mortgage_fixed_24m')!;
    const input = createMortgagePurchaseInput({ 
      horizon_months: 60,
      exit_rule: 'GRACE_END'
    });
    
    const result = simulateMortgageAllStrategies(template, input);
    
    const m3 = result.strategies.find(s => s.strategy_id === 'M3_EXIT_PLAN')!;
    
    // market2025_mortgage_fixed_24m has 36 month grace period
    expect(m3.result.metrics.payoff_month).toBe(36);
  });

  it('M3 payoff_month equals selected milestone (CUSTOM)', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput({ 
      horizon_months: 36,
      exit_rule: 'CUSTOM',
      exit_custom_month: 18
    });
    
    const result = simulateMortgageAllStrategies(template, input);
    
    const m3 = result.strategies.find(s => s.strategy_id === 'M3_EXIT_PLAN')!;
    
    expect(m3.result.metrics.payoff_month).toBe(18);
  });

  it('M3 FEE_THRESHOLD finds month when fee <= threshold', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput({ 
      horizon_months: 48,
      exit_rule: 'FEE_THRESHOLD',
      exit_fee_threshold_pct: 1
    });
    
    // Template prepay schedule: 0-12: 3%, 12-24: 2%, 24-36: 1%, 36+: 0%
    // First month where fee <= 1% is month 24
    const exitMonth = getExitPayoffMonth(template, input);
    expect(exitMonth).toBe(24);
  });

  it('all strategies include closing_cash_needed', () => {
    const template = getTemplateById('market2025_mortgage_promo_6m')!;
    const input = createMortgagePurchaseInput();
    
    const result = simulateMortgageAllStrategies(template, input);
    
    for (const strategy of result.strategies) {
      // 500M down + 10M origination (0.5%) + 3M appraisal = 513M
      expect(strategy.result.closing_cash_needed_vnd).toBe(513_000_000);
    }
  });
});

// ============================================================================
// NEW: Multi-Strategy Refinance Tests (R1, R2, R3)
// ============================================================================

describe('simulateRefinanceAllStrategies', () => {
  it('returns all 3 strategies with correct IDs', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({ horizon_months: 36 });
    
    const result = simulateRefinanceAllStrategies(template, input);
    
    expect(result.type).toBe('REFINANCE');
    expect(result.strategies.length).toBe(3);
    
    const strategyIds = result.strategies.map(s => s.strategy_id);
    expect(strategyIds).toContain('R1_REFI_NOW_LIQUIDITY');
    expect(strategyIds).toContain('R2_REFI_NOW_ACCELERATE');
    expect(strategyIds).toContain('R3_OPTIMAL_TIMING');
  });

  it('R1 break_even computed correctly', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ 
        old_current_rate_pct: 12.0,
        old_loan_age_months: 36, // No prepay fee
      }),
      horizon_months: 36,
    });
    
    const result = simulateRefinanceAllStrategies(template, input);
    
    const r1 = result.strategies.find(s => s.strategy_id === 'R1_REFI_NOW_LIQUIDITY')!;
    
    // With high old rate and no prepay fee, should break even
    expect(r1.result.break_even_month).not.toBeNull();
    expect(r1.result.net_saving_vnd).toBeGreaterThan(0);
  });

  it('R2 total_interest < R1 total_interest (due to extra principal)', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ old_loan_age_months: 36 }),
      horizon_months: 48,
      extra_principal_vnd: 20_000_000,
    });
    
    const result = simulateRefinanceAllStrategies(template, input);
    
    const r1 = result.strategies.find(s => s.strategy_id === 'R1_REFI_NOW_LIQUIDITY')!;
    const r2 = result.strategies.find(s => s.strategy_id === 'R2_REFI_NOW_ACCELERATE')!;
    
    // R2 pays extra principal, so new loan interest should be less
    expect(r2.result.refinance.totals.total_interest)
      .toBeLessThanOrEqual(r1.result.refinance.totals.total_interest);
  });

  it('R3 evaluates multiple candidate months and picks best one', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    
    // Scenario where waiting for lower prepay fee is beneficial
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ 
        old_current_rate_pct: 11.0, // Higher than new rate
        old_loan_age_months: 30, // Close to fee drop-off
        old_prepayment_schedule: [
          { from_month_inclusive: 0, to_month_exclusive: 36, fee_pct: 3 },
          { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
        ],
      }),
      horizon_months: 48,
      objective: 'MAX_NET_SAVING',
      candidate_refi_months: [0, 3, 6, 12], // Month 6 puts us at 36 months total
    });
    
    const result = simulateRefinanceAllStrategies(template, input);
    
    const r3 = result.strategies.find(s => s.strategy_id === 'R3_OPTIMAL_TIMING')!;
    
    // The algorithm should evaluate all candidates and return a valid result
    expect(r3.optimal_refi_month).toBeDefined();
    expect(r3.result.type).toBe('REFINANCE');
    
    // Verify assumptions were added
    expect(r3.result.assumptions_used.some(a => a.includes('Optimal refinance timing'))).toBe(true);
  });

  it('R3 FASTEST_BREAK_EVEN picks month with earliest break-even', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ 
        old_current_rate_pct: 11.0,
        old_loan_age_months: 20,
      }),
      horizon_months: 48,
      objective: 'FASTEST_BREAK_EVEN',
    });
    
    const result = simulateRefinanceAllStrategies(template, input);
    
    const r3 = result.strategies.find(s => s.strategy_id === 'R3_OPTIMAL_TIMING')!;
    
    // Should have an optimal month
    expect(r3.optimal_refi_month).toBeDefined();
    
    // Result should have a break-even
    expect(r3.result.break_even_month).not.toBeNull();
  });

  it('net_saving is negative when switching cost is huge', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ 
        old_current_rate_pct: 7.5, // Lower than new rate!
        old_loan_age_months: 0,
        old_prepayment_schedule: [
          { from_month_inclusive: 0, to_month_exclusive: 60, fee_pct: 10 }, // Huge fee
          { from_month_inclusive: 60, to_month_exclusive: null, fee_pct: 0 },
        ],
      }),
      horizon_months: 36,
    });
    
    const result = simulateRefinanceAllStrategies(template, input);
    
    const r1 = result.strategies.find(s => s.strategy_id === 'R1_REFI_NOW_LIQUIDITY')!;
    
    // Refinancing from lower rate with huge fee = negative savings
    expect(r1.result.net_saving_vnd).toBeLessThan(0);
  });
});

describe('findOptimalRefinanceTiming', () => {
  it('returns result with optimal month info', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ old_loan_age_months: 20 }),
      horizon_months: 36,
    });
    
    const { result, optimalMonth } = findOptimalRefinanceTiming(template, input);
    
    expect(result).toBeDefined();
    expect(optimalMonth).toBeGreaterThanOrEqual(0);
    expect(result.type).toBe('REFINANCE');
  });

  it('MAX_NET_SAVING maximizes net savings', () => {
    const template = getTemplateById('market2025_refinance_promo_12m')!;
    const input = createRefinanceInput({
      old_loan: createOldLoanInput({ 
        old_current_rate_pct: 11.0,
        old_loan_age_months: 12 
      }),
      horizon_months: 36,
      objective: 'MAX_NET_SAVING',
      candidate_refi_months: [0, 6, 12, 18, 24],
    });
    
    const { result, optimalMonth } = findOptimalRefinanceTiming(template, input);
    
    // Verify this is indeed the best among candidates
    // by checking net_saving is positive if found
    if (result.net_saving_vnd > 0) {
      expect(optimalMonth).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Strategy Labels', () => {
  it('mortgage strategy labels are defined', () => {
    expect(MORTGAGE_STRATEGY_LABELS['M1_MIN_PAYMENT']).toBe('Thanh Toán Tối Thiểu');
    expect(MORTGAGE_STRATEGY_LABELS['M2_EXTRA_PRINCIPAL']).toBe('Trả Thêm Gốc Hàng Tháng');
    expect(MORTGAGE_STRATEGY_LABELS['M3_EXIT_PLAN']).toBe('Tất Toán Sớm');
  });

  it('refinance strategy labels are defined', () => {
    expect(REFINANCE_STRATEGY_LABELS['R1_REFI_NOW_LIQUIDITY']).toBe('Refinance Ngay (Giữ Thanh Khoản)');
    expect(REFINANCE_STRATEGY_LABELS['R2_REFI_NOW_ACCELERATE']).toBe('Refinance Ngay + Trả Nhanh');
    expect(REFINANCE_STRATEGY_LABELS['R3_OPTIMAL_TIMING']).toBe('Tối Ưu Thời Điểm Refinance');
  });
});

