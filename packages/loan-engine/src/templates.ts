import { ProductTemplate } from './types';

/**
 * Predefined product templates for the Mortgage Cost Simulator
 * These are representative templates, not actual bank products
 */

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // ============================================================================
  // MORTGAGE_RE Templates (Real Estate Purchase/Build/Repair)
  // ============================================================================
  
  {
    id: 're_standard_12m_promo',
    name: 'Vay Mua Nhà Tiêu Chuẩn (12T Ưu Đãi)',
    category: 'MORTGAGE_RE',
    description: 'Gói vay mua nhà phổ biến với 12 tháng lãi suất ưu đãi cố định, phù hợp người mua nhà đầu tiên.',
    
    loan_limits: {
      max_ltv_pct: 70,
      max_dti_pct: 50,
    },
    
    term_rules: {
      min_term_months: 60,
      max_term_months: 300,
    },
    
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    
    grace: {
      grace_principal_months: 0,
    },
    
    rates: {
      promo_fixed_months: 12,
      promo_fixed_rate_pct: 7.5,
      floating_reference_assumption_pct: 6.0,
      floating_margin_pct: 2.5,
      reset_frequency_months: 3,
    },
    
    fees: {
      origination_fee_pct: 1.0,
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
      reference_rate_note: 'Lãi suất tham chiếu dựa trên trung bình thị trường VN 2024',
      fee_notes: 'Phí định giá có thể thay đổi tùy theo loại tài sản',
    },
    
    data_confidence_score: 100,
  },
  
  {
    id: 're_grace_6m_24m_promo',
    name: 'Vay Mua Nhà Ân Hạn Gốc 6T (24T Ưu Đãi)',
    category: 'MORTGAGE_RE',
    description: 'Gói vay với 6 tháng ân hạn gốc và 24 tháng lãi suất ưu đãi, giảm áp lực tài chính ban đầu.',
    
    loan_limits: {
      max_ltv_pct: 70,
      max_dti_pct: 50,
    },
    
    term_rules: {
      min_term_months: 60,
      max_term_months: 300,
    },
    
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    
    grace: {
      grace_principal_months: 6,
    },
    
    rates: {
      promo_fixed_months: 24,
      promo_fixed_rate_pct: 8.0,
      floating_reference_assumption_pct: 6.0,
      floating_margin_pct: 2.8,
      reset_frequency_months: 3,
    },
    
    fees: {
      origination_fee_pct: 1.0,
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
        { from_month_inclusive: 24, to_month_exclusive: 48, fee_pct: 1 },
        { from_month_inclusive: 48, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 10_000_000,
    },
    
    assumptions: {
      reference_rate_note: 'Lãi suất tham chiếu dựa trên trung bình thị trường VN 2024',
      fee_notes: 'Phí ân hạn gốc không phát sinh phí phụ trội',
    },
    
    data_confidence_score: 100,
  },
  
  {
    id: 're_long_fixed_36m',
    name: 'Vay Mua Nhà Cố Định Dài Hạn (36T)',
    category: 'MORTGAGE_RE',
    description: 'Gói vay với 36 tháng lãi suất cố định, ổn định chi phí hàng tháng trong thời gian dài.',
    
    loan_limits: {
      max_ltv_pct: 65,
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
      grace_principal_months: 0,
    },
    
    rates: {
      promo_fixed_months: 36,
      promo_fixed_rate_pct: 8.8,
      floating_reference_assumption_pct: 6.0,
      floating_margin_pct: 2.0,
      reset_frequency_months: 6,
    },
    
    fees: {
      origination_fee_pct: 0.8,
      appraisal_fee_vnd: 3_500_000,
      insurance: {
        enabled_default: true,
        mandatory: false,
        annual_pct: 0.08,
        basis: 'on_balance',
      },
    },
    
    prepayment_penalty: {
      schedule: [
        { from_month_inclusive: 0, to_month_exclusive: 24, fee_pct: 2 },
        { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
        { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 20_000_000,
    },
    
    assumptions: {
      reference_rate_note: 'Lãi suất cố định cao hơn bù đắp rủi ro cho ngân hàng',
      fee_notes: 'Bảo hiểm được khuyến nghị nhưng không bắt buộc',
    },
    
    data_confidence_score: 100,
  },
  
  // ============================================================================
  // REFINANCE Templates (Tái Tài Trợ / Chuyển Nợ)
  // ============================================================================
  
  {
    id: 'rf_reprice_low_fee',
    name: 'Tái Tài Trợ Phí Thấp (12T Ưu Đãi)',
    category: 'REFINANCE',
    description: 'Gói tái tài trợ với phí xử lý thấp 0.5%, phù hợp để chuyển khoản vay từ ngân hàng khác.',
    
    loan_limits: {
      max_ltv_pct: 75,
      max_dti_pct: 55,
    },
    
    term_rules: {
      min_term_months: 36,
      max_term_months: 240,
    },
    
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    
    grace: {
      grace_principal_months: 0,
    },
    
    rates: {
      promo_fixed_months: 12,
      promo_fixed_rate_pct: 7.2,
      floating_reference_assumption_pct: 6.0,
      floating_margin_pct: 2.2,
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
        { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 3 },
        { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
        { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
        { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 10_000_000,
    },
    
    assumptions: {
      reference_rate_note: 'Lãi suất tái tài trợ thường thấp hơn do khoản vay đã được kiểm chứng',
      fee_notes: 'Phí định giá có thể miễn nếu tài sản đã định giá trong 12 tháng',
    },
    
    data_confidence_score: 100,
  },
  
  {
    id: 'rf_no_promo_low_margin',
    name: 'Tái Tài Trợ Thả Nổi Margin Thấp',
    category: 'REFINANCE',
    description: 'Không có giai đoạn ưu đãi, nhưng margin thấp 1.8% suốt kỳ, phù hợp người giữ vay lâu dài.',
    
    loan_limits: {
      max_ltv_pct: 70,
      max_dti_pct: 50,
    },
    
    term_rules: {
      min_term_months: 36,
      max_term_months: 240,
    },
    
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    
    grace: {
      grace_principal_months: 0,
    },
    
    rates: {
      promo_fixed_months: 0,
      promo_fixed_rate_pct: 0, // No promo
      floating_reference_assumption_pct: 6.0,
      floating_margin_pct: 1.8,
      reset_frequency_months: 3,
    },
    
    fees: {
      refinance_processing_fee_vnd: 5_000_000,
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
      reference_rate_note: 'Margin thấp bù đắp cho việc không có giai đoạn ưu đãi',
      fee_notes: 'Phí xử lý cố định thay vì phần trăm',
    },
    
    data_confidence_score: 100,
  },
  
  {
    id: 'rf_fast_exit',
    name: 'Tái Tài Trợ Thoát Nhanh (6T Ưu Đãi)',
    category: 'REFINANCE',
    description: 'Gói ngắn hạn với phí tất toán sớm thấp, lý tưởng cho người có kế hoạch bán nhà hoặc trả hết trong 12 tháng.',
    
    loan_limits: {
      max_ltv_pct: 70,
      max_dti_pct: 50,
    },
    
    term_rules: {
      min_term_months: 12,
      max_term_months: 120,
    },
    
    repayment_defaults: {
      repayment_method_default: 'annuity',
      payment_recalc_rule: 'on_rate_reset',
    },
    
    grace: {
      grace_principal_months: 0,
    },
    
    rates: {
      promo_fixed_months: 6,
      promo_fixed_rate_pct: 6.9,
      floating_reference_assumption_pct: 6.0,
      floating_margin_pct: 2.8,
      reset_frequency_months: 1,
    },
    
    fees: {
      refinance_processing_fee_vnd: 2_000_000,
      insurance: {
        enabled_default: false,
        mandatory: false,
        annual_pct: 0.1,
        basis: 'on_balance',
      },
    },
    
    prepayment_penalty: {
      schedule: [
        { from_month_inclusive: 0, to_month_exclusive: 6, fee_pct: 1 },
        { from_month_inclusive: 6, to_month_exclusive: 12, fee_pct: 0.5 },
        { from_month_inclusive: 12, to_month_exclusive: null, fee_pct: 0 },
      ],
      allow_partial_prepay: true,
      partial_prepay_min_vnd: 5_000_000,
    },
    
    assumptions: {
      reference_rate_note: 'Lãi suất ưu đãi ngắn hạn để thu hút khách hàng có kế hoạch thoát sớm',
      fee_notes: 'Phí tất toán sớm thấp hơn các gói khác',
    },
    
    data_confidence_score: 100,
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

