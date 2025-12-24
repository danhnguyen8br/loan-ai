import { ProductTemplate } from './types';

/**
 * Predefined product templates for the Mortgage Cost Simulator
 * Based on typical Vietnamese market products (Dec 2025)
 * 
 * Notes:
 * - Templates are aggregated to reflect market ranges and common terms in Vietnam.
 * - Product names/descriptions intentionally DO NOT display bank names.
 */

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // ============================================================================
  // MORTGAGE_RE Templates - Market baseline (Dec 2025)
  // ============================================================================

  {
    id: 'market2025_mortgage_promo_6m',
    name: 'Vay mua BĐS – LS ưu đãi 5.2% 6 tháng',
    category: 'MORTGAGE_RE',
    description: 'Vay mua BĐS – LS ưu đãi 5.2% 6 tháng',
    loan_limits: {
      max_ltv_pct: 85,
      max_dti_pct: 50,
    },
    term_rules: {
      min_term_months: 36,
      max_term_months: 360,
    },
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    grace: {
      grace_principal_months: 24,
    },
    rates: {
      promo_fixed_months: 6,
      promo_fixed_rate_pct: 5.2,
      floating_reference_assumption_pct: 5.0,
      floating_margin_pct: 3.8,
      reset_frequency_months: 3,
    },
    fees: {
      origination_fee_pct: 0.5,
      appraisal_fee_vnd: 3_000_000,
      insurance: {
        enabled_default: false,
        mandatory: false,
        annual_pct: 0.1,
        basis: 'on_balance',
      },
    },
    prepayment_penalty: {
      schedule: [
        { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 3 },
        { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
        { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
        { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 10_000_000,
    },
    assumptions: {
      reference_rate_note: '',
      fee_notes: '',
    },
    data_confidence_score: 85,
  },

  {
    id: 'market2025_mortgage_fixed_24m',
    name: 'Vay mua BĐS – LS ưu đãi 6.5% 24 tháng',
    category: 'MORTGAGE_RE',
    description: 'Vay mua BĐS – LS ưu đãi 6.5% 24 tháng',
    loan_limits: {
      max_ltv_pct: 80,
      max_dti_pct: 50,
    },
    term_rules: {
      min_term_months: 36,
      max_term_months: 300,
    },
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    grace: {
      grace_principal_months: 36,
    },
    rates: {
      promo_fixed_months: 24,
      promo_fixed_rate_pct: 6.5,
      floating_reference_assumption_pct: 5.0,
      floating_margin_pct: 3.5,
      reset_frequency_months: 6,
    },
    fees: {
      origination_fee_pct: 0.5,
      appraisal_fee_vnd: 3_000_000,
      insurance: {
        enabled_default: false,
        mandatory: false,
        annual_pct: 0.1,
        basis: 'on_balance',
      },
    },
    prepayment_penalty: {
      schedule: [
        { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 3 },
        { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
        { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
        { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 10_000_000,
    },
    assumptions: {
      reference_rate_note: '',
      fee_notes: '',
    },
    data_confidence_score: 88,
  },

  {
    id: 'market2025_mortgage_fixed_60m',
    name: 'Vay mua BĐS – LS ưu đãi 7.8% 60 tháng',
    category: 'MORTGAGE_RE',
    description: 'Vay mua BĐS – LS ưu đãi 7.8% 60 tháng',
    loan_limits: {
      max_ltv_pct: 75,
      max_dti_pct: 45,
    },
    term_rules: {
      min_term_months: 60,
      max_term_months: 240,
    },
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    grace: {
      grace_principal_months: 12,
    },
    rates: {
      promo_fixed_months: 60,
      promo_fixed_rate_pct: 7.8,
      floating_reference_assumption_pct: 5.0,
      floating_margin_pct: 3.2,
      reset_frequency_months: 12,
    },
    fees: {
      origination_fee_pct: 0.5,
      appraisal_fee_vnd: 3_000_000,
      insurance: {
        enabled_default: false,
        mandatory: false,
        annual_pct: 0.1,
        basis: 'on_balance',
      },
    },
    prepayment_penalty: {
      schedule: [
        { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 2.5 },
        { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
        { from_month_inclusive: 24, to_month_exclusive: 48, fee_pct: 1 },
        { from_month_inclusive: 48, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 10_000_000,
    },
    assumptions: {
      reference_rate_note: '',
      fee_notes: '',
    },
    data_confidence_score: 85,
  },

  // ============================================================================
  // REFINANCE Templates - Market baseline (Dec 2025) - NEW
  // ============================================================================

  {
    id: 'market2025_refinance_promo_12m',
    name: 'Vay chuyển ngân hàng – ân hạn gốc 12 tháng',
    category: 'REFINANCE',
    description: 'Vay chuyển ngân hàng – ân hạn gốc 12 tháng',
    loan_limits: {
      max_ltv_pct: 85,
      max_dti_pct: 55,
    },
    term_rules: {
      min_term_months: 24,
      max_term_months: 360,
    },
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    grace: {
      grace_principal_months: 12,
    },
    rates: {
      promo_fixed_months: 12,
      promo_fixed_rate_pct: 5.5,
      floating_reference_assumption_pct: 5.0,
      floating_margin_pct: 3.6,
      reset_frequency_months: 3,
    },
    fees: {
      refinance_processing_fee_pct: 0.3,
      appraisal_fee_vnd: 2_500_000,
      insurance: {
        enabled_default: false,
        mandatory: false,
        annual_pct: 0.1,
        basis: 'on_balance',
      },
    },
    prepayment_penalty: {
      schedule: [
        { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 3 },
        { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
        { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
        { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 10_000_000,
    },
    assumptions: {
      reference_rate_note: '',
      fee_notes: '',
    },
    data_confidence_score: 88,
  },

  {
    id: 'market2025_refinance_fixed_24m',
    name: 'Vay chuyển ngân hàng – ân hạn gốc 24 tháng',
    category: 'REFINANCE',
    description: 'Vay chuyển ngân hàng – ân hạn gốc 24 tháng',
    loan_limits: {
      max_ltv_pct: 80,
      max_dti_pct: 55,
    },
    term_rules: {
      min_term_months: 24,
      max_term_months: 300,
    },
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    grace: {
      grace_principal_months: 24,
    },
    rates: {
      promo_fixed_months: 24,
      promo_fixed_rate_pct: 6.4,
      floating_reference_assumption_pct: 5.0,
      floating_margin_pct: 3.5,
      reset_frequency_months: 6,
    },
    fees: {
      refinance_processing_fee_pct: 0.4,
      appraisal_fee_vnd: 2_500_000,
      insurance: {
        enabled_default: false,
        mandatory: false,
        annual_pct: 0.1,
        basis: 'on_balance',
      },
    },
    prepayment_penalty: {
      schedule: [
        { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 3 },
        { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
        { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
        { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 10_000_000,
    },
    assumptions: {
      reference_rate_note: '',
      fee_notes: '',
    },
    data_confidence_score: 85,
  },

  {
    id: 'market2025_refinance_low_margin_float',
    name: 'Vay chuyển ngân hàng – ân hạn gốc 6 tháng',
    category: 'REFINANCE',
    description: 'Vay chuyển ngân hàng – ân hạn gốc 6 tháng',
    loan_limits: {
      max_ltv_pct: 80,
      max_dti_pct: 55,
    },
    term_rules: {
      min_term_months: 24,
      max_term_months: 360,
    },
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    grace: {
      grace_principal_months: 6,
    },
    rates: {
      promo_fixed_months: 6,
      promo_fixed_rate_pct: 5.5,
      floating_reference_assumption_pct: 5.0,
      floating_margin_pct: 3.8,
      reset_frequency_months: 3,
    },
    fees: {
      refinance_processing_fee_pct: 0.5,
      appraisal_fee_vnd: 2_000_000,
      insurance: {
        enabled_default: false,
        mandatory: false,
        annual_pct: 0.1,
        basis: 'on_balance',
      },
    },
    prepayment_penalty: {
      schedule: [
        { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 2 },
        { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 1 },
        { from_month_inclusive: 24, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 10_000_000,
    },
    assumptions: {
      reference_rate_note: '',
      fee_notes: '',
    },
    data_confidence_score: 85,
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ProductTemplate | undefined {
  return PRODUCT_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: 'MORTGAGE_RE' | 'REFINANCE'): ProductTemplate[] {
  return PRODUCT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all templates
 */
export function getAllTemplates(): ProductTemplate[] {
  return PRODUCT_TEMPLATES;
}

