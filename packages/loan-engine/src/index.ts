// Types
export * from './types';

// Engine functions
export {
  roundVND,
  addMonths,
  calculatePMT,
  buildRateTimeline,
  buildRateTimelineLegacy,
  buildFixedRateTimeline,
  getPrepaymentFeePct,
  getOldLoanPrepaymentFeePct,
  calculatePrepaymentFee,
  calculateOldLoanPrepaymentFee,
  calculateUpfrontFees,
  calculateClosingCash,
  getMilestonePayoffMonth,
  getRefinanceTimingMonth,
  getExtraPrincipal,
  getExitPayoffMonth,
  // Core simulation functions
  simulateLoanSchedule,
  simulateMortgagePurchase,
  simulateOldLoanBaseline,
  computeOldLoanPayoffAtRefinance,
  simulateRefinance,
  // Multi-strategy simulation functions
  simulateMortgageAllStrategies,
  simulateRefinanceAllStrategies,
  findOptimalRefinanceTiming,
  // Strategy labels
  MORTGAGE_STRATEGY_LABELS,
  REFINANCE_STRATEGY_LABELS,
  // Legacy
  generateSchedule,
  calculateAPR,
} from './engine';

// Export types from engine
export type {
  RateTimelineEntry,
  LoanScheduleParams,
  LoanScheduleResult,
  OldLoanBaselineResult,
  OldLoanPayoffResult,
} from './engine';

// Template functions and data
export {
  PRODUCT_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getAllTemplates,
} from './templates';
