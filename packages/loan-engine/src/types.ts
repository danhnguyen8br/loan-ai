import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export type ProductCategory = 'MORTGAGE_RE' | 'REFINANCE';
export type RepaymentMethod = 'annuity' | 'equal_principal';
export type PaymentRecalcRule = 'on_rate_reset' | 'keep_payment_constant';
export type InsuranceBasis = 'on_balance' | 'on_property_value';
export type DayCountMode = 'monthly' | 'daily_365';

export type StrategyType = 
  | 'STRATEGY_MIN_PAYMENT'
  | 'STRATEGY_FIXED_EXTRA_PRINCIPAL'
  | 'STRATEGY_EXIT_PLAN';

export type MilestoneType = 
  | 'payoff_at_end_of_promo'
  | 'payoff_at_end_of_grace'
  | 'payoff_when_prepay_fee_hits_threshold';

// Exit rules for M3 strategy
export type ExitRule = 
  | 'PROMO_END'       // Payoff at end of promo period
  | 'GRACE_END'       // Payoff at end of grace period
  | 'FEE_THRESHOLD'   // Payoff when prepay fee <= threshold
  | 'CUSTOM';         // Payoff at custom month

// Refinance objective for R3 strategy
export type RefinanceObjective = 
  | 'MAX_NET_SAVING'      // Maximize net savings over horizon
  | 'FASTEST_BREAK_EVEN'; // Minimize break-even month

// Strategy identifiers for UI/API
export type MortgageStrategyId = 'M1_MIN_PAYMENT' | 'M2_EXTRA_PRINCIPAL' | 'M3_EXIT_PLAN';
export type RefinanceStrategyId = 'R1_REFI_NOW_LIQUIDITY' | 'R2_REFI_NOW_ACCELERATE' | 'R3_OPTIMAL_TIMING';

// ============================================================================
// Product Template Types
// ============================================================================

export interface PrepaymentScheduleItem {
  from_month_inclusive: number;
  to_month_exclusive: number | null; // null means until end
  fee_pct: number;
  fee_min_vnd?: number;
}

export interface ProductTemplate {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  
  // Loan limits
  loan_limits: {
    max_ltv_pct?: number;
    max_dti_pct?: number;
  };
  
  // Term rules
  term_rules: {
    min_term_months: number;
    max_term_months: number;
  };
  
  // Repayment defaults
  repayment_defaults: {
    repayment_method_default: RepaymentMethod;
    payment_recalc_rule: PaymentRecalcRule;
  };
  
  // Grace period
  grace: {
    grace_principal_months: number;
  };
  
  // Rate structure
  rates: {
    promo_fixed_months: number;
    promo_fixed_rate_pct: number;
    floating_reference_assumption_pct: number;
    floating_margin_pct: number;
    reset_frequency_months: number;
  };
  
  // Fees
  fees: {
    origination_fee_pct?: number;
    origination_fee_vnd?: number;
    appraisal_fee_vnd?: number;
    refinance_processing_fee_pct?: number;
    refinance_processing_fee_vnd?: number;
    recurring_monthly_fee_vnd?: number;
    insurance: {
      enabled_default: boolean;
      mandatory: boolean;
      annual_pct?: number;
      annual_vnd?: number;
      basis: InsuranceBasis;
    };
  };
  
  // Prepayment penalty
  prepayment_penalty: {
    schedule: PrepaymentScheduleItem[];
    allow_partial_prepay: boolean;
    partial_prepay_min_vnd?: number;
  };
  
  // Assumptions text
  assumptions: {
    reference_rate_note?: string;
    fee_notes?: string;
  };
  
  data_confidence_score: number;
}

// ============================================================================
// Old Loan Input (For Refinance Scenario)
// ============================================================================

export interface OldPrepaymentTier {
  from_month_inclusive: number;
  to_month_exclusive: number | null;
  fee_pct: number;
  fee_min_vnd?: number;
}

export interface OldLoanInput {
  old_remaining_balance_vnd: number;
  old_remaining_term_months: number;
  old_current_rate_pct: number; // Fixed rate for MVP
  old_repayment_method: RepaymentMethod;
  old_prepayment_schedule: OldPrepaymentTier[];
  old_loan_age_months: number; // How many months already paid
  old_recurring_fees_monthly_vnd?: number;
}

// ============================================================================
// User Input Types (Split by Scenario)
// ============================================================================

export interface StressConfig {
  floating_rate_bump_pct: number; // 0, 2, or 4
}

// Base input shared between scenarios
interface BaseInput {
  currency: 'VND';
  start_date: string; // ISO date string
  horizon_months: number;
  include_insurance: boolean;
  stress: StressConfig;
  repayment_method?: RepaymentMethod; // Override template default
}

// Mortgage Purchase Input
export interface MortgagePurchaseInput extends BaseInput {
  type: 'MORTGAGE_RE';
  property_value_vnd: number;
  down_payment_vnd: number;
  loan_amount_vnd: number; // Typically = property_value - down_payment
  term_months: number;
  
  // Strategy params (optional - used when running specific strategy)
  extra_principal_vnd?: number;           // For M2 strategy
  exit_rule?: ExitRule;                   // For M3 strategy
  exit_fee_threshold_pct?: number;        // For M3 FEE_THRESHOLD (default 0)
  exit_custom_month?: number;             // For M3 CUSTOM
}

// Refinance Input
export interface RefinanceInput extends BaseInput {
  type: 'REFINANCE';
  old_loan: OldLoanInput;
  new_term_months: number;
  cash_out_vnd?: number;
  refinance_month_index: number; // 0 = refinance now, or future month
  
  // Strategy params (optional - used when running specific strategy)
  extra_principal_vnd?: number;           // For R2 strategy
  objective?: RefinanceObjective;         // For R3 strategy (default MAX_NET_SAVING)
  candidate_refi_months?: number[];       // For R3 (default [0..min(36,horizon)])
}

// Legacy UserInput for backward compatibility
export interface UserInput {
  currency: 'VND';
  start_date: string;
  loan_amount_vnd: number;
  term_months: number;
  horizon_months?: number;
  repayment_method?: RepaymentMethod;
  include_insurance: boolean;
  stress: StressConfig;
  
  // Mortgage RE specific (legacy)
  property_value_vnd?: number;
  down_payment_vnd?: number;
  
  // Refinance specific (legacy)
  current_remaining_balance_vnd?: number;
  current_rate_pct?: number;
  remaining_term_months?: number;
  refinance_cashout_vnd?: number;
}

// Union type for simulator input
export type SimulatorInput = MortgagePurchaseInput | RefinanceInput;

// ============================================================================
// Strategy Types
// ============================================================================

export interface StrategyMinPayment {
  type: 'STRATEGY_MIN_PAYMENT';
}

export interface StrategyFixedExtraPrincipal {
  type: 'STRATEGY_FIXED_EXTRA_PRINCIPAL';
  extra_principal_vnd: number;
}

export interface StrategyExitPlan {
  type: 'STRATEGY_EXIT_PLAN';
  // For Mortgage: milestone for payoff
  milestone?: MilestoneType;
  threshold_pct?: number;
  // For Refinance: when to refinance
  refinance_timing?: 'now' | 'after_12m' | 'after_24m' | 'custom';
  custom_refinance_month?: number;
  // Optional: payoff new loan at milestone too
  payoff_new_loan_at_milestone?: boolean;
}

// Legacy support
export interface StrategyMilestonePayoff {
  type: 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE';
  milestone: MilestoneType;
  threshold_pct?: number;
}

export type RepaymentStrategy = 
  | StrategyMinPayment 
  | StrategyFixedExtraPrincipal 
  | StrategyExitPlan
  | StrategyMilestonePayoff;

// ============================================================================
// Schedule Output Types
// ============================================================================

export interface ScheduleRow {
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

export interface ScheduleTotals {
  total_interest: number;
  total_fees_upfront: number;
  total_fees_recurring: number;
  total_fees_prepayment: number;
  total_fees: number;
  total_insurance: number;
  total_cost_excl_principal: number;
  total_out_of_pocket: number;
  actual_term_months: number;
}

export interface SimulationMetrics {
  monthly_payment_initial: number;
  monthly_payment_post_promo: number;
  max_monthly_payment: number;
  payoff_month: number | null;
  total_interest_vnd: number;
  total_fees_vnd: number;
  total_insurance_vnd: number;
  total_cost_excl_principal_vnd: number;
  total_out_of_pocket_vnd: number;
  apr_pct?: number;
}

// ============================================================================
// Mortgage Purchase Result
// ============================================================================

export interface MortgagePurchaseResult {
  type: 'MORTGAGE_RE';
  template_id: string;
  template_name: string;
  strategy: RepaymentStrategy;
  input: MortgagePurchaseInput;
  
  // Key mortgage-specific metrics
  closing_cash_needed_vnd: number;
  ltv_pct: number;
  
  // Schedule and totals
  schedule: ScheduleRow[];
  schedule_preview: ScheduleRow[];
  totals: ScheduleTotals;
  metrics: SimulationMetrics;
  assumptions_used: string[];
}

// ============================================================================
// Refinance Result
// ============================================================================

export interface RefinanceBreakdown {
  old_payments_before_refinance: number;
  old_prepayment_fee: number;
  new_loan_processing_fee: number;
  new_loan_appraisal_fee: number;
  switching_costs_total: number;
  new_loan_cost_after_refinance: number;
}

export interface RefinanceResult {
  type: 'REFINANCE';
  template_id: string;
  template_name: string;
  strategy: RepaymentStrategy;
  input: RefinanceInput;
  
  // Baseline (continue old loan)
  baseline: {
    schedule: ScheduleRow[];
    schedule_preview: ScheduleRow[];
    totals: ScheduleTotals;
    metrics: SimulationMetrics;
  };
  
  // Refinance scenario
  refinance: {
    old_loan_payoff_amount: number;
    new_principal: number;
    schedule: ScheduleRow[];
    schedule_preview: ScheduleRow[];
    totals: ScheduleTotals;
    metrics: SimulationMetrics;
  };
  
  // Comparison metrics
  break_even_month: number | null;
  net_saving_vnd: number;
  breakdown: RefinanceBreakdown;
  assumptions_used: string[];
}

// Union for simulation result
export type SimulationResultUnion = MortgagePurchaseResult | RefinanceResult;

// ============================================================================
// Multi-Strategy Result Types (for running all 3 strategies at once)
// ============================================================================

export interface MortgageStrategyResult {
  strategy_id: MortgageStrategyId;
  strategy_label: string;
  result: MortgagePurchaseResult;
}

export interface RefinanceStrategyResult {
  strategy_id: RefinanceStrategyId;
  strategy_label: string;
  result: RefinanceResult;
  optimal_refi_month?: number; // For R3 only
}

export interface MortgageMultiStrategyResult {
  type: 'MORTGAGE_RE';
  template_id: string;
  template_name: string;
  strategies: MortgageStrategyResult[];
}

export interface RefinanceMultiStrategyResult {
  type: 'REFINANCE';
  template_id: string;
  template_name: string;
  strategies: RefinanceStrategyResult[];
}

// Legacy SimulationResult for backward compatibility
export interface SimulationResult {
  template_id: string;
  template_name: string;
  strategy: RepaymentStrategy;
  user_input: UserInput;
  schedule: ScheduleRow[];
  schedule_preview: ScheduleRow[];
  totals: ScheduleTotals;
  metrics: SimulationMetrics;
  assumptions_used: string[];
}

// ============================================================================
// API Types
// ============================================================================

// Legacy request type
export interface SimulateRequest {
  template_ids: string[];
  user_input: UserInput;
  strategies: RepaymentStrategy[];
}

// New unified request type
export interface SimulateRequestV2 {
  template_ids: string[];
  input: SimulatorInput;
  strategies: RepaymentStrategy[];
}

export interface SimulateResponse {
  results: {
    template_id: string;
    strategy_type: StrategyType;
    result: SimulationResult;
  }[];
}

export interface SimulateResponseV2 {
  results: {
    template_id: string;
    strategy_type: StrategyType;
    result: SimulationResultUnion;
  }[];
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const StressConfigSchema = z.object({
  floating_rate_bump_pct: z.union([z.literal(0), z.literal(2), z.literal(4)]),
});

export const OldPrepaymentTierSchema = z.object({
  from_month_inclusive: z.number().int().min(0),
  to_month_exclusive: z.number().int().min(1).nullable(),
  fee_pct: z.number().min(0),
  fee_min_vnd: z.number().optional(),
});

export const OldLoanInputSchema = z.object({
  old_remaining_balance_vnd: z.number().positive(),
  old_remaining_term_months: z.number().int().positive(),
  old_current_rate_pct: z.number().positive(),
  old_repayment_method: z.enum(['annuity', 'equal_principal']),
  old_prepayment_schedule: z.array(OldPrepaymentTierSchema),
  old_loan_age_months: z.number().int().min(0),
  old_recurring_fees_monthly_vnd: z.number().optional(),
});

export const ExitRuleSchema = z.enum(['PROMO_END', 'GRACE_END', 'FEE_THRESHOLD', 'CUSTOM']);
export const RefinanceObjectiveSchema = z.enum(['MAX_NET_SAVING', 'FASTEST_BREAK_EVEN']);

export const MortgagePurchaseInputSchema = z.object({
  type: z.literal('MORTGAGE_RE'),
  currency: z.literal('VND'),
  start_date: z.string(),
  property_value_vnd: z.number().positive(),
  down_payment_vnd: z.number().nonnegative(),
  loan_amount_vnd: z.number().positive(),
  term_months: z.number().int().min(12).max(360),
  horizon_months: z.number().int().min(1),
  include_insurance: z.boolean(),
  stress: StressConfigSchema,
  repayment_method: z.enum(['annuity', 'equal_principal']).optional(),
  // Strategy params
  extra_principal_vnd: z.number().positive().optional(),
  exit_rule: ExitRuleSchema.optional(),
  exit_fee_threshold_pct: z.number().min(0).max(100).optional(),
  exit_custom_month: z.number().int().min(1).optional(),
});

export const RefinanceInputSchema = z.object({
  type: z.literal('REFINANCE'),
  currency: z.literal('VND'),
  start_date: z.string(),
  old_loan: OldLoanInputSchema,
  new_term_months: z.number().int().min(12).max(360),
  cash_out_vnd: z.number().nonnegative().optional(),
  refinance_month_index: z.number().int().min(0),
  horizon_months: z.number().int().min(1),
  include_insurance: z.boolean(),
  stress: StressConfigSchema,
  repayment_method: z.enum(['annuity', 'equal_principal']).optional(),
  // Strategy params
  extra_principal_vnd: z.number().positive().optional(),
  objective: RefinanceObjectiveSchema.optional(),
  candidate_refi_months: z.array(z.number().int().min(0)).optional(),
});

export const SimulatorInputSchema = z.discriminatedUnion('type', [
  MortgagePurchaseInputSchema,
  RefinanceInputSchema,
]);

// Legacy schemas
export const UserInputSchema = z.object({
  currency: z.literal('VND'),
  start_date: z.string(),
  loan_amount_vnd: z.number().positive(),
  term_months: z.number().int().min(12).max(360),
  horizon_months: z.number().int().min(1).optional(),
  repayment_method: z.enum(['annuity', 'equal_principal']).optional(),
  include_insurance: z.boolean(),
  stress: StressConfigSchema,
  property_value_vnd: z.number().positive().optional(),
  down_payment_vnd: z.number().nonnegative().optional(),
  current_remaining_balance_vnd: z.number().positive().optional(),
  current_rate_pct: z.number().positive().optional(),
  remaining_term_months: z.number().int().positive().optional(),
  refinance_cashout_vnd: z.number().nonnegative().optional(),
});

export const StrategyMinPaymentSchema = z.object({
  type: z.literal('STRATEGY_MIN_PAYMENT'),
});

export const StrategyFixedExtraPrincipalSchema = z.object({
  type: z.literal('STRATEGY_FIXED_EXTRA_PRINCIPAL'),
  extra_principal_vnd: z.number().positive(),
});

export const StrategyExitPlanSchema = z.object({
  type: z.literal('STRATEGY_EXIT_PLAN'),
  milestone: z.enum([
    'payoff_at_end_of_promo',
    'payoff_at_end_of_grace',
    'payoff_when_prepay_fee_hits_threshold',
  ]).optional(),
  threshold_pct: z.number().min(0).max(100).optional(),
  refinance_timing: z.enum(['now', 'after_12m', 'after_24m', 'custom']).optional(),
  custom_refinance_month: z.number().int().min(0).optional(),
  payoff_new_loan_at_milestone: z.boolean().optional(),
});

export const StrategyMilestonePayoffSchema = z.object({
  type: z.literal('STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE'),
  milestone: z.enum([
    'payoff_at_end_of_promo',
    'payoff_at_end_of_grace',
    'payoff_when_prepay_fee_hits_threshold',
  ]),
  threshold_pct: z.number().min(0).max(100).optional(),
});

export const RepaymentStrategySchema = z.union([
  StrategyMinPaymentSchema,
  StrategyFixedExtraPrincipalSchema,
  StrategyExitPlanSchema,
  StrategyMilestonePayoffSchema,
]);

export const SimulateRequestSchema = z.object({
  template_ids: z.array(z.string()).min(1),
  user_input: UserInputSchema,
  strategies: z.array(RepaymentStrategySchema).min(1),
});

export const SimulateRequestV2Schema = z.object({
  template_ids: z.array(z.string()).min(1),
  input: SimulatorInputSchema,
  strategies: z.array(RepaymentStrategySchema).min(1),
});
