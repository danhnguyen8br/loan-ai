// Type definitions matching backend schemas

// ============================================================================
// User & Auth types
// ============================================================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ============================================================================
// Enums
// ============================================================================

// Primary loan purposes (new simplified flow)
export type ApplicationPurpose = 
  | "NEW_PURCHASE"  // Mua tài sản mới (nhà, chung cư)
  | "REFINANCE"     // Tái tài trợ khoản vay
  // Legacy purposes (kept for backward compatibility)
  | "HOME_PURCHASE" 
  | "CONSTRUCTION"
  | "REPAIR"
  | "DEBT_SWAP"
  | "BUSINESS_SECURED"
  | "REPAIR_BUILD";

// Repayment strategy preference - drives term optimization
export type RepaymentStrategy = 
  | "UNCERTAIN"   // Not sure how long to keep loan → max term + reasonable prepayment fees
  | "EARLY_EXIT"  // Plan to pay off in 12-36 months → low/decreasing prepayment fees
  | "LONG_HOLD";  // Keep >5 years → focus on margin + floating rate transparency

export type ApplicationStatus = "DRAFT" | "SUBMITTED" | "PROCESSING" | "APPROVED" | "REJECTED";
export type IncomeSourceType = "SALARY" | "BUSINESS" | "RENTAL" | "OTHER";
export type DebtType = "MORTGAGE" | "PERSONAL_LOAN" | "CREDIT_CARD" | "CAR_LOAN" | "OTHER";
export type CollateralType = "HOUSE" | "LAND" | "APT" | "OFF_PLAN" | "COMMERCIAL" | "CONDO" | "OTHER";
export type LegalStatus = "CLEAR" | "PENDING" | "DISPUTED";
export type ProofStrength = "STRONG" | "MEDIUM" | "WEAK";
export type BankType = "SOCB" | "PRIVATE" | "FOREIGN";
export type ApprovalBucket = "LOW" | "MEDIUM" | "HIGH";

// ============================================================================
// Application types
// ============================================================================

export interface ApplicationIncome {
  id?: string;
  source: string;
  monthly_net: number;
  proof_type?: string;
  proof_strength?: ProofStrength;
}

export interface ApplicationDebt {
  id?: string;
  debt_type: DebtType;
  monthly_payment: number;
  outstanding_balance?: number;
  remaining_months?: number;
}

export interface ApplicationCollateral {
  id?: string;
  collateral_type: CollateralType;
  estimated_value: number;
  location?: string;
  district?: string;
  legal_status?: LegalStatus;
  property_age_years?: number;
  has_red_book?: string;
}

export interface CreditFlags {
  has_late_payments?: boolean;
  cic_bad_debt?: boolean;
  previous_loan_restructured?: boolean;
  cic_score?: number;
}

export interface UserPreferences {
  priority_cost_vs_stability?: number; // 0=lowest cost, 100=max stability
  min_fixed_months_preference?: number;
  max_monthly_payment_cap_vnd?: number;
  avoid_mandatory_insurance?: boolean;
  need_fast_approval?: boolean;
}

export interface Application {
  id: string;
  user_id?: string;
  
  // Loan details
  purpose: ApplicationPurpose;
  loan_amount: number;
  tenor_months?: number; // Now optional - auto-calculated based on strategy
  
  // Repayment strategy (new)
  repayment_strategy?: RepaymentStrategy;
  
  // Property/Purchase details
  purchase_price_vnd?: number;
  down_payment_vnd?: number;
  
  // Refinance details (new)
  current_outstanding_balance_vnd?: number; // For REFINANCE purpose
  
  // Comparison and prepayment planning
  planned_hold_months?: number;
  expected_prepayment_month?: number;
  expected_prepayment_amount_vnd?: number;
  
  // Timing
  need_disbursement_by_date?: string;
  
  // Location (legacy - removed from new flow)
  geo_location?: string;
  
  // Borrower profile
  income_type?: IncomeSourceType;
  monthly_income_vnd?: number;
  proof_strength?: ProofStrength;
  existing_debts_monthly_payment_vnd?: number;
  credit_flags?: CreditFlags;
  
  // Property details
  property_type?: CollateralType;
  property_location_province?: string;
  property_location_district?: string;
  legal_status?: LegalStatus;
  estimated_property_value_vnd?: number;
  
  // Preferences
  preferences?: UserPreferences;
  
  // Legacy
  stuck_reasons?: string[];
  
  // Status and relationships
  status: ApplicationStatus;
  incomes: ApplicationIncome[];
  debts: ApplicationDebt[];
  collaterals: ApplicationCollateral[];
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreate {
  purpose: ApplicationPurpose;
  loan_amount: number;
  tenor_months?: number; // Now optional - auto-calculated based on strategy
  
  // Repayment strategy (new)
  repayment_strategy?: RepaymentStrategy;
  
  // Property/Purchase details
  purchase_price_vnd?: number;
  down_payment_vnd?: number;
  
  // Refinance details (new)
  current_outstanding_balance_vnd?: number; // For REFINANCE purpose
  
  // Comparison and prepayment planning
  planned_hold_months?: number;
  expected_prepayment_month?: number;
  expected_prepayment_amount_vnd?: number;
  
  // Timing
  need_disbursement_by_date?: string;
  
  // Location (legacy - removed from new flow)
  geo_location?: string;
  
  // Borrower profile
  income_type?: IncomeSourceType;
  monthly_income_vnd?: number;
  proof_strength?: ProofStrength;
  existing_debts_monthly_payment_vnd?: number;
  credit_flags?: CreditFlags;
  
  // Property details
  property_type?: CollateralType;
  property_location_province?: string;
  property_location_district?: string;
  legal_status?: LegalStatus;
  estimated_property_value_vnd?: number;
  
  // Preferences
  preferences?: UserPreferences;
  
  // Legacy
  stuck_reasons?: string[];
  
  // Related entities
  incomes: ApplicationIncome[];
  debts: ApplicationDebt[];
  collaterals: ApplicationCollateral[];
}

export interface ApplicationMetrics {
  application_id: string;
  ltv: number | null;
  dsr: number | null;
  dti: number | null;
  monthly_net_income: number;
  total_monthly_debt_payments: number;
  estimated_monthly_payment: number | null;
  available_for_new_debt?: number | null;
}

// ============================================================================
// Product types
// ============================================================================

export interface ProcessingSLA {
  pre_approval_days?: number;
  appraisal_days?: number;
  final_approval_days?: number;
  disbursement_days?: number;
}

export interface PromoOption {
  option_name?: string;
  fixed_months: number;
  fixed_rate_pct: number;
  conditions_text?: string;
}

export interface FloatingConfig {
  floating_index_name?: string;
  floating_margin_pct: number;
  reset_frequency_months?: number;
  caps_floors?: Record<string, number>;
  reference_rate_source_url?: string;
}

export interface RateModel {
  id: string;
  loan_product_id: string;
  promo_options: PromoOption[];
  floating?: FloatingConfig;
  reference_rate_base_pct?: number;
  notes?: string;
  assumptions?: string;
  created_at: string;
  updated_at: string;
}

export interface UpfrontFees {
  origination_fee_pct?: number;
  origination_min_vnd?: number;
  origination_max_vnd?: number;
  appraisal_fee_vnd?: number;
  disbursement_fee_vnd?: number;
  disbursement_fee_pct?: number;
  legal_fees_note?: string;
}

export interface RecurringFees {
  account_maintenance_fee_vnd?: number;
  insurance_annual_pct?: number;
  insurance_vnd?: number;
  insurance_basis?: string;
  mandatory_insurance_flag?: boolean;
}

export interface PrepaymentTier {
  months_from: number;
  months_to?: number;
  fee_pct: number;
}

export interface PrepaymentFees {
  prepayment_schedule: PrepaymentTier[];
  partial_prepayment_min_vnd?: number;
  partial_prepayment_note?: string;
}

export interface FeesPenalties {
  id: string;
  loan_product_id: string;
  upfront?: UpfrontFees;
  recurring?: RecurringFees;
  prepayment?: PrepaymentFees;
  late_overdue?: Record<string, string>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EligibilityRequirements {
  income_type_supported: string[];
  min_income_vnd?: number;
  employment_tenure_months?: number;
  credit_requirements_text?: string;
  required_relationships: string[];
}

export interface CollateralRequirements {
  collateral_types: string[];
  legal_constraints_text: string[];
  appraisal_method_note?: string;
}

export interface RepaymentConfig {
  repayment_method: string;
  payment_frequency: string;
  grace_principal_months: number;
  grace_interest_months: number;
}

export interface LoanProduct {
  id: string;
  bank_id: string;
  bank_name?: string;
  name: string;
  purpose: ApplicationPurpose;
  description: string;
  target_segment?: string[];
  currency?: string;
  effective_from?: string;
  effective_to?: string;
  min_loan_amount?: number;
  max_loan_amount?: number;
  max_ltv_pct?: number;
  min_term_months?: number;
  max_term_months?: number;
  max_age_at_maturity?: number;
  eligibility?: EligibilityRequirements;
  collateral?: CollateralRequirements;
  repayment?: RepaymentConfig;
  rate_fixed_months?: number;
  rate_fixed?: number;
  floating_margin?: number;
  reference_rate_name?: string;
  sla_days_estimate?: number;
  constraints_json?: ProductConstraints;
  reference_url?: string;
  is_active: boolean;
  rate_model?: RateModel;
  fees_penalties?: FeesPenalties;
  created_at: string;
  updated_at: string;
}

export interface ProductConstraints {
  hard: HardConstraints;
  soft?: SoftPreferences;
}

export interface HardConstraints {
  max_ltv: number;
  max_dsr: number;
  min_income_monthly: number;
  max_tenor_months: number;
  allowed_collateral_types: CollateralType[];
  geo_allowed: string[];
}

export interface SoftPreferences {
  pref_fixed_months_weight: number;
  pref_fast_sla_weight: number;
  pref_low_fee_weight: number;
}

// ============================================================================
// Recommendation types
// ============================================================================

export interface EstimatedCosts {
  month1_payment: number;
  year1_total: number;
  total_3y: number;
  total_5y: number;
  stress_max_monthly: number;
}

export interface ScenarioResult {
  apr: number;
  monthly_payment_first_12m: number;
  monthly_payment_post_promo: number;
  total_interest: number;
  total_fees: number;
  total_cost: number;
  prepayment_fee: number;
}

export interface PrepaymentAtPromoEnd {
  prepayment_month: number;
  remaining_principal: number;
  prepayment_fee: number;
  total_interest_paid: number;
  total_fees_paid: number;
  total_cost_to_exit: number;
}

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  bank_name: string;
  fit_score: number;
  approval_bucket: ApprovalBucket;
  approval_score?: number;
  cost_score?: number;
  stability_score?: number;
  speed_score?: number;
  penalties_score?: number;
  preference_score?: number; // Legacy
  estimated_costs: EstimatedCosts;
  scenarios?: Record<string, ScenarioResult>;
  apr?: number;
  why_fit: string[];
  risks: string[];
  rate_details?: {
    fixed_months: number;
    fixed_rate: number;
    floating_margin: number;
    reference_rate?: number;
  };
  grace_principal_months?: number;
  repayment_method?: string;
  suggested_tenor_months?: number; // Optimal term based on repayment strategy
  prepayment_at_promo_end?: PrepaymentAtPromoEnd;
  estimated_disbursement_days?: number;
  data_confidence_score?: number;
  assumptions_used?: string[];
  next_steps: string[];
  catalog_last_updated: string;
}

export interface RejectedProduct {
  product_id: string;
  product_name: string;
  bank_name: string;
  reasons: string[];
  reason_code?: string;
  reason_detail?: string;
}

export interface RecommendationResponse {
  id: string;
  application_id: string;
  generated_at: string;
  top: ProductRecommendation[];
  rejected: RejectedProduct[];
  application_snapshot?: {
    loan_amount: number;
    tenor_months: number;
    purpose: ApplicationPurpose;
    repayment_strategy?: RepaymentStrategy;
    planned_hold_months?: number;
    dsr?: number | null;
    ltv?: number | null;
    metrics?: Record<string, unknown>;
    preferences?: UserPreferences;
  };
  scenarios?: Record<string, Record<string, ScenarioResult>>;
  next_steps?: string[];
}

// ============================================================================
// AI Comparison types
// ============================================================================

export interface AIComparisonResponse {
  summary: string;
  key_insights: string[];
  recommendation: string;
  best_for_cost?: string;
  best_for_stability?: string;
  best_for_approval?: string;
  suggested_questions: string[];
  tokens_used: number;
  error?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FollowupQuestionResponse {
  answer: string;
  tokens_used: number;
  questions_remaining: number;
  error?: string;
}

// ============================================================================
// Bank types
// ============================================================================

export interface Bank {
  id: string;
  name: string;
  short_name: string;
  bank_type?: BankType;
  logo_url: string | null;
  official_site?: string | null;
  contact_hotline?: string | null;
  description: string | null;
  coverage_provinces?: string[];
  processing_sla?: ProcessingSLA;
  source_urls?: string[];
  last_verified_at?: string | null;
  last_crawled_at?: string | null;
  data_confidence_score?: number;
  is_active: boolean;
  product_count?: number;
  active_product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BankCreate {
  name: string;
  short_name: string;
  bank_type?: BankType;
  logo_url?: string;
  official_site?: string;
  contact_hotline?: string;
  description?: string;
  coverage_provinces?: string[];
  processing_sla?: ProcessingSLA;
  source_urls?: string[];
  data_confidence_score?: number;
  is_active?: boolean;
}

export interface BankUpdate {
  name?: string;
  short_name?: string;
  bank_type?: BankType;
  logo_url?: string;
  official_site?: string;
  contact_hotline?: string;
  description?: string;
  coverage_provinces?: string[];
  processing_sla?: ProcessingSLA;
  source_urls?: string[];
  last_verified_at?: string;
  last_crawled_at?: string;
  data_confidence_score?: number;
  is_active?: boolean;
}

// ============================================================================
// Product Create/Update types for Admin
// ============================================================================

export interface ProductCreate {
  bank_id: string;
  name: string;
  purpose: ApplicationPurpose;
  description?: string;
  target_segment?: string[];
  currency?: string;
  effective_from?: string;
  effective_to?: string;
  min_loan_amount?: number;
  max_loan_amount?: number;
  max_ltv_pct?: number;
  min_term_months?: number;
  max_term_months?: number;
  max_age_at_maturity?: number;
  eligibility?: EligibilityRequirements;
  collateral?: CollateralRequirements;
  repayment?: RepaymentConfig;
  rate_fixed_months?: number;
  rate_fixed?: number;
  floating_margin?: number;
  reference_rate_name?: string;
  constraints_json?: ProductConstraints;
  sla_days_estimate?: number;
  reference_url?: string;
  is_active?: boolean;
}

export interface ProductUpdate {
  bank_id?: string;
  name?: string;
  purpose?: ApplicationPurpose;
  description?: string;
  target_segment?: string[];
  currency?: string;
  effective_from?: string;
  effective_to?: string;
  min_loan_amount?: number;
  max_loan_amount?: number;
  max_ltv_pct?: number;
  min_term_months?: number;
  max_term_months?: number;
  max_age_at_maturity?: number;
  eligibility?: EligibilityRequirements;
  collateral?: CollateralRequirements;
  repayment?: RepaymentConfig;
  rate_fixed_months?: number;
  rate_fixed?: number;
  floating_margin?: number;
  reference_rate_name?: string;
  constraints_json?: ProductConstraints;
  sla_days_estimate?: number;
  reference_url?: string;
  is_active?: boolean;
}

// ============================================================================
// Source Audit types
// ============================================================================

export interface SourceAudit {
  id: string;
  bank_id?: string;
  loan_product_id?: string;
  source_type: "WEB" | "PDF" | "MANUAL";
  source_url?: string;
  raw_text_snapshot?: string;
  html_pdf_hash?: string;
  page_version_hash?: string;
  crawled_at: string;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
}
