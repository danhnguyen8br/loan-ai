import {
  ProductTemplate,
  UserInput,
  RepaymentStrategy,
  ScheduleRow,
  ScheduleTotals,
  SimulationMetrics,
  SimulationResult,
  RepaymentMethod,
  MortgagePurchaseInput,
  RefinanceInput,
  OldLoanInput,
  MortgagePurchaseResult,
  RefinanceResult,
  RefinanceBreakdown,
  StrategyExitPlan,
  MortgageStrategyId,
  RefinanceStrategyId,
  MortgageMultiStrategyResult,
  RefinanceMultiStrategyResult,
  MortgageStrategyResult,
  RefinanceStrategyResult,
  ExitRule,
  RefinanceObjective,
} from './types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Round VND to nearest integer (no decimals in VND)
 */
export function roundVND(amount: number): number {
  return Math.round(amount);
}

/**
 * Add months to a date string, returning ISO date string
 */
export function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

/**
 * Calculate PMT (annuity payment) for a loan
 * @param principal - Loan principal
 * @param monthlyRate - Monthly interest rate (annual/12)
 * @param nMonths - Number of remaining months
 */
export function calculatePMT(principal: number, monthlyRate: number, nMonths: number): number {
  if (monthlyRate === 0) {
    return principal / nMonths;
  }
  const pmt = (principal * monthlyRate * Math.pow(1 + monthlyRate, nMonths)) / 
              (Math.pow(1 + monthlyRate, nMonths) - 1);
  return roundVND(pmt);
}

// ============================================================================
// Rate Timeline Builder
// ============================================================================

export interface RateTimelineEntry {
  month: number;
  annual_rate_pct: number;
}

/**
 * Build rate timeline for the loan term
 */
export function buildRateTimeline(
  template: ProductTemplate,
  stressBumpPct: number,
  horizonMonths: number
): RateTimelineEntry[] {
  const { rates } = template;
  const timeline: RateTimelineEntry[] = [];
  
  for (let month = 1; month <= horizonMonths; month++) {
    let rate: number;
    
    if (month <= rates.promo_fixed_months) {
      // Promo period - fixed rate
      rate = rates.promo_fixed_rate_pct;
    } else {
      // Floating period
      const baseFloating = rates.floating_reference_assumption_pct + rates.floating_margin_pct;
      rate = baseFloating + stressBumpPct;
    }
    
    timeline.push({ month, annual_rate_pct: rate });
  }
  
  return timeline;
}

/**
 * Build rate timeline from legacy UserInput
 */
export function buildRateTimelineLegacy(
  template: ProductTemplate,
  userInput: UserInput
): RateTimelineEntry[] {
  const horizonMonths = userInput.horizon_months ?? Math.min(userInput.term_months, 36);
  return buildRateTimeline(template, userInput.stress.floating_rate_bump_pct, horizonMonths);
}

/**
 * Build fixed rate timeline (for old loan in refinance)
 */
export function buildFixedRateTimeline(
  ratePct: number,
  horizonMonths: number
): RateTimelineEntry[] {
  const timeline: RateTimelineEntry[] = [];
  for (let month = 1; month <= horizonMonths; month++) {
    timeline.push({ month, annual_rate_pct: ratePct });
  }
  return timeline;
}

// ============================================================================
// Prepayment Fee Calculator
// ============================================================================

/**
 * Get prepayment fee percentage for a given month
 */
export function getPrepaymentFeePct(template: ProductTemplate, month: number): number {
  const schedule = template.prepayment_penalty.schedule;
  
  for (const tier of schedule) {
    const from = tier.from_month_inclusive;
    const to = tier.to_month_exclusive ?? Infinity;
    
    if (month >= from && month < to) {
      return tier.fee_pct;
    }
  }
  
  return 0;
}

/**
 * Get prepayment fee from old loan schedule
 */
export function getOldLoanPrepaymentFeePct(
  schedule: OldLoanInput['old_prepayment_schedule'],
  absoluteMonth: number
): number {
  for (const tier of schedule) {
    const from = tier.from_month_inclusive;
    const to = tier.to_month_exclusive ?? Infinity;
    
    if (absoluteMonth >= from && absoluteMonth < to) {
      return tier.fee_pct;
    }
  }
  
  return 0;
}

/**
 * Calculate prepayment fee for a given amount at a given month
 */
export function calculatePrepaymentFee(
  template: ProductTemplate,
  month: number,
  payoffAmount: number
): number {
  const feePct = getPrepaymentFeePct(template, month);
  let fee = roundVND(payoffAmount * (feePct / 100));
  
  const tier = template.prepayment_penalty.schedule.find(
    t => month >= t.from_month_inclusive && 
         month < (t.to_month_exclusive ?? Infinity)
  );
  
  if (tier?.fee_min_vnd && fee < tier.fee_min_vnd) {
    fee = tier.fee_min_vnd;
  }
  
  return fee;
}

/**
 * Calculate old loan prepayment fee
 */
export function calculateOldLoanPrepaymentFee(
  schedule: OldLoanInput['old_prepayment_schedule'],
  absoluteMonth: number,
  payoffAmount: number
): number {
  const feePct = getOldLoanPrepaymentFeePct(schedule, absoluteMonth);
  let fee = roundVND(payoffAmount * (feePct / 100));
  
  const tier = schedule.find(
    t => absoluteMonth >= t.from_month_inclusive && 
         absoluteMonth < (t.to_month_exclusive ?? Infinity)
  );
  
  if (tier?.fee_min_vnd && fee < tier.fee_min_vnd) {
    fee = tier.fee_min_vnd;
  }
  
  return fee;
}

// ============================================================================
// Upfront Fees Calculator
// ============================================================================

export function calculateUpfrontFees(template: ProductTemplate, principal: number): number {
  const { fees } = template;
  let total = 0;
  
  if (fees.origination_fee_pct) {
    total += roundVND(principal * (fees.origination_fee_pct / 100));
  }
  if (fees.origination_fee_vnd) {
    total += fees.origination_fee_vnd;
  }
  
  if (fees.appraisal_fee_vnd) {
    total += fees.appraisal_fee_vnd;
  }
  
  if (fees.refinance_processing_fee_pct) {
    total += roundVND(principal * (fees.refinance_processing_fee_pct / 100));
  }
  if (fees.refinance_processing_fee_vnd) {
    total += fees.refinance_processing_fee_vnd;
  }
  
  return total;
}

/**
 * Calculate mortgage closing cash needed
 */
export function calculateClosingCash(
  template: ProductTemplate,
  input: MortgagePurchaseInput
): number {
  const upfrontFees = calculateUpfrontFees(template, input.loan_amount_vnd);
  return input.down_payment_vnd + upfrontFees;
}

// ============================================================================
// Strategy Helpers
// ============================================================================

/**
 * Determine if strategy triggers payoff at a specific month
 */
export function getMilestonePayoffMonth(
  strategy: RepaymentStrategy,
  template: ProductTemplate
): number | null {
  if (strategy.type === 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE') {
    const { milestone, threshold_pct } = strategy;
    
    switch (milestone) {
      case 'payoff_at_end_of_promo':
        return template.rates.promo_fixed_months || 24;
        
      case 'payoff_at_end_of_grace':
        return template.grace.grace_principal_months || 24;
        
      case 'payoff_when_prepay_fee_hits_threshold': {
        const threshold = threshold_pct ?? 0;
        for (let m = 1; m <= 360; m++) {
          const feePct = getPrepaymentFeePct(template, m);
          if (feePct <= threshold) {
            return m;
          }
        }
        return 24;
      }
    }
  }
  
  if (strategy.type === 'STRATEGY_EXIT_PLAN' && strategy.milestone) {
  const { milestone, threshold_pct } = strategy;
  
  switch (milestone) {
    case 'payoff_at_end_of_promo':
        return template.rates.promo_fixed_months || 24;
      
    case 'payoff_at_end_of_grace':
      return template.grace.grace_principal_months || 24;
      
    case 'payoff_when_prepay_fee_hits_threshold': {
      const threshold = threshold_pct ?? 0;
      for (let m = 1; m <= 360; m++) {
        const feePct = getPrepaymentFeePct(template, m);
        if (feePct <= threshold) {
          return m;
        }
      }
        return 24;
      }
    }
  }
  
  return null;
}

/**
 * Get refinance timing from strategy
 */
export function getRefinanceTimingMonth(strategy: RepaymentStrategy): number {
  if (strategy.type === 'STRATEGY_EXIT_PLAN') {
    const exitStrategy = strategy as StrategyExitPlan;
    switch (exitStrategy.refinance_timing) {
      case 'now':
        return 0;
      case 'after_12m':
        return 12;
      case 'after_24m':
      return 24;
      case 'custom':
        return exitStrategy.custom_refinance_month ?? 0;
      default:
        return 0;
  }
  }
  return 0;
}

/**
 * Get extra principal for a strategy at a given month
 */
export function getExtraPrincipal(
  strategy: RepaymentStrategy,
  template: ProductTemplate,
  month: number,
  remainingBalance: number
): number {
  if (strategy.type !== 'STRATEGY_FIXED_EXTRA_PRINCIPAL') {
    return 0;
  }
  
  let extra = strategy.extra_principal_vnd;
  
  const minPrepay = template.prepayment_penalty.partial_prepay_min_vnd ?? 0;
  if (!template.prepayment_penalty.allow_partial_prepay) {
    return 0;
  }
  
  if (extra < minPrepay && extra < remainingBalance) {
    return 0;
  }
  
  return Math.min(extra, remainingBalance);
}

// ============================================================================
// Core Schedule Generator (Generic)
// ============================================================================

export interface LoanScheduleParams {
  principal_vnd: number;
  term_months: number;
  start_date: string;
  rate_timeline: RateTimelineEntry[];
  repayment_method: RepaymentMethod;
  grace_principal_months: number;
  upfront_fees: number;
  recurring_fee_vnd: number;
  insurance_config: {
    enabled: boolean;
    annual_pct?: number;
    annual_vnd?: number;
    basis: 'on_balance' | 'on_property_value';
    property_value_vnd?: number;
  };
  prepayment_schedule: ProductTemplate['prepayment_penalty']['schedule'];
  allow_partial_prepay: boolean;
  partial_prepay_min_vnd: number;
  strategy: RepaymentStrategy;
  horizon_months: number;
  promo_months: number; // For metrics calculation
}

export interface LoanScheduleResult {
  schedule: ScheduleRow[];
  totals: ScheduleTotals;
  metrics: SimulationMetrics;
}

/**
 * Generate loan amortization schedule with strategy applied
 */
export function simulateLoanSchedule(params: LoanScheduleParams): LoanScheduleResult {
  const {
    principal_vnd,
    term_months,
    start_date,
    rate_timeline,
    repayment_method,
    grace_principal_months,
    upfront_fees,
    recurring_fee_vnd,
    insurance_config,
    prepayment_schedule,
    allow_partial_prepay,
    partial_prepay_min_vnd,
    strategy,
    horizon_months,
    promo_months,
  } = params;

  // Find milestone payoff month if applicable
  const milestonePayoffMonth = getMilestonePayoffMonthFromSchedule(strategy, prepayment_schedule, promo_months, grace_principal_months);

  const schedule: ScheduleRow[] = [];
  let balance = principal_vnd;
  let currentPayment = 0;

  let totalInterest = 0;
  let totalFeesRecurring = 0;
  let totalFeesPrepayment = 0;
  let totalInsurance = 0;
  let totalOutOfPocket = upfront_fees;
  let actualTermMonths = term_months;

  // Calculate effective term after grace period
  const effectiveTermMonths = Math.max(term_months - grace_principal_months, 1);

  for (let month = 1; month <= horizon_months && balance > 0; month++) {
    const rateEntry = rate_timeline.find(r => r.month === month) ?? rate_timeline[rate_timeline.length - 1];
    const annualRate = rateEntry?.annual_rate_pct ?? 8.0;
    const monthlyRate = annualRate / 100 / 12;

    const balanceStart = balance;
    const date = addMonths(start_date, month - 1);

    const interest = roundVND(balanceStart * monthlyRate);

    // Recalculate payment at:
    // 1. Start of loan (month 1)
    // 2. End of promo period (rate reset)
    // 3. End of grace period (when principal payments begin)
    const isRateReset = month === 1 || (month === promo_months + 1);
    const isGraceEnd = month === grace_principal_months + 1;
    
    if (isRateReset || isGraceEnd || currentPayment === 0) {
      // After grace period, calculate PMT for remaining effective months
      const isAfterGrace = month > grace_principal_months;
      let remainingMonths: number;
      
      if (isAfterGrace) {
        // Remaining months after grace = term_months - month + 1
        // But should be at least 1
        remainingMonths = Math.max(term_months - month + 1, 1);
      } else {
        // During grace, calculate based on effective term starting after grace
        remainingMonths = effectiveTermMonths;
      }
      
      if (repayment_method === 'annuity') {
        currentPayment = calculatePMT(balance, monthlyRate, remainingMonths);
      } else {
        currentPayment = 0;
      }
    }

    let principalScheduled: number;
    const isInGracePeriod = month <= grace_principal_months;

    if (isInGracePeriod) {
      principalScheduled = 0;
    } else if (repayment_method === 'equal_principal') {
      const effectiveTermMonths = term_months - grace_principal_months;
      principalScheduled = roundVND(principal_vnd / effectiveTermMonths);
    } else {
      principalScheduled = Math.max(0, currentPayment - interest);
    }

    principalScheduled = Math.min(principalScheduled, balance);

    // Extra principal from strategy
    let extraPrincipal = 0;
    if (strategy.type === 'STRATEGY_FIXED_EXTRA_PRINCIPAL' && allow_partial_prepay) {
      const requested = strategy.extra_principal_vnd;
      const remaining = balance - principalScheduled;
      if (requested >= partial_prepay_min_vnd || requested >= remaining) {
        extraPrincipal = Math.min(requested, remaining);
      }
    }

    // Check for milestone payoff
    let isPayoffMonth = false;
    let prepaymentPenalty = 0;

    if (milestonePayoffMonth && month === milestonePayoffMonth) {
      const remainingAfterScheduled = balance - principalScheduled;
      extraPrincipal = remainingAfterScheduled;
      prepaymentPenalty = calculatePrepaymentFeeFromSchedule(prepayment_schedule, month, remainingAfterScheduled);
      isPayoffMonth = true;
    }

    const totalPrincipalPayment = principalScheduled + extraPrincipal;
    const balanceEnd = roundVND(Math.max(0, balance - totalPrincipalPayment));

    const recurringFee = recurring_fee_vnd;

    let insurance = 0;
    if (insurance_config.enabled) {
      if (insurance_config.annual_pct) {
        const basis = insurance_config.basis === 'on_property_value' && insurance_config.property_value_vnd
          ? insurance_config.property_value_vnd
          : balanceStart;
        insurance = roundVND((insurance_config.annual_pct / 100 / 12) * basis);
      } else if (insurance_config.annual_vnd) {
        insurance = roundVND(insurance_config.annual_vnd / 12);
      }
    }

    const paymentTotal = roundVND(
      interest + principalScheduled + extraPrincipal + recurringFee + insurance + prepaymentPenalty
    );

    totalInterest += interest;
    totalFeesRecurring += recurringFee;
    totalFeesPrepayment += prepaymentPenalty;
    totalInsurance += insurance;
    totalOutOfPocket += paymentTotal;

    schedule.push({
      month,
      date,
      rate_annual_pct: annualRate,
      balance_start: balanceStart,
      interest,
      principal_scheduled: principalScheduled,
      extra_principal: extraPrincipal,
      fees: recurringFee,
      insurance,
      payment_total: paymentTotal,
      balance_end: balanceEnd,
      prepayment_penalty: prepaymentPenalty,
      is_payoff_month: isPayoffMonth,
    });

    balance = balanceEnd;

    if (balance <= 0) {
      actualTermMonths = month;
      break;
    }
  }

  const totals: ScheduleTotals = {
    total_interest: roundVND(totalInterest),
    total_fees_upfront: upfront_fees,
    total_fees_recurring: roundVND(totalFeesRecurring),
    total_fees_prepayment: roundVND(totalFeesPrepayment),
    total_fees: roundVND(upfront_fees + totalFeesRecurring + totalFeesPrepayment),
    total_insurance: roundVND(totalInsurance),
    total_cost_excl_principal: roundVND(totalInterest + upfront_fees + totalFeesRecurring + totalFeesPrepayment + totalInsurance),
    total_out_of_pocket: roundVND(totalOutOfPocket),
    actual_term_months: actualTermMonths,
  };

  const metrics = calculateMetricsFromSchedule(schedule, totals, promo_months, principal_vnd, upfront_fees);

  return { schedule, totals, metrics };
}

function getMilestonePayoffMonthFromSchedule(
  strategy: RepaymentStrategy,
  prepaymentSchedule: ProductTemplate['prepayment_penalty']['schedule'],
  promoMonths: number,
  graceMonths: number
): number | null {
  if (strategy.type === 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE') {
    const { milestone, threshold_pct } = strategy;
    
    switch (milestone) {
      case 'payoff_at_end_of_promo':
        return promoMonths || 24;
        
      case 'payoff_at_end_of_grace':
        return graceMonths || 24;
        
      case 'payoff_when_prepay_fee_hits_threshold': {
        const threshold = threshold_pct ?? 0;
        for (const tier of prepaymentSchedule) {
          if (tier.fee_pct <= threshold) {
            return tier.from_month_inclusive;
          }
        }
        return 24;
      }
    }
  }
  
  if (strategy.type === 'STRATEGY_EXIT_PLAN' && strategy.milestone) {
    const { milestone, threshold_pct } = strategy;
    
    switch (milestone) {
      case 'payoff_at_end_of_promo':
        return promoMonths || 24;
        
      case 'payoff_at_end_of_grace':
        return graceMonths || 24;
        
      case 'payoff_when_prepay_fee_hits_threshold': {
        const threshold = threshold_pct ?? 0;
        for (const tier of prepaymentSchedule) {
          if (tier.fee_pct <= threshold) {
            return tier.from_month_inclusive;
          }
        }
        return 24;
      }
    }
  }
  
  return null;
}

function calculatePrepaymentFeeFromSchedule(
  schedule: ProductTemplate['prepayment_penalty']['schedule'],
  month: number,
  payoffAmount: number
): number {
  let feePct = 0;
  let feeMinVnd: number | undefined;
  
  for (const tier of schedule) {
    const from = tier.from_month_inclusive;
    const to = tier.to_month_exclusive ?? Infinity;
    
    if (month >= from && month < to) {
      feePct = tier.fee_pct;
      feeMinVnd = tier.fee_min_vnd;
      break;
    }
  }
  
  let fee = roundVND(payoffAmount * (feePct / 100));
  if (feeMinVnd && fee < feeMinVnd) {
    fee = feeMinVnd;
  }
  
  return fee;
}

function calculateMetricsFromSchedule(
  schedule: ScheduleRow[],
  totals: ScheduleTotals,
  promoMonths: number,
  principal: number,
  upfrontFees: number
): SimulationMetrics {
  const first3 = schedule.slice(0, 3);
  const monthlyPaymentInitial = first3.length > 0
    ? roundVND(first3.reduce((sum, r) => sum + r.payment_total, 0) / first3.length)
    : 0;

  const postPromo = schedule.slice(promoMonths, promoMonths + 3);
  const monthlyPaymentPostPromo = postPromo.length > 0
    ? roundVND(postPromo.reduce((sum, r) => sum + r.payment_total, 0) / postPromo.length)
    : 0;

  const maxMonthlyPayment = schedule.length > 0
    ? Math.max(...schedule.map(r => r.payment_total))
    : 0;

  const payoffRow = schedule.find(r => r.is_payoff_month || r.balance_end === 0);
  const payoffMonth = payoffRow ? payoffRow.month : null;

  const apr = calculateAPR(schedule, principal, upfrontFees);

  return {
    monthly_payment_initial: monthlyPaymentInitial,
    monthly_payment_post_promo: monthlyPaymentPostPromo,
    max_monthly_payment: maxMonthlyPayment,
    payoff_month: payoffMonth,
    total_interest_vnd: totals.total_interest,
    total_fees_vnd: totals.total_fees,
    total_insurance_vnd: totals.total_insurance,
    total_cost_excl_principal_vnd: totals.total_cost_excl_principal,
    total_out_of_pocket_vnd: totals.total_out_of_pocket,
    apr_pct: apr,
  };
}

// ============================================================================
// Mortgage Purchase Simulation
// ============================================================================

export function simulateMortgagePurchase(
  template: ProductTemplate,
  input: MortgagePurchaseInput,
  strategy: RepaymentStrategy
): MortgagePurchaseResult {
  // Validate LTV
  const ltv = (input.loan_amount_vnd / input.property_value_vnd) * 100;
  const maxLtv = template.loan_limits.max_ltv_pct ?? 80;
  
  const assumptions: string[] = [];
  assumptions.push(`Monthly approximation used (annual_rate/12)`);
  assumptions.push(`Promo period: ${template.rates.promo_fixed_months} months at ${template.rates.promo_fixed_rate_pct}%`);
  assumptions.push(`Floating rate assumption: ${template.rates.floating_reference_assumption_pct}% base + ${template.rates.floating_margin_pct}% margin`);
  
  if (ltv > maxLtv) {
    assumptions.push(`⚠️ LTV ${ltv.toFixed(1)}% exceeds max ${maxLtv}% - loan may not be approved`);
  }
  
  if (input.stress.floating_rate_bump_pct > 0) {
    assumptions.push(`Stress scenario: +${input.stress.floating_rate_bump_pct}% rate bump after promo`);
  }

  const closingCash = calculateClosingCash(template, input);
  const upfrontFees = calculateUpfrontFees(template, input.loan_amount_vnd);
  const rateTimeline = buildRateTimeline(template, input.stress.floating_rate_bump_pct, input.horizon_months);
  const repaymentMethod = input.repayment_method ?? template.repayment_defaults.repayment_method_default;

  const scheduleParams: LoanScheduleParams = {
    principal_vnd: input.loan_amount_vnd,
    term_months: input.term_months,
    start_date: input.start_date,
    rate_timeline: rateTimeline,
    repayment_method: repaymentMethod,
    grace_principal_months: template.grace.grace_principal_months,
    upfront_fees: upfrontFees,
    recurring_fee_vnd: template.fees.recurring_monthly_fee_vnd ?? 0,
    insurance_config: {
      enabled: input.include_insurance && (template.fees.insurance.enabled_default || template.fees.insurance.mandatory),
      annual_pct: template.fees.insurance.annual_pct,
      annual_vnd: template.fees.insurance.annual_vnd,
      basis: template.fees.insurance.basis,
      property_value_vnd: input.property_value_vnd,
    },
    prepayment_schedule: template.prepayment_penalty.schedule,
    allow_partial_prepay: template.prepayment_penalty.allow_partial_prepay,
    partial_prepay_min_vnd: template.prepayment_penalty.partial_prepay_min_vnd ?? 0,
    strategy,
    horizon_months: input.horizon_months,
    promo_months: template.rates.promo_fixed_months,
  };

  const { schedule, totals, metrics } = simulateLoanSchedule(scheduleParams);

  return {
    type: 'MORTGAGE_RE',
    template_id: template.id,
    template_name: template.name,
    strategy,
    input,
    closing_cash_needed_vnd: closingCash,
    ltv_pct: ltv,
    schedule,
    schedule_preview: schedule.slice(0, 12),
    totals,
    metrics,
    assumptions_used: assumptions,
  };
}

// ============================================================================
// Old Loan Baseline Simulation (for Refinance)
// ============================================================================

export interface OldLoanBaselineResult {
  schedule: ScheduleRow[];
  totals: ScheduleTotals;
  metrics: SimulationMetrics;
  balance_at_end: number;
}

export function simulateOldLoanBaseline(
  oldLoan: OldLoanInput,
  horizonMonths: number,
  startDate: string
): OldLoanBaselineResult {
  const rateTimeline = buildFixedRateTimeline(oldLoan.old_current_rate_pct, horizonMonths);
  
  const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
  
  const scheduleParams: LoanScheduleParams = {
    principal_vnd: oldLoan.old_remaining_balance_vnd,
    term_months: oldLoan.old_remaining_term_months,
    start_date: startDate,
    rate_timeline: rateTimeline,
    repayment_method: oldLoan.old_repayment_method,
    grace_principal_months: 0,
    upfront_fees: 0,
    recurring_fee_vnd: oldLoan.old_recurring_fees_monthly_vnd ?? 0,
    insurance_config: { enabled: false, basis: 'on_balance' },
    prepayment_schedule: oldLoan.old_prepayment_schedule,
    allow_partial_prepay: true,
    partial_prepay_min_vnd: 0,
    strategy,
    horizon_months: horizonMonths,
    promo_months: 0,
  };

  const { schedule, totals, metrics } = simulateLoanSchedule(scheduleParams);
  
  const balanceAtEnd = schedule.length > 0 ? schedule[schedule.length - 1].balance_end : oldLoan.old_remaining_balance_vnd;

  return { schedule, totals, metrics, balance_at_end: balanceAtEnd };
}

// ============================================================================
// Old Loan Payoff Calculation
// ============================================================================

export interface OldLoanPayoffResult {
  payoff_amount: number;
  old_prepay_fee: number;
  total_payoff: number;
  months_of_old_payments: number;
  old_payments_total: number;
}

export function computeOldLoanPayoffAtRefinance(
  oldLoan: OldLoanInput,
  refinanceMonthIndex: number,
  startDate: string
): OldLoanPayoffResult {
  if (refinanceMonthIndex === 0) {
    // Refinance immediately
    const absoluteMonth = oldLoan.old_loan_age_months;
    const oldPrepayFee = calculateOldLoanPrepaymentFee(
      oldLoan.old_prepayment_schedule,
      absoluteMonth,
      oldLoan.old_remaining_balance_vnd
    );
    
    return {
      payoff_amount: oldLoan.old_remaining_balance_vnd,
      old_prepay_fee: oldPrepayFee,
      total_payoff: oldLoan.old_remaining_balance_vnd + oldPrepayFee,
      months_of_old_payments: 0,
      old_payments_total: 0,
    };
  }
  
  // Simulate old loan until refinance month
  const baseline = simulateOldLoanBaseline(oldLoan, refinanceMonthIndex, startDate);
  const balanceAtRefinance = baseline.balance_at_end;
  
  const absoluteMonth = oldLoan.old_loan_age_months + refinanceMonthIndex;
  const oldPrepayFee = calculateOldLoanPrepaymentFee(
    oldLoan.old_prepayment_schedule,
    absoluteMonth,
    balanceAtRefinance
  );
  
  const oldPaymentsTotal = baseline.schedule.reduce((sum, r) => sum + r.payment_total, 0);
  
  return {
    payoff_amount: balanceAtRefinance,
    old_prepay_fee: oldPrepayFee,
    total_payoff: balanceAtRefinance + oldPrepayFee,
    months_of_old_payments: refinanceMonthIndex,
    old_payments_total: oldPaymentsTotal,
  };
}

// ============================================================================
// Refinance Simulation
// ============================================================================

export function simulateRefinance(
  template: ProductTemplate,
  input: RefinanceInput,
  strategy: RepaymentStrategy
): RefinanceResult {
  const assumptions: string[] = [];
  assumptions.push(`Monthly approximation used (annual_rate/12)`);
  
  // Get refinance timing from strategy or input
  let refinanceMonthIndex = input.refinance_month_index;
  if (strategy.type === 'STRATEGY_EXIT_PLAN' && strategy.refinance_timing) {
    refinanceMonthIndex = getRefinanceTimingMonth(strategy);
  }
  
  // Step A: Calculate baseline (continue old loan for entire horizon)
  const baseline = simulateOldLoanBaseline(input.old_loan, input.horizon_months, input.start_date);
  assumptions.push(`Old loan rate: ${input.old_loan.old_current_rate_pct}% (fixed for baseline)`);
  
  // Step B: Calculate old loan payoff at refinance point
  const oldPayoff = computeOldLoanPayoffAtRefinance(
    input.old_loan,
    refinanceMonthIndex,
    input.start_date
  );
  assumptions.push(`Refinance at month ${refinanceMonthIndex} (old loan age: ${input.old_loan.old_loan_age_months + refinanceMonthIndex} months)`);
  if (oldPayoff.old_prepay_fee > 0) {
    assumptions.push(`Old loan prepayment fee: ${(oldPayoff.old_prepay_fee / oldPayoff.payoff_amount * 100).toFixed(1)}%`);
  }
  
  // Step C: Calculate new principal
  const cashOut = input.cash_out_vnd ?? 0;
  const newPrincipal = oldPayoff.payoff_amount + cashOut;
  
  // Step D: Calculate new loan fees
  const newLoanUpfrontFees = calculateUpfrontFees(template, newPrincipal);
  const newLoanProcessingFee = template.fees.refinance_processing_fee_pct
    ? roundVND(newPrincipal * (template.fees.refinance_processing_fee_pct / 100))
    : (template.fees.refinance_processing_fee_vnd ?? 0);
  const newLoanAppraisalFee = template.fees.appraisal_fee_vnd ?? 0;
  
  assumptions.push(`New loan promo: ${template.rates.promo_fixed_months} months at ${template.rates.promo_fixed_rate_pct}%`);
  assumptions.push(`New loan floating: ${template.rates.floating_reference_assumption_pct}% base + ${template.rates.floating_margin_pct}% margin`);
  if (input.stress.floating_rate_bump_pct > 0) {
    assumptions.push(`Stress scenario: +${input.stress.floating_rate_bump_pct}% rate bump after promo`);
  }
  
  // Step E: Simulate new loan from refinance point
  const horizonAfterRefinance = input.horizon_months - refinanceMonthIndex;
  const newLoanStartDate = addMonths(input.start_date, refinanceMonthIndex);
  
  const rateTimeline = buildRateTimeline(template, input.stress.floating_rate_bump_pct, horizonAfterRefinance);
  const repaymentMethod = input.repayment_method ?? template.repayment_defaults.repayment_method_default;
  
  // Adjust strategy for new loan
  let newLoanStrategy = strategy;
  if (strategy.type === 'STRATEGY_EXIT_PLAN' && strategy.payoff_new_loan_at_milestone) {
    newLoanStrategy = {
      type: 'STRATEGY_EXIT_PLAN',
      milestone: strategy.milestone,
      threshold_pct: strategy.threshold_pct,
    };
  }
  
  const newLoanParams: LoanScheduleParams = {
    principal_vnd: newPrincipal,
    term_months: input.new_term_months,
    start_date: newLoanStartDate,
    rate_timeline: rateTimeline,
    repayment_method: repaymentMethod,
    grace_principal_months: template.grace.grace_principal_months,
    upfront_fees: newLoanUpfrontFees,
    recurring_fee_vnd: template.fees.recurring_monthly_fee_vnd ?? 0,
    insurance_config: {
      enabled: input.include_insurance && (template.fees.insurance.enabled_default || template.fees.insurance.mandatory),
      annual_pct: template.fees.insurance.annual_pct,
      annual_vnd: template.fees.insurance.annual_vnd,
      basis: template.fees.insurance.basis,
    },
    prepayment_schedule: template.prepayment_penalty.schedule,
    allow_partial_prepay: template.prepayment_penalty.allow_partial_prepay,
    partial_prepay_min_vnd: template.prepayment_penalty.partial_prepay_min_vnd ?? 0,
    strategy: newLoanStrategy,
    horizon_months: horizonAfterRefinance,
    promo_months: template.rates.promo_fixed_months,
  };
  
  const newLoanResult = simulateLoanSchedule(newLoanParams);
  
  // Step F: Calculate switching costs and total refinance cost
  const switchingCosts: RefinanceBreakdown = {
    old_payments_before_refinance: oldPayoff.old_payments_total,
    old_prepayment_fee: oldPayoff.old_prepay_fee,
    new_loan_processing_fee: newLoanProcessingFee,
    new_loan_appraisal_fee: newLoanAppraisalFee,
    switching_costs_total: oldPayoff.old_prepay_fee + newLoanUpfrontFees,
    new_loan_cost_after_refinance: newLoanResult.totals.total_cost_excl_principal,
  };
  
  // Total refinance cost over horizon
  const refinanceTotalCost = 
    oldPayoff.old_payments_total + 
    oldPayoff.old_prepay_fee + 
    newLoanResult.totals.total_cost_excl_principal;
  
  // Step G: Calculate break-even month (including all switching costs)
  const breakEvenMonth = calculateBreakEvenMonth(
    baseline.schedule,
    oldPayoff,
    newLoanResult.schedule,
    refinanceMonthIndex,
    newLoanUpfrontFees  // Include upfront fees for new loan
  );
  
  // Step H: Net savings
  const netSaving = baseline.totals.total_cost_excl_principal - refinanceTotalCost;
  
  if (netSaving > 0) {
    assumptions.push(`Net savings: ${(netSaving / 1_000_000).toFixed(1)}M VND over ${input.horizon_months} months`);
  } else {
    assumptions.push(`⚠️ Refinance costs more: ${(Math.abs(netSaving) / 1_000_000).toFixed(1)}M VND extra`);
  }
  
  if (breakEvenMonth !== null) {
    assumptions.push(`Break-even at month ${breakEvenMonth}`);
  } else {
    assumptions.push(`No break-even within horizon`);
  }
  
  return {
    type: 'REFINANCE',
    template_id: template.id,
    template_name: template.name,
    strategy,
    input,
    baseline: {
      schedule: baseline.schedule,
      schedule_preview: baseline.schedule.slice(0, 12),
      totals: baseline.totals,
      metrics: baseline.metrics,
    },
    refinance: {
      old_loan_payoff_amount: oldPayoff.payoff_amount,
      new_principal: newPrincipal,
      schedule: newLoanResult.schedule,
      schedule_preview: newLoanResult.schedule.slice(0, 12),
      totals: {
        ...newLoanResult.totals,
        // Adjust to include old payments + switching costs
        total_cost_excl_principal: refinanceTotalCost,
        total_out_of_pocket: roundVND(
          oldPayoff.old_payments_total + 
          oldPayoff.old_prepay_fee + 
          newLoanUpfrontFees +
          newLoanResult.totals.total_out_of_pocket - newLoanUpfrontFees
        ),
      },
      metrics: newLoanResult.metrics,
    },
    break_even_month: breakEvenMonth,
    net_saving_vnd: netSaving,
    breakdown: switchingCosts,
    assumptions_used: assumptions,
  };
}

function calculateBreakEvenMonth(
  baselineSchedule: ScheduleRow[],
  oldPayoff: OldLoanPayoffResult,
  newLoanSchedule: ScheduleRow[],
  refinanceMonthIndex: number,
  newLoanUpfrontFees: number = 0  // Include upfront fees for new loan in switching cost
): number | null {
  // Build cumulative cost arrays
  let baselineCumCost = 0;
  const baselineCosts: number[] = [];
  
  for (const row of baselineSchedule) {
    const monthCost = row.interest + row.fees + row.insurance;
    baselineCumCost += monthCost;
    baselineCosts.push(baselineCumCost);
  }
  
  // Refinance scenario: old payments + switching costs + new loan costs
  let refinanceCumCost = 0;
  const refinanceCosts: number[] = [];
  
  // Add months before refinance (paying old loan)
  for (let m = 0; m < refinanceMonthIndex && m < baselineSchedule.length; m++) {
    const row = baselineSchedule[m];
    const monthCost = row.interest + row.fees + row.insurance;
    refinanceCumCost += monthCost;
    refinanceCosts.push(refinanceCumCost);
  }
  
  // Add switching costs at refinance point (old prepay fee + new loan upfront fees)
  refinanceCumCost += oldPayoff.old_prepay_fee + newLoanUpfrontFees;
  
  // Add new loan costs
  for (const row of newLoanSchedule) {
    const monthCost = row.interest + row.fees + row.insurance;
    refinanceCumCost += monthCost;
    refinanceCosts.push(refinanceCumCost);
  }
  
  // Find break-even point
  const totalMonths = Math.min(baselineCosts.length, refinanceCosts.length);
  for (let m = 0; m < totalMonths; m++) {
    if (refinanceCosts[m] <= baselineCosts[m]) {
      return m + 1; // 1-indexed month
    }
  }
  
  return null;
}

// ============================================================================
// Legacy Schedule Generator (Backward Compatibility)
// ============================================================================

/**
 * Generate full amortization schedule with strategy applied (Legacy API)
 */
export function generateSchedule(
  template: ProductTemplate,
  userInput: UserInput,
  strategy: RepaymentStrategy
): SimulationResult {
  const principal = userInput.loan_amount_vnd;
  const termMonths = userInput.term_months;
  const horizonMonths = userInput.horizon_months ?? Math.min(termMonths, 36);
  const repaymentMethod: RepaymentMethod = 
    userInput.repayment_method ?? template.repayment_defaults.repayment_method_default;
  const gracePrincipalMonths = template.grace.grace_principal_months;
  const rateTimeline = buildRateTimelineLegacy(template, userInput);
  
  const milestonePayoffMonth = getMilestonePayoffMonth(strategy, template);
  const upfrontFees = calculateUpfrontFees(template, principal);
  
  const schedule: ScheduleRow[] = [];
  let balance = principal;
  let currentPayment = 0;
  
  let totalInterest = 0;
  let totalFeesRecurring = 0;
  let totalFeesPrepayment = 0;
  let totalInsurance = 0;
  let totalOutOfPocket = upfrontFees;
  let actualTermMonths = termMonths;
  
  // Calculate effective term after grace period
  const effectiveTermMonths = Math.max(termMonths - gracePrincipalMonths, 1);
  
  const assumptions: string[] = [];
  assumptions.push(`Monthly approximation used (annual_rate/12)`);
  assumptions.push(`Promo period: ${template.rates.promo_fixed_months} months at ${template.rates.promo_fixed_rate_pct}%`);
  assumptions.push(`Floating rate assumption: ${template.rates.floating_reference_assumption_pct}% base + ${template.rates.floating_margin_pct}% margin`);
  if (userInput.stress.floating_rate_bump_pct > 0) {
    assumptions.push(`Stress scenario: +${userInput.stress.floating_rate_bump_pct}% rate bump after promo`);
  }
  
  for (let month = 1; month <= horizonMonths && balance > 0; month++) {
    const rateEntry = rateTimeline.find(r => r.month === month) ?? rateTimeline[rateTimeline.length - 1];
    const annualRate = rateEntry.annual_rate_pct;
    const monthlyRate = annualRate / 100 / 12;
    
    const balanceStart = balance;
    const date = addMonths(userInput.start_date, month - 1);
    
    const interest = roundVND(balanceStart * monthlyRate);
    
    const isRateReset = 
      month === 1 ||
      (template.repayment_defaults.payment_recalc_rule === 'on_rate_reset' &&
        (month === template.rates.promo_fixed_months + 1 || 
         (month > template.rates.promo_fixed_months && 
          (month - template.rates.promo_fixed_months - 1) % template.rates.reset_frequency_months === 0)));
    
    // Also recalculate when grace period ends
    const isGraceEnd = month === gracePrincipalMonths + 1;
    
    if (isRateReset || isGraceEnd || currentPayment === 0) {
      // After grace period, calculate PMT for remaining effective months
      const isAfterGrace = month > gracePrincipalMonths;
      let remainingMonths: number;
      
      if (isAfterGrace) {
        remainingMonths = Math.max(termMonths - month + 1, 1);
      } else {
        remainingMonths = effectiveTermMonths;
      }
      
      if (repaymentMethod === 'annuity') {
        currentPayment = calculatePMT(balance, monthlyRate, remainingMonths);
      } else {
        currentPayment = 0;
      }
    }
    
    let principalScheduled: number;
    const isInGracePeriod = month <= gracePrincipalMonths;
    
    if (isInGracePeriod) {
      principalScheduled = 0;
    } else if (repaymentMethod === 'equal_principal') {
      const effectiveTermMonths = termMonths - gracePrincipalMonths;
      principalScheduled = roundVND(principal / effectiveTermMonths);
    } else {
      principalScheduled = Math.max(0, currentPayment - interest);
    }
    
    principalScheduled = Math.min(principalScheduled, balance);
    
    let extraPrincipal = getExtraPrincipal(strategy, template, month, balance - principalScheduled);
    
    let isPayoffMonth = false;
    let prepaymentPenalty = 0;
    
    if (milestonePayoffMonth && month === milestonePayoffMonth) {
      const remainingAfterScheduled = balance - principalScheduled;
      extraPrincipal = remainingAfterScheduled;
      prepaymentPenalty = calculatePrepaymentFee(template, month, remainingAfterScheduled);
      isPayoffMonth = true;
    }
    
    const totalPrincipalPayment = principalScheduled + extraPrincipal;
    const balanceEnd = roundVND(Math.max(0, balance - totalPrincipalPayment));
    
    const recurringFee = template.fees.recurring_monthly_fee_vnd ?? 0;
    
    let insurance = 0;
    if (userInput.include_insurance && 
        (template.fees.insurance.enabled_default || template.fees.insurance.mandatory)) {
      if (template.fees.insurance.annual_pct) {
        const basis = template.fees.insurance.basis === 'on_property_value' && userInput.property_value_vnd
          ? userInput.property_value_vnd
          : balanceStart;
        insurance = roundVND((template.fees.insurance.annual_pct / 100 / 12) * basis);
      } else if (template.fees.insurance.annual_vnd) {
        insurance = roundVND(template.fees.insurance.annual_vnd / 12);
      }
    }
    
    const paymentTotal = roundVND(
      interest + principalScheduled + extraPrincipal + recurringFee + insurance + prepaymentPenalty
    );
    
    totalInterest += interest;
    totalFeesRecurring += recurringFee;
    totalFeesPrepayment += prepaymentPenalty;
    totalInsurance += insurance;
    totalOutOfPocket += paymentTotal;
    
    schedule.push({
      month,
      date,
      rate_annual_pct: annualRate,
      balance_start: balanceStart,
      interest,
      principal_scheduled: principalScheduled,
      extra_principal: extraPrincipal,
      fees: recurringFee,
      insurance,
      payment_total: paymentTotal,
      balance_end: balanceEnd,
      prepayment_penalty: prepaymentPenalty,
      is_payoff_month: isPayoffMonth,
    });
    
    balance = balanceEnd;
    
    if (balance <= 0) {
      actualTermMonths = month;
      break;
    }
  }
  
  const totals: ScheduleTotals = {
    total_interest: roundVND(totalInterest),
    total_fees_upfront: upfrontFees,
    total_fees_recurring: roundVND(totalFeesRecurring),
    total_fees_prepayment: roundVND(totalFeesPrepayment),
    total_fees: roundVND(upfrontFees + totalFeesRecurring + totalFeesPrepayment),
    total_insurance: roundVND(totalInsurance),
    total_cost_excl_principal: roundVND(totalInterest + upfrontFees + totalFeesRecurring + totalFeesPrepayment + totalInsurance),
    total_out_of_pocket: roundVND(totalOutOfPocket),
    actual_term_months: actualTermMonths,
  };
  
  const metrics = calculateMetrics(schedule, totals, template, principal, upfrontFees);
  
  return {
    template_id: template.id,
    template_name: template.name,
    strategy,
    user_input: userInput,
    schedule,
    schedule_preview: schedule.slice(0, 12),
    totals,
    metrics,
    assumptions_used: assumptions,
  };
}

// ============================================================================
// Metrics Calculator
// ============================================================================

function calculateMetrics(
  schedule: ScheduleRow[],
  totals: ScheduleTotals,
  template: ProductTemplate,
  principal: number,
  upfrontFees: number
): SimulationMetrics {
  const first3 = schedule.slice(0, 3);
  const monthlyPaymentInitial = first3.length > 0
    ? roundVND(first3.reduce((sum, r) => sum + r.payment_total, 0) / first3.length)
    : 0;
  
  const promoEnd = template.rates.promo_fixed_months;
  const postPromo = schedule.slice(promoEnd, promoEnd + 3);
  const monthlyPaymentPostPromo = postPromo.length > 0
    ? roundVND(postPromo.reduce((sum, r) => sum + r.payment_total, 0) / postPromo.length)
    : 0;
  
  const maxMonthlyPayment = schedule.length > 0
    ? Math.max(...schedule.map(r => r.payment_total))
    : 0;
  
  const payoffRow = schedule.find(r => r.is_payoff_month || r.balance_end === 0);
  const payoffMonth = payoffRow ? payoffRow.month : null;
  
  const apr = calculateAPR(schedule, principal, upfrontFees);
  
  return {
    monthly_payment_initial: monthlyPaymentInitial,
    monthly_payment_post_promo: monthlyPaymentPostPromo,
    max_monthly_payment: maxMonthlyPayment,
    payoff_month: payoffMonth,
    total_interest_vnd: totals.total_interest,
    total_fees_vnd: totals.total_fees,
    total_insurance_vnd: totals.total_insurance,
    total_cost_excl_principal_vnd: totals.total_cost_excl_principal,
    total_out_of_pocket_vnd: totals.total_out_of_pocket,
    apr_pct: apr,
  };
}

// ============================================================================
// APR/IRR Calculator
// ============================================================================

export function calculateAPR(
  schedule: ScheduleRow[],
  principal: number,
  upfrontFees: number
): number | undefined {
  if (schedule.length === 0) return undefined;
  
  const cashflows: number[] = [principal - upfrontFees];
  
  for (const row of schedule) {
    cashflows.push(-row.payment_total);
  }
  
  const totalPaid = schedule.reduce((sum, r) => sum + r.payment_total, 0) + upfrontFees;
  const totalInterest = schedule.reduce((sum, r) => sum + r.interest, 0);
  const avgBalance = schedule.reduce((sum, r) => sum + r.balance_start, 0) / schedule.length;
  
  if (avgBalance <= 0) return undefined;
  
  const effectiveMonthlyRate = totalInterest / (avgBalance * schedule.length);
  const annualRate = effectiveMonthlyRate * 12 * 100;
  const feeImpact = (upfrontFees / principal) * (12 / schedule.length) * 100;
  
  const apr = annualRate + feeImpact;
  
  if (apr < 0 || apr > 50) {
    const irr = findIRRNewtonRaphson(cashflows);
    if (irr !== null && irr > 0) {
      return Math.round(irr * 12 * 100 * 100) / 100;
    }
    return undefined;
  }
  
  return Math.round(apr * 100) / 100;
}

function findIRRNewtonRaphson(
  cashflows: number[], 
  tolerance: number = 0.0000001, 
  maxIterations: number = 100
): number | null {
  let rate = 0.01;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let t = 0; t < cashflows.length; t++) {
      const discountFactor = Math.pow(1 + rate, t);
      npv += cashflows[t] / discountFactor;
      if (t > 0) {
        dnpv -= t * cashflows[t] / Math.pow(1 + rate, t + 1);
      }
    }
    
    if (Math.abs(npv) < tolerance) {
      return rate;
    }
    
    if (Math.abs(dnpv) < tolerance) {
      break;
    }
    
    const newRate = rate - npv / dnpv;
    
    if (newRate < -0.5 || newRate > 1) {
      break;
    }
    
    rate = newRate;
  }
  
  return findIRRBisection(cashflows, tolerance, maxIterations);
}

function findIRRBisection(
  cashflows: number[], 
  tolerance: number = 0.0000001, 
  maxIterations: number = 100
): number | null {
  let low = 0.0001;
  let high = 0.5;
  
  const npv = (rate: number): number => {
    return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
  };
  
  while (npv(low) < 0 && low > 0.00001) {
    low = low / 2;
  }
  while (npv(high) > 0 && high < 2) {
    high = high * 2;
  }
  
  if (npv(low) * npv(high) > 0) {
    return null;
  }
  
  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const npvMid = npv(mid);
    
    if (Math.abs(npvMid) < tolerance) {
      return mid;
    }
    
    if (npv(low) * npvMid < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return (low + high) / 2;
}

// ============================================================================
// Strategy Labels
// ============================================================================

export const MORTGAGE_STRATEGY_LABELS: Record<MortgageStrategyId, string> = {
  'M1_MIN_PAYMENT': 'Thanh Toán Tối Thiểu',
  'M2_EXTRA_PRINCIPAL': 'Trả Thêm Gốc Hàng Tháng',
  'M3_EXIT_PLAN': 'Tất Toán Sớm',
};

export const REFINANCE_STRATEGY_LABELS: Record<RefinanceStrategyId, string> = {
  'R1_REFI_NOW_LIQUIDITY': 'Refinance Ngay (Giữ Thanh Khoản)',
  'R2_REFI_NOW_ACCELERATE': 'Refinance Ngay + Trả Nhanh',
  'R3_OPTIMAL_TIMING': 'Tối Ưu Thời Điểm Refinance',
};

// ============================================================================
// Exit Month Calculator for M3 Strategy
// ============================================================================

/**
 * Determine the payoff month based on exit rule
 */
export function getExitPayoffMonth(
  template: ProductTemplate,
  input: MortgagePurchaseInput
): number {
  const rule = input.exit_rule ?? 'PROMO_END';
  
  switch (rule) {
    case 'PROMO_END':
      return template.rates.promo_fixed_months || 12;
      
    case 'GRACE_END':
      return template.grace.grace_principal_months || 12;
      
    case 'FEE_THRESHOLD': {
      const threshold = input.exit_fee_threshold_pct ?? 0;
      for (const tier of template.prepayment_penalty.schedule) {
        if (tier.fee_pct <= threshold) {
          return tier.from_month_inclusive;
        }
      }
      // Fallback: find first month with 0 fee
      for (let m = 1; m <= 360; m++) {
        const feePct = getPrepaymentFeePct(template, m);
        if (feePct <= threshold) return m;
      }
      return 24; // Default fallback
    }
    
    case 'CUSTOM':
      return input.exit_custom_month ?? 24;
      
    default:
      return template.rates.promo_fixed_months || 12;
  }
}

// ============================================================================
// Multi-Strategy Mortgage Simulation
// ============================================================================

/**
 * Run all 3 mortgage strategies (M1, M2, M3) for a single template
 */
export function simulateMortgageAllStrategies(
  template: ProductTemplate,
  input: MortgagePurchaseInput
): MortgageMultiStrategyResult {
  const strategies: MortgageStrategyResult[] = [];

  // M1: Min Payment - no extra principal, no early payoff
  const m1Strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
  const m1Result = simulateMortgagePurchase(template, input, m1Strategy);
  strategies.push({
    strategy_id: 'M1_MIN_PAYMENT',
    strategy_label: MORTGAGE_STRATEGY_LABELS['M1_MIN_PAYMENT'],
    result: m1Result,
  });

  // M2: Extra Principal - pay extra each month
  const extraPrincipal = input.extra_principal_vnd ?? roundVND(input.loan_amount_vnd * 0.01); // Default 1% of loan
  const m2Strategy: RepaymentStrategy = { 
    type: 'STRATEGY_FIXED_EXTRA_PRINCIPAL',
    extra_principal_vnd: extraPrincipal,
  };
  const m2Result = simulateMortgagePurchase(template, input, m2Strategy);
  strategies.push({
    strategy_id: 'M2_EXTRA_PRINCIPAL',
    strategy_label: MORTGAGE_STRATEGY_LABELS['M2_EXTRA_PRINCIPAL'],
    result: m2Result,
  });

  // M3: Exit Plan - full payoff at milestone
  const exitMonth = getExitPayoffMonth(template, input);
  const m3Strategy: RepaymentStrategy = {
    type: 'STRATEGY_EXIT_PLAN',
    milestone: 'payoff_at_end_of_promo', // This will be overridden by the exit rule
  };
  
  // Create input with exit rule applied
  const m3Input: MortgagePurchaseInput = {
    ...input,
    exit_rule: input.exit_rule ?? 'PROMO_END',
  };
  const m3Result = simulateMortgagePurchaseWithExit(template, m3Input, m3Strategy, exitMonth);
  strategies.push({
    strategy_id: 'M3_EXIT_PLAN',
    strategy_label: MORTGAGE_STRATEGY_LABELS['M3_EXIT_PLAN'],
    result: m3Result,
  });

  return {
    type: 'MORTGAGE_RE',
    template_id: template.id,
    template_name: template.name,
    strategies,
  };
}

/**
 * Simulate mortgage with explicit exit month
 */
function simulateMortgagePurchaseWithExit(
  template: ProductTemplate,
  input: MortgagePurchaseInput,
  strategy: RepaymentStrategy,
  exitMonth: number
): MortgagePurchaseResult {
  // Validate LTV
  const ltv = (input.loan_amount_vnd / input.property_value_vnd) * 100;
  const maxLtv = template.loan_limits.max_ltv_pct ?? 80;
  
  const assumptions: string[] = [];
  assumptions.push(`Monthly approximation used (annual_rate/12)`);
  assumptions.push(`Promo period: ${template.rates.promo_fixed_months} months at ${template.rates.promo_fixed_rate_pct}%`);
  assumptions.push(`Floating rate assumption: ${template.rates.floating_reference_assumption_pct}% base + ${template.rates.floating_margin_pct}% margin`);
  assumptions.push(`Exit plan: Full payoff at month ${exitMonth}`);
  
  if (ltv > maxLtv) {
    assumptions.push(`⚠️ LTV ${ltv.toFixed(1)}% exceeds max ${maxLtv}% - loan may not be approved`);
  }
  
  if (input.stress.floating_rate_bump_pct > 0) {
    assumptions.push(`Stress scenario: +${input.stress.floating_rate_bump_pct}% rate bump after promo`);
  }

  const closingCash = calculateClosingCash(template, input);
  const upfrontFees = calculateUpfrontFees(template, input.loan_amount_vnd);
  const horizonMonths = Math.max(input.horizon_months, exitMonth);
  const rateTimeline = buildRateTimeline(template, input.stress.floating_rate_bump_pct, horizonMonths);
  const repaymentMethod = input.repayment_method ?? template.repayment_defaults.repayment_method_default;

  // Generate schedule with explicit exit at exitMonth
  const schedule: ScheduleRow[] = [];
  let balance = input.loan_amount_vnd;
  let currentPayment = 0;

  let totalInterest = 0;
  let totalFeesRecurring = 0;
  let totalFeesPrepayment = 0;
  let totalInsurance = 0;
  let totalOutOfPocket = upfrontFees;
  let actualTermMonths = input.term_months;

  // Calculate effective term after grace period
  const gracePrincipalMonths = template.grace.grace_principal_months;
  const effectiveTermMonths = Math.max(input.term_months - gracePrincipalMonths, 1);

  for (let month = 1; month <= horizonMonths && balance > 0; month++) {
    const rateEntry = rateTimeline.find(r => r.month === month) ?? rateTimeline[rateTimeline.length - 1];
    const annualRate = rateEntry?.annual_rate_pct ?? 8.0;
    const monthlyRate = annualRate / 100 / 12;

    const balanceStart = balance;
    const date = addMonths(input.start_date, month - 1);
    const interest = roundVND(balanceStart * monthlyRate);

    // Recalculate payment at start, rate reset, or grace period end
    const isRateReset = month === 1 || (month === template.rates.promo_fixed_months + 1);
    const isGraceEnd = month === gracePrincipalMonths + 1;
    
    if (isRateReset || isGraceEnd || currentPayment === 0) {
      const isAfterGrace = month > gracePrincipalMonths;
      let remainingMonths: number;
      
      if (isAfterGrace) {
        remainingMonths = Math.max(input.term_months - month + 1, 1);
      } else {
        remainingMonths = effectiveTermMonths;
      }
      
      if (repaymentMethod === 'annuity') {
        currentPayment = calculatePMT(balance, monthlyRate, remainingMonths);
      }
    }

    let principalScheduled: number;
    const isInGracePeriod = month <= gracePrincipalMonths;

    if (isInGracePeriod) {
      principalScheduled = 0;
    } else if (repaymentMethod === 'equal_principal') {
      const effectivePrincipalMonths = input.term_months - gracePrincipalMonths;
      principalScheduled = roundVND(input.loan_amount_vnd / effectivePrincipalMonths);
    } else {
      principalScheduled = Math.max(0, currentPayment - interest);
    }
    principalScheduled = Math.min(principalScheduled, balance);

    // Check for exit payoff
    let extraPrincipal = 0;
    let isPayoffMonth = false;
    let prepaymentPenalty = 0;

    if (month === exitMonth) {
      const remainingAfterScheduled = balance - principalScheduled;
      extraPrincipal = remainingAfterScheduled;
      prepaymentPenalty = calculatePrepaymentFee(template, month, remainingAfterScheduled);
      isPayoffMonth = true;
    }

    const totalPrincipalPayment = principalScheduled + extraPrincipal;
    const balanceEnd = roundVND(Math.max(0, balance - totalPrincipalPayment));

    const recurringFee = template.fees.recurring_monthly_fee_vnd ?? 0;

    let insurance = 0;
    if (input.include_insurance && (template.fees.insurance.enabled_default || template.fees.insurance.mandatory)) {
      if (template.fees.insurance.annual_pct) {
        const basis = template.fees.insurance.basis === 'on_property_value'
          ? input.property_value_vnd
          : balanceStart;
        insurance = roundVND((template.fees.insurance.annual_pct / 100 / 12) * basis);
      } else if (template.fees.insurance.annual_vnd) {
        insurance = roundVND(template.fees.insurance.annual_vnd / 12);
      }
    }

    const paymentTotal = roundVND(
      interest + principalScheduled + extraPrincipal + recurringFee + insurance + prepaymentPenalty
    );

    totalInterest += interest;
    totalFeesRecurring += recurringFee;
    totalFeesPrepayment += prepaymentPenalty;
    totalInsurance += insurance;
    totalOutOfPocket += paymentTotal;

    schedule.push({
      month,
      date,
      rate_annual_pct: annualRate,
      balance_start: balanceStart,
      interest,
      principal_scheduled: principalScheduled,
      extra_principal: extraPrincipal,
      fees: recurringFee,
      insurance,
      payment_total: paymentTotal,
      balance_end: balanceEnd,
      prepayment_penalty: prepaymentPenalty,
      is_payoff_month: isPayoffMonth,
    });

    balance = balanceEnd;
    if (balance <= 0) {
      actualTermMonths = month;
      break;
    }
  }

  const totals: ScheduleTotals = {
    total_interest: roundVND(totalInterest),
    total_fees_upfront: upfrontFees,
    total_fees_recurring: roundVND(totalFeesRecurring),
    total_fees_prepayment: roundVND(totalFeesPrepayment),
    total_fees: roundVND(upfrontFees + totalFeesRecurring + totalFeesPrepayment),
    total_insurance: roundVND(totalInsurance),
    total_cost_excl_principal: roundVND(totalInterest + upfrontFees + totalFeesRecurring + totalFeesPrepayment + totalInsurance),
    total_out_of_pocket: roundVND(totalOutOfPocket),
    actual_term_months: actualTermMonths,
  };

  const metrics = calculateMetricsFromSchedule(schedule, totals, template.rates.promo_fixed_months, input.loan_amount_vnd, upfrontFees);

  return {
    type: 'MORTGAGE_RE',
    template_id: template.id,
    template_name: template.name,
    strategy,
    input,
    closing_cash_needed_vnd: closingCash,
    ltv_pct: ltv,
    schedule,
    schedule_preview: schedule.slice(0, 12),
    totals,
    metrics,
    assumptions_used: assumptions,
  };
}

// ============================================================================
// Multi-Strategy Refinance Simulation
// ============================================================================

/**
 * Run all 3 refinance strategies (R1, R2, R3) for a single template
 */
export function simulateRefinanceAllStrategies(
  template: ProductTemplate,
  input: RefinanceInput
): RefinanceMultiStrategyResult {
  const strategies: RefinanceStrategyResult[] = [];

  // R1: Refi Now Liquidity - refinance at month 0, no extra principal
  const r1Input: RefinanceInput = { ...input, refinance_month_index: 0 };
  const r1Strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
  const r1Result = simulateRefinance(template, r1Input, r1Strategy);
  strategies.push({
    strategy_id: 'R1_REFI_NOW_LIQUIDITY',
    strategy_label: REFINANCE_STRATEGY_LABELS['R1_REFI_NOW_LIQUIDITY'],
    result: r1Result,
  });

  // R2: Refi Now Accelerate - refinance at month 0 + extra principal
  const extraPrincipal = input.extra_principal_vnd ?? roundVND(input.old_loan.old_remaining_balance_vnd * 0.01);
  const r2Input: RefinanceInput = { ...input, refinance_month_index: 0 };
  const r2Strategy: RepaymentStrategy = { 
    type: 'STRATEGY_FIXED_EXTRA_PRINCIPAL',
    extra_principal_vnd: extraPrincipal,
  };
  const r2Result = simulateRefinance(template, r2Input, r2Strategy);
  strategies.push({
    strategy_id: 'R2_REFI_NOW_ACCELERATE',
    strategy_label: REFINANCE_STRATEGY_LABELS['R2_REFI_NOW_ACCELERATE'],
    result: r2Result,
  });

  // R3: Optimal Timing - find best refinance month
  const { result: r3Result, optimalMonth } = findOptimalRefinanceTiming(template, input);
  strategies.push({
    strategy_id: 'R3_OPTIMAL_TIMING',
    strategy_label: REFINANCE_STRATEGY_LABELS['R3_OPTIMAL_TIMING'],
    result: r3Result,
    optimal_refi_month: optimalMonth,
  });

  return {
    type: 'REFINANCE',
    template_id: template.id,
    template_name: template.name,
    strategies,
  };
}

/**
 * Find optimal refinance timing based on objective
 */
export function findOptimalRefinanceTiming(
  template: ProductTemplate,
  input: RefinanceInput
): { result: RefinanceResult; optimalMonth: number } {
  const objective = input.objective ?? 'MAX_NET_SAVING';
  const horizonMonths = input.horizon_months;
  
  // Default candidate months: 0 to min(36, horizon)
  const candidates = input.candidate_refi_months ?? 
    Array.from({ length: Math.min(37, horizonMonths + 1) }, (_, i) => i);
  
  const strategy: RepaymentStrategy = { type: 'STRATEGY_MIN_PAYMENT' };
  
  let bestResult: RefinanceResult | null = null;
  let bestMonth = 0;
  let bestScore = objective === 'MAX_NET_SAVING' ? -Infinity : Infinity;
  
  for (const m of candidates) {
    if (m >= horizonMonths) continue; // Skip if refinance month >= horizon
    
    const testInput: RefinanceInput = { ...input, refinance_month_index: m };
    const result = simulateRefinance(template, testInput, strategy);
    
    // Skip if no net savings
    if (result.net_saving_vnd <= 0) continue;
    
    if (objective === 'MAX_NET_SAVING') {
      if (result.net_saving_vnd > bestScore) {
        bestScore = result.net_saving_vnd;
        bestResult = result;
        bestMonth = m;
      }
    } else {
      // FASTEST_BREAK_EVEN
      if (result.break_even_month !== null && result.break_even_month < bestScore) {
        bestScore = result.break_even_month;
        bestResult = result;
        bestMonth = m;
      }
    }
  }
  
  // If no good option found, return month 0 result
  if (!bestResult) {
    const fallbackInput: RefinanceInput = { ...input, refinance_month_index: 0 };
    bestResult = simulateRefinance(template, fallbackInput, strategy);
    bestMonth = 0;
  }
  
  // Add optimal timing info to assumptions
  bestResult.assumptions_used.push(`Optimal refinance timing: month ${bestMonth} (${objective})`);
  
  return { result: bestResult, optimalMonth: bestMonth };
}
