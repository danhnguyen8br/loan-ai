import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getTemplatesByCategory,
  simulateMortgageAllStrategies,
  simulateRefinanceAllStrategies,
  type ProductTemplate,
  type MortgagePurchaseInput,
  type RefinanceInput,
} from '@loan-ai/loan-engine';
import { getCuratedOffers, type CuratedOffer } from '@/data/simulator-curated-offers';

// =============================================================================
// Schemas for NEW Flow
// =============================================================================

// Mortgage strategy
const MortgageStrategySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PAY_OFF_FAST'),
    monthly_income_vnd: z.number().positive(),
    existing_debt_monthly_vnd: z.number().nonnegative().default(0),
  }),
  z.object({
    type: z.literal('LOW_MONTHLY_SETTLE_LATER'),
    settle_after_years: z.number().int().min(1).max(30),
  }),
]);

// Mortgage needs + strategy (new format)
const MortgageNeedsStrategySchema = z.object({
  mode: z.literal('MORTGAGE_RE'),
  loan_amount_vnd: z.number().positive(),
  min_property_value_vnd: z.number().positive(),
  required_down_payment_vnd: z.number().nonnegative(),
  strategy: MortgageStrategySchema,
});

// Refinance needs + strategy (new format)
const RefinanceNeedsStrategySchema = z.object({
  mode: z.literal('REFINANCE'),
  remaining_balance_vnd: z.number().positive(),
  current_rate_pct: z.number().positive(),
  remaining_months: z.number().int().positive(),
  old_prepay_fee_pct: z.number().nonnegative().default(2), // Direct prepayment fee %
  hold_duration_months: z.union([z.literal(12), z.literal(24), z.literal(36), z.literal(60)]),
  priority: z.enum(['REDUCE_PAYMENT', 'MAX_TOTAL_SAVINGS']),
  plan_early_settle: z.boolean(),
});

const NewRecommendRequestSchema = z.discriminatedUnion('mode', [
  MortgageNeedsStrategySchema,
  RefinanceNeedsStrategySchema,
]);

export type RecommendRequest = z.infer<typeof NewRecommendRequestSchema>;

// =============================================================================
// Response types
// =============================================================================

export interface ScheduleRowResponse {
  month: number;
  date: string;
  rate_annual_pct: number;
  balance_start: number;
  interest: number;
  principal_scheduled: number;
  extra_principal: number;
  fees: number;
  insurance: number;
  payment_total: number;
  balance_end: number;
  prepayment_penalty: number;
  is_payoff_month: boolean;
}

export interface RecommendedPackage {
  templateId: string;
  templateName: string;
  termMonths: number;
  strategyId: string;
  strategyLabel: string;
  // Key metrics
  totalCost: number;
  totalInterest: number;
  totalFees: number;
  totalInsurance: number;
  /**
   * NOTE:
   * - For standard strategies, this is the max payment across the schedule.
   * - For EXIT_PLAN, loan-engine's max_monthly_payment includes the lump-sum payoff month.
   *   Use regularMonthlyPaymentMax/Avg to represent "khoản trả hàng tháng" before payoff.
   */
  maxMonthlyPayment: number;
  avgFirst12MonthsPayment: number;
  promoEndMonth: number;
  promoRatePct?: number;
  gracePrincipalMonths: number;
  payoffMonth?: number;
  breakEvenMonth?: number;
  netSavingVnd?: number;
  // Refinance: total switching costs (old prepay fee + new loan upfront fees)
  switchingCostsTotal?: number;
  // Payment details for display (mortgage)
  firstMonthPayment?: number;
  regularMonthlyPaymentMax?: number;
  regularMonthlyPaymentAvg?: number;
  // For PAY_OFF_FAST: debt-to-income actual includes existing monthly debt
  dtiActual?: number; // 0..1
  // For LOW_MONTHLY_SETTLE_LATER: settlement summary at exit month
  exitSummary?: {
    exitMonth: number;
    remainingBalance: number;
    prepaymentPenalty: number;
    totalSettlement: number;
  };
  // 3-bullet reasons to show on result card
  reasons?: string[];
  // Horizon used for net saving calculation (refinance)
  horizonMonths?: number;
  // Stress test payments
  stressPayments?: {
    base: number;
    plus2: number;
    plus4: number;
  };
  // Base rate used for stressPayments.base (typically "lãi suất sau ưu đãi")
  stressBaseRatePct?: number;
  // Exit fee for new loan (refinance)
  newLoanExitFees?: {
    at12Months: number;
    at24Months: number;
    at36Months: number;
  };
  // Schedule data for detailed view
  schedule: ScheduleRowResponse[];
  // For display
  curatedOffer?: CuratedOffer;
}

export interface RecommendResponse {
  category: 'MORTGAGE_RE' | 'REFINANCE';
  best: RecommendedPackage | null;
  alternatives: RecommendedPackage[];
  explanations: string[];
  // Mortgage specific
  recommendedTermMonths?: number;
  recommendedDTI?: number;
  // Refinance specific
  shouldRefinance?: boolean;
  currentMonthlyPayment?: number;
}

// =============================================================================
// Constants
// =============================================================================

const CANDIDATE_TERMS = [60, 120, 180, 240, 300]; // 5, 10, 15, 20, 25 years
// Debt-to-income guidance for mortgage payoff-fast flow (per product spec)
const RECOMMENDED_DTI_LOW = 0.3;  // 30%
const RECOMMENDED_DTI_HIGH = 0.4; // 40%
const DEFAULT_RECOMMENDED_DTI = 0.35; // 35%

// =============================================================================
// Helpers
// =============================================================================

function buildMortgageInput(
  loanAmount: number,
  propertyValue: number,
  downPayment: number,
  termMonths: number,
  exitMonth?: number
): MortgagePurchaseInput {
  const input: MortgagePurchaseInput = {
    type: 'MORTGAGE_RE',
    currency: 'VND',
    start_date: new Date().toISOString().split('T')[0],
    property_value_vnd: propertyValue,
    down_payment_vnd: downPayment,
    loan_amount_vnd: loanAmount,
    term_months: termMonths,
    horizon_months: exitMonth ?? termMonths,
    repayment_method: 'annuity',
    include_insurance: false,
    stress: { floating_rate_bump_pct: 0 },  // Schedule uses base rate; stress scenarios shown separately
  };

  if (exitMonth) {
    input.exit_rule = 'CUSTOM';
    input.exit_custom_month = exitMonth;
  }

  return input;
}

function buildRefinanceInput(
  remainingBalance: number,
  remainingMonths: number,
  currentRate: number,
  oldPrepayFeePct: number,
  termMonths: number,
  horizonMonths: number
): RefinanceInput {
  return {
    type: 'REFINANCE',
    currency: 'VND',
    start_date: new Date().toISOString().split('T')[0],
    old_loan: {
      old_remaining_balance_vnd: remainingBalance,
      old_remaining_term_months: remainingMonths,
      old_current_rate_pct: currentRate,
      old_repayment_method: 'annuity',
      old_loan_age_months: 0, // Not used when direct fee is provided
      old_prepayment_schedule: [
        // Use the direct prepayment fee % provided by user
        { from_month_inclusive: 0, to_month_exclusive: null, fee_pct: oldPrepayFeePct },
      ],
    },
    new_term_months: termMonths,
    refinance_month_index: 0,
    horizon_months: horizonMonths,
    repayment_method: 'annuity',
    include_insurance: false,
    stress: { floating_rate_bump_pct: 0 },  // Schedule uses base rate; stress scenarios shown separately
  };
}

function calculateAvgFirst12Months(schedule: { payment_total: number }[]): number {
  const first12 = schedule.slice(0, 12);
  if (first12.length === 0) return 0;
  const sum = first12.reduce((acc, row) => acc + row.payment_total, 0);
  return sum / first12.length;
}

function calculateCurrentMonthlyPayment(
  remainingBalance: number,
  remainingMonths: number,
  ratePct: number
): number {
  const monthlyRate = ratePct / 100 / 12;
  if (monthlyRate === 0) return remainingBalance / remainingMonths;
  const factor = Math.pow(1 + monthlyRate, remainingMonths);
  return (remainingBalance * monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate stress payments based on ACTUAL schedule payment at post-promo month.
 * - base: actual payment_total from schedule (matches detailed table exactly)
 * - plus2/plus4: base payment adjusted by interest delta when rate increases
 */
function calculateStressPaymentsFromSchedule(
  schedule: { month: number; payment_total: number; interest: number; balance_start: number }[],
  stressStartMonth: number,
  baseRate: number
): { base: number; plus2: number; plus4: number } {
  const row = schedule.find((r) => r.month === stressStartMonth);
  if (!row) {
    // Fallback if row not found
    return { base: 0, plus2: 0, plus4: 0 };
  }

  const basePayment = row.payment_total;
  const baseInterest = row.interest;
  const balance = row.balance_start;

  // Calculate interest at different rates (monthly interest on balance)
  const calcMonthlyInterest = (ratePct: number) => {
    return balance * (ratePct / 100 / 12);
  };

  const interestPlus2 = calcMonthlyInterest(baseRate + 2);
  const interestPlus4 = calcMonthlyInterest(baseRate + 4);

  // Adjust payment by interest delta
  return {
    base: basePayment,
    plus2: basePayment - baseInterest + interestPlus2,
    plus4: basePayment - baseInterest + interestPlus4,
  };
}

function getExitFeeAtMonth(template: ProductTemplate, month: number): number {
  const schedule = template.prepayment_penalty.schedule;
  for (const tier of schedule) {
    const toMonth = tier.to_month_exclusive ?? Infinity;
    if (month >= tier.from_month_inclusive && month < toMonth) {
      return tier.fee_pct;
    }
  }
  return 0;
}

function calculateRegularMonthlyPayments(schedule: { payment_total: number; is_payoff_month?: boolean }[]): {
  regularMax: number;
  regularAvg: number;
} {
  const regularRows = schedule.filter((r) => !r.is_payoff_month);
  if (regularRows.length === 0) return { regularMax: 0, regularAvg: 0 };
  const regularMax = Math.max(...regularRows.map((r) => r.payment_total));
  const regularAvg = regularRows.reduce((sum, r) => sum + r.payment_total, 0) / regularRows.length;
  return { regularMax, regularAvg };
}

function pickMortgageReasons(params: {
  template: ProductTemplate;
  strategyType: 'PAY_OFF_FAST' | 'LOW_MONTHLY_SETTLE_LATER';
  exitMonth?: number;
}): string[] {
  const { template, strategyType, exitMonth } = params;
  const reasons: string[] = [];
  const exitYears = exitMonth ? exitMonth / 12 : undefined;

  const margin = template.rates.floating_margin_pct;
  const hasGracePrincipal = (template.grace.grace_principal_months ?? 0) > 0;

  if (strategyType === 'PAY_OFF_FAST') {
    // 1) Prepayment schedule (early payoff friendly)
    const fee12 = getExitFeeAtMonth(template, 12);
    const fee24 = getExitFeeAtMonth(template, 24);
    const fee36 = getExitFeeAtMonth(template, 36);
    if (fee12 <= 2 || fee24 <= 1 || fee36 <= 1) {
      reasons.push('Phí tất toán sớm thấp/giảm nhanh (phù hợp trả nhanh/đóng sớm).');
    }
    // 2) Floating margin transparency
    reasons.push(`Biên độ lãi thả nổi (margin) thấp và công thức minh bạch, biên độ hiện tại ${margin.toFixed(2)}%.`);
    // 3) Avoid principal grace
    if (!hasGracePrincipal) {
      reasons.push('Không ân hạn gốc (thường giúp trả xong sớm hơn, tránh đội tổng lãi).');
    } else {
      const graceMonths = template.grace.grace_principal_months ?? 0;
      reasons.push(`Lưu ý: Ân hạn gốc ${graceMonths} tháng có thể làm tổng lãi tăng và trả xong chậm hơn.`);
    }
  } else {
    // LOW_MONTHLY_SETTLE_LATER
    if (exitMonth) {
      const exitFee = getExitFeeAtMonth(template, exitMonth);
      reasons.push(
        `Phí tất toán sớm tại mốc ${exitYears ?? 'đã chọn'} năm thấp (tại tháng ${exitMonth}: ${exitFee}% dư nợ).`
      );
    } else {
      reasons.push('Phí tất toán sớm tại mốc tất toán thấp (yếu tố #1 khi bạn dự kiến tất toán).');
    }
    reasons.push('Kỳ hạn dài hơn giúp giảm nghĩa vụ trả hàng tháng trong giai đoạn bạn giữ khoản vay.');
    reasons.push('Ưu đãi lãi suất/phí kèm phù hợp với thời gian bạn giữ để không “ăn” mất lợi ích.');
  }

  return reasons.slice(0, 3);
}

// =============================================================================
// Main Handler
// =============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[recommend] Request body:', JSON.stringify(body));
    
    const parseResult = NewRecommendRequestSchema.safeParse(body);

    if (!parseResult.success) {
      console.log('[recommend] Validation failed:', parseResult.error.errors);
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    console.log('[recommend] Parsed data mode:', data.mode);

    // Get curated templates
    const category = data.mode;
    const curatedOffers = getCuratedOffers(category);
    const templates = getTemplatesByCategory(category);
    console.log('[recommend] Curated offers:', curatedOffers.length, 'Templates:', templates.length);
    
    const curatedTemplateIds = new Set(curatedOffers.map((o) => o.templateId));
    const curatedTemplates = templates.filter((t) => curatedTemplateIds.has(t.id));
    console.log('[recommend] Curated templates:', curatedTemplates.length);

    if (curatedTemplates.length === 0) {
      console.log('[recommend] No templates found for category:', category);
      console.log('[recommend] Template IDs:', templates.map(t => t.id));
      console.log('[recommend] Curated IDs:', [...curatedTemplateIds]);
      return NextResponse.json(
        { error: 'No templates available for this category' },
        { status: 404 }
      );
    }

    if (category === 'MORTGAGE_RE') {
      return handleMortgageRecommendation(
        data as z.infer<typeof MortgageNeedsStrategySchema>,
        curatedTemplates,
        curatedOffers
      );
    } else {
      return handleRefinanceRecommendation(
        data as z.infer<typeof RefinanceNeedsStrategySchema>,
        curatedTemplates,
        curatedOffers
      );
    }
  } catch (error) {
    console.error('Recommendation failed:', error);
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 });
  }
}

// =============================================================================
// Mortgage Recommendation (NEW LOGIC)
// =============================================================================

function handleMortgageRecommendation(
  data: z.infer<typeof MortgageNeedsStrategySchema>,
  templates: ProductTemplate[],
  curatedOffers: CuratedOffer[]
) {
  const {
    loan_amount_vnd,
    min_property_value_vnd,
    required_down_payment_vnd,
    strategy,
  } = data;

  const candidates: RecommendedPackage[] = [];

  // For PAY_OFF_FAST, calculate max affordable payment
  let maxAffordableMortgagePayment: number | undefined;
  let recommendedDTI: number | undefined;

  if (strategy.type === 'PAY_OFF_FAST') {
    // Default recommended debt-to-income = 35% (range 30–40%). Include existing monthly debt.
    const recommendedTotalDebtBudget = strategy.monthly_income_vnd * DEFAULT_RECOMMENDED_DTI;
    maxAffordableMortgagePayment = Math.max(
      0,
      recommendedTotalDebtBudget - (strategy.existing_debt_monthly_vnd ?? 0)
    );
    recommendedDTI = DEFAULT_RECOMMENDED_DTI;
  }

  // Exit month for LOW_MONTHLY_SETTLE_LATER strategy
  const exitMonth = strategy.type === 'LOW_MONTHLY_SETTLE_LATER'
    ? strategy.settle_after_years * 12
    : undefined;

  for (const template of templates) {
    const gracePeriodMonths = template.grace.grace_principal_months;
    const validTerms = CANDIDATE_TERMS.filter(
      (t) =>
        t >= template.term_rules.min_term_months &&
        t <= template.term_rules.max_term_months &&
        t > gracePeriodMonths
    );

    for (const termMonths of validTerms) {
      const input = buildMortgageInput(
        loan_amount_vnd,
        min_property_value_vnd,
        required_down_payment_vnd,
        termMonths,
        exitMonth
      );

      const result = simulateMortgageAllStrategies(template, input);

      // Choose strategy based on user intent
      const strategyId = strategy.type === 'PAY_OFF_FAST' ? 'M1_MIN_PAYMENT' : 'M3_EXIT_PLAN';
      const strategyResult = result.strategies.find((s) => s.strategy_id === strategyId);

      if (!strategyResult) continue;

      // Don't filter here - collect all candidates first, then filter later
      const curatedOffer = curatedOffers.find((o) => o.templateId === template.id);

      // Calculate stress payments (uses actual payment from schedule as base)
      const floatingRate = template.rates.floating_reference_assumption_pct + template.rates.floating_margin_pct;
      const promoEndMonth = template.rates.promo_fixed_months ?? 0;
      const graceEndMonth = template.grace.grace_principal_months ?? 0;
      // Use whichever ends later: promo rate or principal grace period
      const stressStartMonth = Math.min(Math.max(promoEndMonth, graceEndMonth) + 1, termMonths);
      // Stress payments: base = actual payment_total from schedule; +2%/+4% = adjusted by interest delta
      const stressPayments = calculateStressPaymentsFromSchedule(
        strategyResult.result.schedule,
        stressStartMonth,
        floatingRate
      );
      const firstMonthPayment = strategyResult.result.schedule?.[0]?.payment_total ?? undefined;
      const { regularMax, regularAvg } = calculateRegularMonthlyPayments(strategyResult.result.schedule);

      // For EXIT_PLAN: settlement summary at exit month (lump sum)
      let exitSummary: RecommendedPackage['exitSummary'] = undefined;
      if (strategy.type === 'LOW_MONTHLY_SETTLE_LATER' && exitMonth) {
        const exitRow = strategyResult.result.schedule.find((r) => r.month === exitMonth) ??
          strategyResult.result.schedule.find((r) => r.is_payoff_month);
        if (exitRow) {
          const remainingBalance = exitRow.balance_start;
          const prepaymentPenalty = exitRow.prepayment_penalty ?? 0;
          exitSummary = {
            exitMonth,
            remainingBalance,
            prepaymentPenalty,
            totalSettlement: remainingBalance + prepaymentPenalty,
          };
        }
      }

      const reasons = pickMortgageReasons({
        template,
        strategyType: strategy.type,
        exitMonth,
      });

      candidates.push({
        templateId: template.id,
        templateName: template.name,
        termMonths,
        strategyId,
        strategyLabel: strategyResult.strategy_label,
        totalCost: strategyResult.result.totals.total_cost_excl_principal,
        totalInterest: strategyResult.result.totals.total_interest,
        totalFees: strategyResult.result.totals.total_fees,
        totalInsurance: strategyResult.result.totals.total_insurance,
        maxMonthlyPayment: strategyResult.result.metrics.max_monthly_payment,
        avgFirst12MonthsPayment: calculateAvgFirst12Months(strategyResult.result.schedule),
        promoEndMonth: template.rates.promo_fixed_months,
        promoRatePct: template.rates.promo_fixed_rate_pct,
        gracePrincipalMonths: template.grace.grace_principal_months ?? 0,
        payoffMonth: strategyResult.result.metrics.payoff_month ?? undefined,
        firstMonthPayment,
        regularMonthlyPaymentMax: regularMax,
        regularMonthlyPaymentAvg: regularAvg,
        dtiActual:
          strategy.type === 'PAY_OFF_FAST'
            ? (
                (regularMax + (strategy.existing_debt_monthly_vnd ?? 0)) /
                Math.max(strategy.monthly_income_vnd, 1)
              )
            : undefined,
        exitSummary,
        reasons,
        stressPayments,
        stressBaseRatePct: floatingRate,
        schedule: strategyResult.result.schedule,
        curatedOffer,
      });
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({ error: 'No valid loan configurations found' }, { status: 404 });
  }

  // For PAY_OFF_FAST, filter affordable options first
  let validCandidates = candidates;
  let budgetExceeded = false;
  let suggestedBudget: number | undefined;

  if (strategy.type === 'PAY_OFF_FAST' && maxAffordableMortgagePayment !== undefined) {
    // Use stress +2% as the budget check (per spec)
    const affordable = candidates.filter((c) => (c.stressPayments?.plus2 ?? c.regularMonthlyPaymentMax ?? c.maxMonthlyPayment) <= maxAffordableMortgagePayment);
    
    if (affordable.length === 0) {
      // No affordable options - use all candidates but flag budget exceeded
      budgetExceeded = true;
      candidates.sort((a, b) => (a.stressPayments?.plus2 ?? a.regularMonthlyPaymentMax ?? a.maxMonthlyPayment) - (b.stressPayments?.plus2 ?? b.regularMonthlyPaymentMax ?? b.maxMonthlyPayment));
      suggestedBudget = (candidates[0].stressPayments?.plus2 ?? candidates[0].regularMonthlyPaymentMax ?? candidates[0].maxMonthlyPayment);
      validCandidates = candidates;
    } else {
      validCandidates = affordable;
    }
  }

  // Sort based on strategy
  if (strategy.type === 'PAY_OFF_FAST') {
    // When within budget: optimize fastest payoff.
    // When budget is exceeded (no affordable packages): optimize for lowest payment (closest-to-affordable),
    // otherwise we can accidentally pick the shortest term (very high monthly payment / debt-to-income).
    if (budgetExceeded) {
      validCandidates.sort((a, b) => {
        const aStress = a.stressPayments?.plus2 ?? a.regularMonthlyPaymentMax ?? a.maxMonthlyPayment;
        const bStress = b.stressPayments?.plus2 ?? b.regularMonthlyPaymentMax ?? b.maxMonthlyPayment;
        if (aStress !== bStress) return aStress - bStress;
        // Tie-breakers
        if (a.totalCost !== b.totalCost) return a.totalCost - b.totalCost;
        return (a.termMonths ?? 0) - (b.termMonths ?? 0);
      });
    } else {
      // Optimize: (1) smallest payoff_month -> (2) lowest total_cost_excl_principal -> (3) payment stability under stress
      validCandidates.sort((a, b) => {
        const aPayoff = a.payoffMonth ?? a.termMonths;
        const bPayoff = b.payoffMonth ?? b.termMonths;
        if (aPayoff !== bPayoff) return aPayoff - bPayoff;
        if (a.totalCost !== b.totalCost) return a.totalCost - b.totalCost;
        const aStress = a.stressPayments?.plus2 ?? a.regularMonthlyPaymentMax ?? a.maxMonthlyPayment;
        const bStress = b.stressPayments?.plus2 ?? b.regularMonthlyPaymentMax ?? b.maxMonthlyPayment;
        if (aStress !== bStress) return aStress - bStress;
        const aStress4 = a.stressPayments?.plus4 ?? aStress;
        const bStress4 = b.stressPayments?.plus4 ?? bStress;
        return aStress4 - bStress4;
      });
    }
  } else {
    // LOW_MONTHLY_SETTLE_LATER: enforce payoff at H = X*12; optimize:
    // (1) max/avg monthly payment (excluding lump-sum payoff month) -> (2) lowest total cost until H
    validCandidates.sort((a, b) => {
      const aMax = a.regularMonthlyPaymentMax ?? a.maxMonthlyPayment;
      const bMax = b.regularMonthlyPaymentMax ?? b.maxMonthlyPayment;
      if (aMax !== bMax) return aMax - bMax;
      const aAvg = a.regularMonthlyPaymentAvg ?? a.avgFirst12MonthsPayment;
      const bAvg = b.regularMonthlyPaymentAvg ?? b.avgFirst12MonthsPayment;
      if (aAvg !== bAvg) return aAvg - bAvg;
      return a.totalCost - b.totalCost;
    });
  }

  const best = validCandidates[0];
  const alternatives = validCandidates.slice(1, 3);

  // Generate explanations
  const explanations: string[] = [];

  if (budgetExceeded && suggestedBudget) {
    explanations.push(
      `Với thu nhập ${formatVND(strategy.type === 'PAY_OFF_FAST' ? strategy.monthly_income_vnd : 0)}, gói gần nhất cần trả ${formatVND(suggestedBudget)}/tháng.`
    );
  }

  if (strategy.type === 'PAY_OFF_FAST') {
    const totalDebtPayment = (best.regularMonthlyPaymentMax ?? best.maxMonthlyPayment) + (strategy.existing_debt_monthly_vnd ?? 0);
    const dti = (totalDebtPayment / Math.max(strategy.monthly_income_vnd, 1)) * 100;
    explanations.push(`Kỳ hạn đề xuất: ${best.termMonths / 12} năm • Tỷ lệ nợ/thu nhập ~${dti.toFixed(0)}% (khuyến nghị 30–40%, mặc định 35%).`);
    explanations.push(`Tháng trả xong dự kiến: tháng ${best.payoffMonth ?? best.termMonths}.`);
    explanations.push(`Tổng chi phí vay (lãi + phí + bảo hiểm/phạt nếu có): ${formatVND(best.totalCost)}.`);
  } else {
    const exit = best.exitSummary;
    const monthly = best.regularMonthlyPaymentMax ?? best.avgFirst12MonthsPayment;
    const exitYears = strategy.type === 'LOW_MONTHLY_SETTLE_LATER' ? strategy.settle_after_years : undefined;
    explanations.push(`Khoản trả hàng tháng thấp (trong giai đoạn giữ khoản vay): ~${formatVND(monthly)}/tháng.`);
    if (exit) {
      explanations.push(
        `Tất toán ở năm ${exitYears ?? 'đã chọn'}: dư nợ ${formatVND(exit.remainingBalance)} + phí ${formatVND(
          exit.prepaymentPenalty
        )}.`
      );
    }
    explanations.push(
      `Tổng chi phí vay đến năm ${exitYears ?? 'đã chọn'} (lãi + phí + bảo hiểm + phạt): ${formatVND(best.totalCost)}.`
    );
  }

  // If PAY_OFF_FAST debt-to-income is above lender limit, show a clear warning (banks may decline)
  let warningReason: string | undefined;
  if (strategy.type === 'PAY_OFF_FAST') {
    const bestTemplate = templates.find((t) => t.id === best.templateId);
    const maxDTIPct = bestTemplate?.loan_limits?.max_dti_pct ?? 50;
    const totalDebtPayment =
      (best.regularMonthlyPaymentMax ?? best.maxMonthlyPayment) +
      (strategy.existing_debt_monthly_vnd ?? 0);
    const dtiPct = (totalDebtPayment / Math.max(strategy.monthly_income_vnd, 1)) * 100;
    if (dtiPct > maxDTIPct) {
      warningReason = `Lưu ý: Tỷ lệ nợ/thu nhập ~${dtiPct.toFixed(0)}% (đã gồm nợ sẵn) vượt ngưỡng ${maxDTIPct}% của gói — ngân hàng có thể từ chối cho vay.`;
    }
  }

  const responseExplanations =
    best.reasons && best.reasons.length > 0
      ? (warningReason ? [warningReason, ...best.reasons].slice(0, 3) : best.reasons)
      : (warningReason ? [warningReason, ...explanations] : explanations);

  const response: RecommendResponse = {
    category: 'MORTGAGE_RE',
    best,
    alternatives,
    // Prefer showing 3 bullet "reasons" on the card; fall back to explanations if needed
    explanations: responseExplanations,
    recommendedTermMonths: best.termMonths,
    recommendedDTI: strategy.type === 'PAY_OFF_FAST'
      ? DEFAULT_RECOMMENDED_DTI
      : undefined,
  };

  return NextResponse.json(response);
}

// =============================================================================
// Refinance Recommendation (NEW LOGIC)
// =============================================================================

function handleRefinanceRecommendation(
  data: z.infer<typeof RefinanceNeedsStrategySchema>,
  templates: ProductTemplate[],
  curatedOffers: CuratedOffer[]
) {
  const {
    remaining_balance_vnd,
    current_rate_pct,
    remaining_months,
    old_prepay_fee_pct,
    hold_duration_months,
    priority,
    plan_early_settle,
  } = data;

  // Calculate current monthly payment
  const currentMonthlyPayment = calculateCurrentMonthlyPayment(
    remaining_balance_vnd,
    remaining_months,
    current_rate_pct
  );

  const candidates: RecommendedPackage[] = [];

  // Use hold duration as the comparison horizon
  const horizonMonths = hold_duration_months;

  // Also include remaining months for term options
  const candidateTermsWithRemaining = [...new Set([...CANDIDATE_TERMS, remaining_months])].sort(
    (a, b) => a - b
  );

  for (const template of templates) {
    const gracePeriodMonths = template.grace.grace_principal_months;
    const validTerms = candidateTermsWithRemaining.filter(
      (t) =>
        t >= template.term_rules.min_term_months &&
        t <= template.term_rules.max_term_months &&
        t > gracePeriodMonths
    );

    for (const termMonths of validTerms) {
      const input = buildRefinanceInput(
        remaining_balance_vnd,
        remaining_months,
        current_rate_pct,
        old_prepay_fee_pct,
        termMonths,
        horizonMonths
      );

      const result = simulateRefinanceAllStrategies(template, input);

      // Use R1 (refinance now, liquidity) strategy
      const strategyResult = result.strategies.find((s) => s.strategy_id === 'R1_REFI_NOW_LIQUIDITY');
      if (!strategyResult) continue;

      const curatedOffer = curatedOffers.find((o) => o.templateId === template.id);

      // Calculate stress payments for new loan (uses actual payment from schedule as base)
      const floatingRate = template.rates.floating_reference_assumption_pct + template.rates.floating_margin_pct;
      const promoEndMonth = template.rates.promo_fixed_months ?? 0;
      const graceEndMonth = template.grace.grace_principal_months ?? 0;
      // Use whichever ends later: promo rate or principal grace period
      const stressStartMonth = Math.min(Math.max(promoEndMonth, graceEndMonth) + 1, termMonths);
      // Stress payments: base = actual payment_total from schedule; +2%/+4% = adjusted by interest delta
      const stressPayments = calculateStressPaymentsFromSchedule(
        strategyResult.result.refinance.schedule,
        stressStartMonth,
        floatingRate
      );

      // Get exit fees for new loan at different points
      const newLoanExitFees = {
        at12Months: remaining_balance_vnd * (getExitFeeAtMonth(template, 12) / 100),
        at24Months: remaining_balance_vnd * (getExitFeeAtMonth(template, 24) / 100),
        at36Months: remaining_balance_vnd * (getExitFeeAtMonth(template, 36) / 100),
      };

      candidates.push({
        templateId: template.id,
        templateName: template.name,
        termMonths,
        strategyId: 'R1_REFI_NOW_LIQUIDITY',
        strategyLabel: strategyResult.strategy_label,
        totalCost: strategyResult.result.refinance.totals.total_cost_excl_principal,
        totalInterest: strategyResult.result.refinance.totals.total_interest,
        totalFees: strategyResult.result.refinance.totals.total_fees,
        totalInsurance: strategyResult.result.refinance.totals.total_insurance,
        maxMonthlyPayment: strategyResult.result.refinance.metrics.max_monthly_payment,
        avgFirst12MonthsPayment: calculateAvgFirst12Months(strategyResult.result.refinance.schedule),
        promoEndMonth: template.rates.promo_fixed_months,
        promoRatePct: template.rates.promo_fixed_rate_pct,
        gracePrincipalMonths: template.grace.grace_principal_months ?? 0,
        breakEvenMonth: strategyResult.result.break_even_month ?? undefined,
        netSavingVnd: strategyResult.result.net_saving_vnd,
        switchingCostsTotal: strategyResult.result.breakdown?.switching_costs_total,
        horizonMonths,
        stressPayments,
        stressBaseRatePct: floatingRate,
        newLoanExitFees,
        schedule: strategyResult.result.refinance.schedule,
        curatedOffer,
      });
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({ error: 'No valid loan configurations found' }, { status: 404 });
  }

  // Filter: monthly payment must be lower than current (basic requirement)
  let validCandidates = candidates.filter((c) => c.maxMonthlyPayment < currentMonthlyPayment);

  // Filter by positive net saving
  validCandidates = validCandidates.filter(
    (c) => c.netSavingVnd !== undefined && c.netSavingVnd > 0 && c.breakEvenMonth !== undefined
  );

  // Additional filter if user plans to settle early: prefer lower exit fees
  // (Sort will handle this)

  const explanations: string[] = [];
  let shouldRefinance = true;

  if (validCandidates.length === 0) {
    shouldRefinance = false;

    const lowerPaymentOptions = candidates.filter((c) => c.maxMonthlyPayment < currentMonthlyPayment);

    if (lowerPaymentOptions.length === 0) {
      explanations.push(
        `Không có gói vay nào có tiền trả hàng tháng thấp hơn ${formatVND(currentMonthlyPayment)} hiện tại.`
      );
      explanations.push(
        `Với lãi suất ${current_rate_pct}%, chuyển ngân hàng không có lợi.`
      );
    } else {
      explanations.push(`Có gói trả thấp hơn, nhưng thời gian hoàn vốn quá dài.`);
      explanations.push(`Chi phí chuyển đổi cao hơn lợi ích tiết kiệm.`);
    }

    explanations.push(`Khuyến nghị: Giữ khoản vay hiện tại.`);

    candidates.sort((a, b) => a.maxMonthlyPayment - b.maxMonthlyPayment);

    return NextResponse.json({
      category: 'REFINANCE',
      best: null,
      alternatives: candidates.slice(0, 3),
      explanations,
      shouldRefinance: false,
      currentMonthlyPayment,
    } as RecommendResponse);
  }

  // Sort based on priority
  if (priority === 'REDUCE_PAYMENT') {
    // Prioritize lowest monthly payment
    validCandidates.sort((a, b) => {
      const paymentDiff = a.maxMonthlyPayment - b.maxMonthlyPayment;
      if (paymentDiff !== 0) return paymentDiff;

      // Secondary: fastest break-even
      const breakEvenDiff = (a.breakEvenMonth ?? 999) - (b.breakEvenMonth ?? 999);
      if (breakEvenDiff !== 0) return breakEvenDiff;

      // Tertiary: if user plans early settle, prefer lower exit fees
      if (plan_early_settle) {
        const exitFeeDiff = (a.newLoanExitFees?.at24Months ?? 0) - (b.newLoanExitFees?.at24Months ?? 0);
        if (exitFeeDiff !== 0) return exitFeeDiff;
      }

      // When payments are equal, prefer LONGER terms for flexibility
      // (lower payment after promo if user decides to keep longer)
      return b.termMonths - a.termMonths;
    });
  } else {
    // MAX_TOTAL_SAVINGS: prioritize highest net saving
    validCandidates.sort((a, b) => {
      const savingDiff = (b.netSavingVnd ?? 0) - (a.netSavingVnd ?? 0);
      if (savingDiff !== 0) return savingDiff;

      // Secondary: fastest break-even
      const breakEvenDiff = (a.breakEvenMonth ?? 999) - (b.breakEvenMonth ?? 999);
      if (breakEvenDiff !== 0) return breakEvenDiff;

      // Tertiary: if user plans early settle, prefer lower exit fees
      if (plan_early_settle) {
        const exitFeeDiff = (a.newLoanExitFees?.at24Months ?? 0) - (b.newLoanExitFees?.at24Months ?? 0);
        if (exitFeeDiff !== 0) return exitFeeDiff;
      }

      // When savings are equal, prefer LONGER terms for flexibility
      return b.termMonths - a.termMonths;
    });
  }

  const best = validCandidates[0];
  const alternatives = validCandidates.slice(1, 3);

  // Generate explanations
  const monthlySaving = currentMonthlyPayment - best.maxMonthlyPayment;

  explanations.push(
    `Tiền trả hàng tháng giảm ${formatVND(monthlySaving)} (từ ${formatVND(currentMonthlyPayment)} xuống ${formatVND(best.maxMonthlyPayment)}).`
  );

  if (best.breakEvenMonth) {
    explanations.push(`Hoàn vốn chi phí chuyển đổi sau ${best.breakEvenMonth} tháng.`);
  }

  if (best.netSavingVnd) {
    explanations.push(
      `Tổng tiết kiệm trong ${hold_duration_months} tháng: ${formatVND(best.netSavingVnd)}.`
    );
  }

  if (plan_early_settle && best.newLoanExitFees) {
    const exitFee24 = best.newLoanExitFees.at24Months;
    if (exitFee24 > 0) {
      explanations.push(`Phí tất toán sớm (sau 24 tháng): ${formatVND(exitFee24)}.`);
    } else {
      explanations.push(`Không có phí tất toán sớm sau 36 tháng.`);
    }
  }

  return NextResponse.json({
    category: 'REFINANCE',
    best,
    alternatives,
    explanations,
    shouldRefinance: true,
    currentMonthlyPayment,
  } as RecommendResponse);
}

// =============================================================================
// Helper
// =============================================================================

function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} triệu`;
  }
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}
