'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import type { 
  ProductTemplate, 
  UserInput, 
  RepaymentStrategy,
  TemplatesResponse,
  SimulateResponseData,
  SimulateResponseDataV2,
  SimulateResponseV3,
  SimulateResponseV3Mortgage,
  SimulateResponseV3Refinance,
  MortgagePurchaseInput,
  RefinanceInput,
  OldLoanInput,
  OldPrepaymentTier,
  SimulationResultUnion,
  ExitRule,
  RefinanceObjective,
} from '../simulator-types';
import { OLD_LOAN_PREPAYMENT_PRESETS } from '../simulator-types';

const API_BASE = '/api/simulator';

// Fetch templates
export function useTemplates(category?: 'MORTGAGE_RE' | 'REFINANCE') {
  return useQuery<TemplatesResponse>({
    queryKey: ['templates', category],
    queryFn: async () => {
      const url = category 
        ? `${API_BASE}/templates?category=${category}`
        : `${API_BASE}/templates`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });
}

// Fetch single template
export function useTemplate(id: string) {
  const { data } = useTemplates();
  return data?.templates.find(t => t.id === id);
}

// Run simulation (legacy)
export function useSimulation() {
  return useMutation<SimulateResponseData, Error, {
    template_ids: string[];
    user_input: UserInput;
    strategies: RepaymentStrategy[];
  }>({
    mutationFn: async (request) => {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Simulation failed');
      }
      return res.json();
    },
  });
}

// Run simulation V2 (new typed inputs)
export function useSimulationV2() {
  return useMutation<SimulateResponseDataV2, Error, {
    template_ids: string[];
    input: MortgagePurchaseInput | RefinanceInput;
    strategies: RepaymentStrategy[];
  }>({
    mutationFn: async (request) => {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Simulation failed');
      }
      return res.json();
    },
  });
}

// Run simulation V3 (multi-strategy per template)
export function useSimulationV3() {
  return useMutation<SimulateResponseV3, Error, {
    template_ids: string[];
    input: MortgagePurchaseInput | RefinanceInput;
  }>({
    mutationFn: async (request) => {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Simulation failed');
      }
      return res.json();
    },
  });
}

// Type guards for V3 responses
export function isMortgageResponse(response: SimulateResponseV3): response is SimulateResponseV3Mortgage {
  return response.type === 'MORTGAGE_RE';
}

export function isRefinanceResponse(response: SimulateResponseV3): response is SimulateResponseV3Refinance {
  return response.type === 'REFINANCE';
}

// Helper to build UserInput from form data (legacy)
export function buildUserInput(
  formData: {
    loan_amount_vnd: number;
    term_months: number;
    horizon_months?: number;
    property_value_vnd?: number;
    down_payment_vnd?: number;
    current_remaining_balance_vnd?: number;
    current_rate_pct?: number;
    remaining_term_months?: number;
    refinance_cashout_vnd?: number;
    repayment_method?: 'annuity' | 'equal_principal';
    include_insurance: boolean;
    stress_bump: 0 | 2 | 4;
  }
): UserInput {
  return {
    currency: 'VND',
    start_date: new Date().toISOString().split('T')[0],
    loan_amount_vnd: formData.loan_amount_vnd,
    term_months: formData.term_months,
    horizon_months: formData.horizon_months ?? Math.min(formData.term_months, 36),
    repayment_method: formData.repayment_method,
    include_insurance: formData.include_insurance,
    stress: { floating_rate_bump_pct: formData.stress_bump },
    property_value_vnd: formData.property_value_vnd,
    down_payment_vnd: formData.down_payment_vnd,
    current_remaining_balance_vnd: formData.current_remaining_balance_vnd,
    current_rate_pct: formData.current_rate_pct,
    remaining_term_months: formData.remaining_term_months,
    refinance_cashout_vnd: formData.refinance_cashout_vnd,
  };
}

// Helper to build MortgagePurchaseInput
export function buildMortgagePurchaseInput(
  formData: {
    property_value_vnd: number;
    down_payment_vnd: number;
    loan_amount_vnd: number;
    term_months: number;
    repayment_method?: 'annuity' | 'equal_principal';
    include_insurance: boolean;
    stress_bump: 0 | 2 | 4;
    // Strategy params
    extra_principal_vnd?: number;
    exit_rule?: ExitRule;
    exit_fee_threshold_pct?: number;
    exit_custom_month?: number;
  }
): MortgagePurchaseInput {
  return {
    type: 'MORTGAGE_RE',
    currency: 'VND',
    start_date: new Date().toISOString().split('T')[0],
    property_value_vnd: formData.property_value_vnd,
    down_payment_vnd: formData.down_payment_vnd,
    loan_amount_vnd: formData.loan_amount_vnd,
    term_months: formData.term_months,
    // Simulate until end of loan term by default
    horizon_months: formData.term_months,
    repayment_method: formData.repayment_method,
    include_insurance: formData.include_insurance,
    stress: { floating_rate_bump_pct: formData.stress_bump },
    // Strategy params for M2 and M3
    extra_principal_vnd: formData.extra_principal_vnd,
    exit_rule: formData.exit_rule,
    exit_fee_threshold_pct: formData.exit_fee_threshold_pct,
    exit_custom_month: formData.exit_custom_month,
  };
}

// Helper to build RefinanceInput
export function buildRefinanceInput(
  formData: {
    old_remaining_balance_vnd: number;
    old_remaining_term_months: number;
    old_current_rate_pct: number;
    old_repayment_method: 'annuity' | 'equal_principal';
    old_loan_age_months: number;
    old_prepayment_schedule_preset: string;
    old_prepayment_custom?: OldPrepaymentTier[];
    old_recurring_fees_monthly_vnd?: number;
    new_term_months: number;
    cash_out_vnd?: number;
    refinance_month_index: number;
    repayment_method?: 'annuity' | 'equal_principal';
    include_insurance: boolean;
    stress_bump: 0 | 2 | 4;
    // Strategy params
    extra_principal_vnd?: number;
    objective?: RefinanceObjective;
  }
): RefinanceInput {
  // Get prepayment schedule from preset or custom
  let prepaymentSchedule: OldPrepaymentTier[];
  if (formData.old_prepayment_schedule_preset === 'custom' && formData.old_prepayment_custom) {
    prepaymentSchedule = formData.old_prepayment_custom;
  } else {
    prepaymentSchedule = OLD_LOAN_PREPAYMENT_PRESETS[formData.old_prepayment_schedule_preset] || 
                         OLD_LOAN_PREPAYMENT_PRESETS.standard_3_2_1_0;
  }

  const oldLoan: OldLoanInput = {
    old_remaining_balance_vnd: formData.old_remaining_balance_vnd,
    old_remaining_term_months: formData.old_remaining_term_months,
    old_current_rate_pct: formData.old_current_rate_pct,
    old_repayment_method: formData.old_repayment_method,
    old_prepayment_schedule: prepaymentSchedule,
    old_loan_age_months: formData.old_loan_age_months,
    old_recurring_fees_monthly_vnd: formData.old_recurring_fees_monthly_vnd,
  };

  return {
    type: 'REFINANCE',
    currency: 'VND',
    start_date: new Date().toISOString().split('T')[0],
    old_loan: oldLoan,
    new_term_months: formData.new_term_months,
    cash_out_vnd: formData.cash_out_vnd,
    refinance_month_index: formData.refinance_month_index,
    // Simulate until end of new loan term by default
    horizon_months: formData.new_term_months,
    repayment_method: formData.repayment_method,
    include_insurance: formData.include_insurance,
    stress: { floating_rate_bump_pct: formData.stress_bump },
    // Strategy params for R2 and R3
    extra_principal_vnd: formData.extra_principal_vnd,
    objective: formData.objective,
  };
}

// Helper to build strategies from form selections
export function buildStrategies(
  selectedStrategies: string[],
  extraPrincipalVnd?: number,
  milestoneType?: string,
  thresholdPct?: number,
  refinanceTiming?: 'now' | 'after_12m' | 'after_24m' | 'custom',
  customRefinanceMonth?: number,
  payoffNewLoanAtMilestone?: boolean
): RepaymentStrategy[] {
  const strategies: RepaymentStrategy[] = [];
  
  for (const strategyType of selectedStrategies) {
    switch (strategyType) {
      case 'STRATEGY_MIN_PAYMENT':
        strategies.push({ type: 'STRATEGY_MIN_PAYMENT' });
        break;
        
      case 'STRATEGY_FIXED_EXTRA_PRINCIPAL':
        if (extraPrincipalVnd) {
          strategies.push({
            type: 'STRATEGY_FIXED_EXTRA_PRINCIPAL',
            extra_principal_vnd: extraPrincipalVnd,
          });
        }
        break;
        
      case 'STRATEGY_EXIT_PLAN':
        strategies.push({
          type: 'STRATEGY_EXIT_PLAN',
          milestone: milestoneType as 'payoff_at_end_of_promo' | 'payoff_at_end_of_grace' | 'payoff_when_prepay_fee_hits_threshold' | undefined,
          threshold_pct: thresholdPct,
          refinance_timing: refinanceTiming,
          custom_refinance_month: customRefinanceMonth,
          payoff_new_loan_at_milestone: payoffNewLoanAtMilestone,
        });
        break;
        
      // Legacy support
      case 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE':
        strategies.push({
          type: 'STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE',
          milestone: (milestoneType as 'payoff_at_end_of_promo' | 'payoff_at_end_of_grace' | 'payoff_when_prepay_fee_hits_threshold') || 'payoff_at_end_of_promo',
          threshold_pct: thresholdPct,
        });
        break;
    }
  }
  
  return strategies;
}

// Helper to check if result is mortgage purchase
export function isMortgagePurchaseResult(result: SimulationResultUnion): result is import('../simulator-types').MortgagePurchaseResult {
  return result.type === 'MORTGAGE_RE';
}

// Helper to check if result is refinance
export function isRefinanceResult(result: SimulationResultUnion): result is import('../simulator-types').RefinanceResult {
  return result.type === 'REFINANCE';
}
