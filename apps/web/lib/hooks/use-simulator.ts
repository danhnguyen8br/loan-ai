'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import type { 
  TemplatesResponse,
  SimulateResponseV3,
  SimulateResponseV3Mortgage,
  SimulateResponseV3Refinance,
  MortgagePurchaseInput,
  RefinanceInput,
  OldLoanInput,
  OldPrepaymentTier,
  ExitRule,
  RefinanceObjective,
} from '../simulator-types';
import { OLD_LOAN_PREPAYMENT_PRESETS } from '../simulator-types';
import type { RecommendRequest, RecommendResponse } from '@/app/api/simulator/recommend/route';
import type { NeedsStrategy } from '@/components/simulator/needs-strategy-step';

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

// =============================================================================
// Recommendation API (NEW simplified flow)
// =============================================================================

export function useRecommendation() {
  return useMutation<RecommendResponse, Error, NeedsStrategy>({
    mutationFn: async (request) => {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Recommendation failed');
      }
      return res.json();
    },
  });
}

// Re-export types for convenience
export type { RecommendRequest, RecommendResponse };
