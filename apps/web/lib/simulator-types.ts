// Import types from the loan-engine package
import type {
  ProductTemplate as ProductTemplateType,
  ProductCategory as ProductCategoryType,
  RepaymentMethod as RepaymentMethodType,
  PaymentRecalcRule as PaymentRecalcRuleType,
  InsuranceBasis as InsuranceBasisType,
  UserInput as UserInputType,
  StressConfig as StressConfigType,
  RepaymentStrategy as RepaymentStrategyType,
  StrategyType as StrategyTypeType,
  MilestoneType as MilestoneTypeType,
  StrategyMinPayment as StrategyMinPaymentType,
  StrategyFixedExtraPrincipal as StrategyFixedExtraPrincipalType,
  StrategyMilestonePayoff as StrategyMilestonePayoffType,
  StrategyExitPlan as StrategyExitPlanType,
  ScheduleRow as ScheduleRowType,
  ScheduleTotals as ScheduleTotalsType,
  SimulationMetrics as SimulationMetricsType,
  SimulationResult as SimulationResultType,
  SimulateRequest as SimulateRequestType,
  SimulateResponse as SimulateResponseType,
  PrepaymentScheduleItem as PrepaymentScheduleItemType,
  OldLoanInput as OldLoanInputType,
  OldPrepaymentTier as OldPrepaymentTierType,
  MortgagePurchaseInput as MortgagePurchaseInputType,
  RefinanceInput as RefinanceInputType,
  MortgagePurchaseResult as MortgagePurchaseResultType,
  RefinanceResult as RefinanceResultType,
  RefinanceBreakdown as RefinanceBreakdownType,
  SimulationResultUnion as SimulationResultUnionType,
  // New multi-strategy types
  ExitRule as ExitRuleType,
  RefinanceObjective as RefinanceObjectiveType,
  MortgageStrategyId as MortgageStrategyIdType,
  RefinanceStrategyId as RefinanceStrategyIdType,
  MortgageStrategyResult as MortgageStrategyResultType,
  RefinanceStrategyResult as RefinanceStrategyResultType,
  MortgageMultiStrategyResult as MortgageMultiStrategyResultType,
  RefinanceMultiStrategyResult as RefinanceMultiStrategyResultType,
} from '@loan-ai/loan-engine';

// Re-export types with original names
export type ProductTemplate = ProductTemplateType;
export type ProductCategory = ProductCategoryType;
export type RepaymentMethod = RepaymentMethodType;
export type PaymentRecalcRule = PaymentRecalcRuleType;
export type InsuranceBasis = InsuranceBasisType;
export type UserInput = UserInputType;
export type StressConfig = StressConfigType;
export type RepaymentStrategy = RepaymentStrategyType;
export type StrategyType = StrategyTypeType;
export type MilestoneType = MilestoneTypeType;
export type StrategyMinPayment = StrategyMinPaymentType;
export type StrategyFixedExtraPrincipal = StrategyFixedExtraPrincipalType;
export type StrategyMilestonePayoff = StrategyMilestonePayoffType;
export type StrategyExitPlan = StrategyExitPlanType;
export type ScheduleRow = ScheduleRowType;
export type ScheduleTotals = ScheduleTotalsType;
export type SimulationMetrics = SimulationMetricsType;
export type SimulationResult = SimulationResultType;
export type SimulateRequest = SimulateRequestType;
export type SimulateResponse = SimulateResponseType;
export type PrepaymentScheduleItem = PrepaymentScheduleItemType;
export type OldLoanInput = OldLoanInputType;
export type OldPrepaymentTier = OldPrepaymentTierType;
export type MortgagePurchaseInput = MortgagePurchaseInputType;
export type RefinanceInput = RefinanceInputType;
export type MortgagePurchaseResult = MortgagePurchaseResultType;
export type RefinanceResult = RefinanceResultType;
export type RefinanceBreakdown = RefinanceBreakdownType;
export type SimulationResultUnion = SimulationResultUnionType;
// New multi-strategy types
export type ExitRule = ExitRuleType;
export type RefinanceObjective = RefinanceObjectiveType;
export type MortgageStrategyId = MortgageStrategyIdType;
export type RefinanceStrategyId = RefinanceStrategyIdType;
export type MortgageStrategyResult = MortgageStrategyResultType;
export type RefinanceStrategyResult = RefinanceStrategyResultType;
export type MortgageMultiStrategyResult = MortgageMultiStrategyResultType;
export type RefinanceMultiStrategyResult = RefinanceMultiStrategyResultType;

// Frontend-specific types
export interface SimulatorState {
  step: 'category' | 'inputs' | 'strategy' | 'results';
  category: 'MORTGAGE_RE' | 'REFINANCE' | null;
  userInput: Partial<UserInputForm>;
  selectedStrategies: StrategyType[];
  selectedTemplates: string[];
}

// Mortgage Purchase Form Data
export interface MortgagePurchaseForm {
  type: 'MORTGAGE_RE';
  property_value_vnd: number;
  down_payment_vnd: number;
  loan_amount_vnd: number;
  term_months: number;
  // Note: horizon_months is computed from term_months by default (simulate until end of loan)
  repayment_method: 'annuity' | 'equal_principal';
  include_insurance: boolean;
  stress_bump: 0 | 2 | 4;
  // Strategy params for M2 (extra principal) and M3 (exit plan)
  extra_principal_vnd?: number;
  exit_rule?: ExitRule;
  exit_fee_threshold_pct?: number;
  exit_custom_month?: number;
  // Legacy milestone types (kept for backward compatibility)
  milestone_type?: MilestoneType;
  threshold_pct?: number;
}

// Old Loan Form Data (for refinance)
export interface OldLoanForm {
  old_remaining_balance_vnd: number;
  old_remaining_term_months: number;
  old_current_rate_pct: number;
  old_repayment_method: 'annuity' | 'equal_principal';
  old_loan_age_months: number;
  old_prepayment_schedule_preset: 'standard_3_2_1_0' | 'moderate_2_1_0' | 'low_1_0' | 'custom';
  old_prepayment_custom?: OldPrepaymentTier[];
  old_recurring_fees_monthly_vnd?: number;
}

// Refinance Form Data
export interface RefinanceForm {
  type: 'REFINANCE';
  old_loan: OldLoanForm;
  new_term_months: number;
  cash_out_vnd?: number;
  refinance_month_index: number;
  // Note: horizon_months is computed from new_term_months by default (simulate until end of new loan)
  repayment_method: 'annuity' | 'equal_principal';
  include_insurance: boolean;
  stress_bump: 0 | 2 | 4;
  // Strategy params for R2 (extra principal) and R3 (optimal timing)
  extra_principal_vnd?: number;
  objective?: RefinanceObjective;
  // Legacy params (kept for backward compatibility)
  refinance_timing?: 'now' | 'after_12m' | 'after_24m' | 'custom';
  payoff_new_loan_at_milestone?: boolean;
  milestone_type?: MilestoneType;
  threshold_pct?: number;
}

// Legacy form type for backward compatibility
export interface UserInputForm {
  loan_amount_vnd: number;
  term_months: number;
  horizon_months: number;
  property_value_vnd?: number;
  down_payment_vnd?: number;
  current_remaining_balance_vnd?: number;
  current_rate_pct?: number;
  remaining_term_months?: number;
  refinance_cashout_vnd?: number;
  repayment_method: 'annuity' | 'equal_principal';
  include_insurance: boolean;
  stress_bump: 0 | 2 | 4;
  extra_principal_vnd?: number;
  milestone_type?: 'payoff_at_end_of_promo' | 'payoff_at_end_of_grace' | 'payoff_when_prepay_fee_hits_threshold';
  threshold_pct?: number;
  // Refinance-specific
  old_loan_age_months?: number;
  refinance_timing?: 'now' | 'after_12m' | 'after_24m' | 'custom';
}

export interface TemplatesResponse {
  templates: ProductTemplate[];
  count: number;
}

export interface SimulateResponseData {
  results: {
    template_id: string;
    strategy_type: string;
    result: SimulationResult;
  }[];
  count: number;
  user_input: UserInput;
}

// New V2 response for refinance
export interface SimulateResponseDataV2 {
  results: {
    template_id: string;
    strategy_type: string;
    result: SimulationResultUnion;
  }[];
  count: number;
  input_type: 'MORTGAGE_RE' | 'REFINANCE';
}

// V3 API Response - multi-strategy per template
export interface SimulateResponseV3Mortgage {
  type: 'MORTGAGE_RE';
  results: MortgageMultiStrategyResult[];
  count: number;
}

export interface SimulateResponseV3Refinance {
  type: 'REFINANCE';
  results: RefinanceMultiStrategyResult[];
  count: number;
}

export type SimulateResponseV3 = SimulateResponseV3Mortgage | SimulateResponseV3Refinance;

// Old loan prepayment presets
export const OLD_LOAN_PREPAYMENT_PRESETS: Record<string, OldPrepaymentTier[]> = {
  standard_3_2_1_0: [
    { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 3 },
    { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 2 },
    { from_month_inclusive: 24, to_month_exclusive: 36, fee_pct: 1 },
    { from_month_inclusive: 36, to_month_exclusive: null, fee_pct: 0 },
  ],
  moderate_2_1_0: [
    { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 2 },
    { from_month_inclusive: 12, to_month_exclusive: 24, fee_pct: 1 },
    { from_month_inclusive: 24, to_month_exclusive: null, fee_pct: 0 },
  ],
  low_1_0: [
    { from_month_inclusive: 0, to_month_exclusive: 12, fee_pct: 1 },
    { from_month_inclusive: 12, to_month_exclusive: null, fee_pct: 0 },
  ],
  custom: [],
};

// Format utilities
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatShortVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    // Hiển thị 2 số thập phân để thể hiện sự thay đổi rõ hơn
    return `${(amount / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (amount >= 1_000_000) {
    // Hiển thị 1 số thập phân cho triệu
    return `${(amount / 1_000_000).toFixed(1)} triệu`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} nghìn`;
  }
  return formatVND(amount);
}

export const STRATEGY_LABELS: Record<string, { name: string; description: string }> = {
  STRATEGY_MIN_PAYMENT: {
    name: 'Thanh Toán Tối Thiểu',
    description: 'Chỉ trả đúng kỳ hạn, ưu tiên giữ thanh khoản',
  },
  STRATEGY_FIXED_EXTRA_PRINCIPAL: {
    name: 'Trả Thêm Gốc Hàng Tháng',
    description: 'Trả thêm gốc cố định mỗi tháng để giảm tổng lãi',
  },
  STRATEGY_EXIT_PLAN: {
    name: 'Kế Hoạch Thoát',
    description: 'Tất toán sớm hoặc tái cấu trúc theo mốc thời gian',
  },
  // Legacy
  STRATEGY_REFINANCE_OR_PAYOFF_AT_MILESTONE: {
    name: 'Tất Toán Theo Mốc',
    description: 'Tất toán sớm tại mốc thời gian cụ thể',
  },
};

// Strategy info with pros/cons for tooltips
interface StrategyInfo {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
}

// New strategy labels for multi-strategy results
export const MORTGAGE_STRATEGY_LABELS: Record<MortgageStrategyId, StrategyInfo> = {
  M1_MIN_PAYMENT: {
    name: 'Thanh Toán Tối Thiểu',
    description: 'Trả đúng kỳ hạn, giữ thanh khoản tối đa',
    pros: [
      'Tiền mặt linh hoạt hàng tháng',
      'Phù hợp khi cần vốn cho đầu tư khác',
      'Đơn giản, dễ quản lý ngân sách',
    ],
    cons: [
      'Tổng lãi cao nhất trong 3 chiến lược',
      'Thời gian trả nợ dài',
      'Chịu rủi ro lãi suất thả nổi lâu hơn',
    ],
  },
  M2_EXTRA_PRINCIPAL: {
    name: 'Trả Thêm Gốc',
    description: 'Trả thêm gốc cố định hàng tháng để giảm tổng lãi',
    pros: [
      'Giảm đáng kể tổng lãi phải trả',
      'Rút ngắn thời gian vay',
      'Xây dựng vốn sở hữu nhanh hơn',
    ],
    cons: [
      'Cần dòng tiền ổn định',
      'Giảm thanh khoản hàng tháng',
      'Có thể bị phí tất toán sớm',
    ],
  },
  M3_EXIT_PLAN: {
    name: 'Tất Toán Sớm',
    description: 'Tất toán toàn bộ khoản vay tại một mốc thời gian xác định',
    pros: [
      'Tiết kiệm lãi tối đa nếu có nguồn tiền lớn',
      'Thoát khỏi khoản vay nhanh',
      'Tối ưu nếu tất toán cuối kỳ ưu đãi (phí thấp)',
    ],
    cons: [
      'Cần số tiền lớn một lần',
      'Có thể bị phí tất toán sớm cao',
      'Mất cơ hội đầu tư số tiền đó',
    ],
  },
};

export const REFINANCE_STRATEGY_LABELS: Record<RefinanceStrategyId, StrategyInfo> = {
  R1_REFI_NOW_LIQUIDITY: {
    name: 'Refinance Ngay',
    description: 'Chuyển vay ngay lập tức, chỉ trả số tiền tối thiểu hàng tháng',
    pros: [
      'Được hưởng lãi suất mới thấp hơn ngay',
      'Giữ thanh khoản hàng tháng',
      'Đơn giản, không cần thêm tiền',
    ],
    cons: [
      'Phải trả phí tất toán sớm khoản cũ',
      'Tổng lãi vẫn cao (trả tối thiểu)',
      'Thời gian vay có thể kéo dài',
    ],
  },
  R2_REFI_NOW_ACCELERATE: {
    name: 'Refinance + Trả Nhanh',
    description: 'Chuyển vay ngay và trả thêm gốc hàng tháng',
    pros: [
      'Tiết kiệm lãi cao nhất',
      'Rút ngắn thời gian vay đáng kể',
      'Kết hợp lợi ích: lãi mới thấp + trả nhanh',
    ],
    cons: [
      'Chi phí ban đầu cao (phí tất toán + trả thêm)',
      'Áp lực dòng tiền hàng tháng',
      'Cần thu nhập ổn định',
    ],
  },
  R3_OPTIMAL_TIMING: {
    name: 'Thời Điểm Tối Ưu',
    description: 'Tự động tìm tháng refinance tối ưu trong khoảng thời gian mô phỏng',
    pros: [
      'Tìm thời điểm phí tất toán thấp nhất',
      'Cân bằng giữa tiết kiệm và chi phí',
      'Hữu ích khi phí tất toán cũ cao',
    ],
    cons: [
      'Có thể phải chờ đợi để refinance',
      'Tiếp tục trả lãi cao trong thời gian chờ',
      'Rủi ro lãi suất mới thay đổi',
    ],
  },
};

export const EXIT_RULE_LABELS: Record<ExitRule, string> = {
  PROMO_END: 'Cuối kỳ ưu đãi',
  GRACE_END: 'Cuối kỳ ân hạn',
  FEE_THRESHOLD: 'Khi phí tất toán ≤ ngưỡng',
  CUSTOM: 'Tháng tùy chọn',
};

export const REFINANCE_OBJECTIVE_LABELS: Record<RefinanceObjective, string> = {
  MAX_NET_SAVING: 'Tối đa tiết kiệm',
  FASTEST_BREAK_EVEN: 'Hoà vốn nhanh nhất',
};

export const CATEGORY_LABELS: Record<string, { name: string; description: string }> = {
  MORTGAGE_RE: {
    name: 'Vay Mua BĐS',
    description: 'Vay mua nhà, căn hộ hoặc đất',
  },
  REFINANCE: {
    name: 'Tái Tài Trợ (Refinance)',
    description: 'Chuyển khoản vay từ ngân hàng khác để có lãi suất tốt hơn',
  },
};

export const REFINANCE_TIMING_LABELS: Record<string, string> = {
  now: 'Refinance ngay',
  after_12m: 'Sau 12 tháng',
  after_24m: 'Sau 24 tháng',
  custom: 'Tùy chọn',
};
