'use client';

import { useState } from 'react';

// Extend Window interface for Google Analytics gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

// Collapsible details component
function StrategyDetails({ 
  children, 
  color = 'green' 
}: { 
  children: React.ReactNode; 
  color?: 'green' | 'purple';
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Using design tokens for consistent colors
  const colorClasses = color === 'purple' 
    ? 'text-purple-600 hover:text-purple-700 border-purple-200' 
    : 'text-primary-700 hover:text-primary-700 border-primary/30';
  
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`text-xs flex items-center gap-1 ${colorClasses} transition-colors`}
      >
        <Icons.InfoCircle className="w-3.5 h-3.5" />
        {isOpen ? 'Ẩn chi tiết' : 'Xem chi tiết chiến lược'}
        <Icons.ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className={`mt-2 p-3 rounded-lg text-sm ${color === 'purple' ? 'bg-purple-50/50' : 'bg-primary-50/50'} border ${color === 'purple' ? 'border-purple-100' : 'border-primary/20'}`}>
          {children}
        </div>
      )}
    </div>
  );
}

type Mode = 'MORTGAGE_RE' | 'REFINANCE';

// =============================================================================
// Export Types
// =============================================================================

// Mortgage types
export interface MortgageNeedsStrategy {
  mode: 'MORTGAGE_RE';
  loan_amount_vnd: number;
  // Auto-calculated
  min_property_value_vnd: number;
  required_down_payment_vnd: number;
  // Strategy
  strategy: MortgageStrategy;
}

export type MortgageStrategy =
  | { type: 'PAY_OFF_FAST'; monthly_income_vnd: number; existing_debt_monthly_vnd: number }
  | { type: 'LOW_MONTHLY_SETTLE_LATER'; settle_after_years: number };

// Refinance types
export interface RefinanceNeedsStrategy {
  mode: 'REFINANCE';
  remaining_balance_vnd: number;
  current_rate_pct: number;
  remaining_months: number;
  old_prepay_fee_pct: number; // Direct prepayment fee % instead of loan_age_months
  // Strategy questions
  hold_duration_months: 12 | 24 | 36 | 60;
  priority: 'REDUCE_PAYMENT' | 'MAX_TOTAL_SAVINGS';
  plan_early_settle: boolean;
}

export type NeedsStrategy = MortgageNeedsStrategy | RefinanceNeedsStrategy;

// =============================================================================
// Component Props
// =============================================================================

interface NeedsStrategyStepProps {
  initialData?: NeedsStrategy;
  onContinue: (data: NeedsStrategy) => void;
}

export function NeedsStrategyStep({ initialData, onContinue }: NeedsStrategyStepProps) {
  const [mode, setMode] = useState<Mode>(initialData?.mode ?? 'MORTGAGE_RE');

  return (
    <div className="space-y-4 sm:space-y-5 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Tìm Gói Vay Phù Hợp</h2>
        <p className="text-base text-gray-600">Nhập thông tin để tìm gói vay phù hợp với nhu cầu của bạn</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl bg-leadity-gray-lighter p-1">
        <button
          type="button"
          onClick={() => setMode('MORTGAGE_RE')}
          className={`flex-1 py-3 sm:py-3.5 px-3 sm:px-4 rounded-lg text-base font-medium transition-all touch-manipulation flex items-center justify-center gap-2 ${
            mode === 'MORTGAGE_RE'
              ? 'bg-white text-dark-darker shadow-sm'
              : 'text-leadity-gray-muted hover:text-dark-darker active:bg-leadity-gray-light'
          }`}
        >
          <Icons.Mortgage className={`w-5 h-5 ${mode === 'MORTGAGE_RE' ? 'text-primary-700' : ''}`} />
          Vay Mua BĐS
        </button>
        <button
          type="button"
          onClick={() => setMode('REFINANCE')}
          className={`flex-1 py-3 sm:py-3.5 px-3 sm:px-4 rounded-lg text-base font-medium transition-all touch-manipulation flex items-center justify-center gap-2 ${
            mode === 'REFINANCE'
              ? 'bg-white text-dark-darker shadow-sm'
              : 'text-leadity-gray-muted hover:text-dark-darker active:bg-leadity-gray-light'
          }`}
        >
          <Icons.BankTransfer className={`w-5 h-5 ${mode === 'REFINANCE' ? 'text-primary-700' : ''}`} />
          Chuyển Ngân Hàng
        </button>
      </div>

      {/* Form based on mode */}
      {mode === 'MORTGAGE_RE' ? (
        <MortgageForm
          initialData={initialData?.mode === 'MORTGAGE_RE' ? initialData : undefined}
          onContinue={onContinue}
        />
      ) : (
        <RefinanceForm
          initialData={initialData?.mode === 'REFINANCE' ? initialData : undefined}
          onContinue={onContinue}
        />
      )}
    </div>
  );
}

// =============================================================================
// Mortgage Form
// =============================================================================

const LTV_MAX = 0.8; // 80% LTV max
const BANK_VALUATION_DISCOUNT = 0.85; // Banks typically value at 85% of market price

function MortgageForm({
  initialData,
  onContinue,
}: {
  initialData?: MortgageNeedsStrategy;
  onContinue: (data: NeedsStrategy) => void;
}) {
  const SETTLE_AFTER_YEARS_PRESETS = [1, 2, 3, 5, 7] as const;
  const SETTLE_AFTER_YEARS_MIN = 1;
  const SETTLE_AFTER_YEARS_MAX = 30;

  // Loan amount input (tỷ đồng)
  const [loanAmount, setLoanAmount] = useState(
    initialData?.loan_amount_vnd ? initialData.loan_amount_vnd / 1e9 : 2
  );
  const [loanAmountText, setLoanAmountText] = useState<string>(String(loanAmount));

  // Strategy selection
  const [strategyType, setStrategyType] = useState<'PAY_OFF_FAST' | 'LOW_MONTHLY_SETTLE_LATER'>(
    initialData?.strategy.type ?? 'PAY_OFF_FAST'
  );

  // Strategy details
  const [monthlyIncome, setMonthlyIncome] = useState(
    initialData?.strategy.type === 'PAY_OFF_FAST'
      ? initialData.strategy.monthly_income_vnd / 1e6
      : 50
  );
  const [monthlyIncomeText, setMonthlyIncomeText] = useState<string>(String(monthlyIncome));
  const [existingDebtMonthly, setExistingDebtMonthly] = useState(
    initialData?.strategy.type === 'PAY_OFF_FAST'
      ? initialData.strategy.existing_debt_monthly_vnd / 1e6
      : 0
  );
  const [existingDebtMonthlyText, setExistingDebtMonthlyText] = useState<string>(String(existingDebtMonthly));
  const initialSettleAfterYears =
    initialData?.strategy.type === 'LOW_MONTHLY_SETTLE_LATER'
      ? initialData.strategy.settle_after_years
      : 3;

  const [settleAfterYears, setSettleAfterYears] = useState(initialSettleAfterYears);
  const [useCustomSettleYears, setUseCustomSettleYears] = useState(
    !SETTLE_AFTER_YEARS_PRESETS.includes(initialSettleAfterYears as (typeof SETTLE_AFTER_YEARS_PRESETS)[number])
  );
  const [customSettleYearsText, setCustomSettleYearsText] = useState(String(initialSettleAfterYears));

  // Auto-calculate property value and down payment
  // loan_amount = property_value * LTV_MAX
  // But bank values property at BANK_VALUATION_DISCOUNT of market
  // So: loan_amount = market_property_value * BANK_VALUATION_DISCOUNT * LTV_MAX
  // => market_property_value = loan_amount / (BANK_VALUATION_DISCOUNT * LTV_MAX)
  const minPropertyValue = loanAmount / (BANK_VALUATION_DISCOUNT * LTV_MAX);
  const bankValuation = minPropertyValue * BANK_VALUATION_DISCOUNT;
  const requiredDownPayment = bankValuation - loanAmount; // This equals 20% of bank valuation

  const isValid =
    loanAmount >= 0.1 &&
    (strategyType === 'PAY_OFF_FAST'
      ? monthlyIncome >= 5
      : settleAfterYears >= SETTLE_AFTER_YEARS_MIN && settleAfterYears <= SETTLE_AFTER_YEARS_MAX);

  const handleSubmit = () => {
    if (!isValid) return;

    // Track GA event for viewing loan packages
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'view_loan_packages', {
        event_category: 'Simulator',
        event_label: 'Mortgage',
        loan_amount: loanAmount,
        strategy_type: strategyType,
      });
    }

    const strategy: MortgageStrategy =
      strategyType === 'PAY_OFF_FAST'
        ? { type: 'PAY_OFF_FAST', monthly_income_vnd: monthlyIncome * 1e6, existing_debt_monthly_vnd: existingDebtMonthly * 1e6 }
        : { type: 'LOW_MONTHLY_SETTLE_LATER', settle_after_years: settleAfterYears };

    onContinue({
      mode: 'MORTGAGE_RE',
      loan_amount_vnd: loanAmount * 1e9,
      min_property_value_vnd: minPropertyValue * 1e9,
      required_down_payment_vnd: requiredDownPayment * 1e9,
      strategy,
    });
  };

  return (
    <div className="space-y-4">
      {/* Section 1: Loan Amount */}
      <Card variant="bordered">
        <CardBody className="space-y-4 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-dark flex items-center gap-2 my-2">
            <span className="w-6 h-6 rounded-full bg-primary-700 text-text-inverse flex items-center justify-center text-sm">
              1
            </span>
            Số tiền cần vay
          </h3>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1.5">
              Bạn muốn vay bao nhiêu? (tỷ đồng)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0.1"
                inputMode="decimal"
                value={loanAmountText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setLoanAmountText(raw);
                  if (raw === '') {
                    setLoanAmount(0);
                    return;
                  }
                  const parsed = Number.parseFloat(raw);
                  if (!Number.isFinite(parsed)) return;
                  setLoanAmount(parsed);
                }}
                className="pr-12 text-lg h-12"
                placeholder="2"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base">
                tỷ
              </span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[1, 1.5, 2, 3, 5].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setLoanAmount(amount);
                    setLoanAmountText(String(amount));
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full transition touch-manipulation ${
                    loanAmount === amount
                      ? 'bg-primary-700 text-text-inverse'
                      : 'bg-leadity-gray-lighter text-leadity-gray hover:bg-leadity-gray-light'
                  }`}
                >
                  {amount} tỷ
                </button>
              ))}
            </div>
          </div>

          {/* Auto-calculated info */}
          {loanAmount > 0 && (
            <div className="bg-primary-50 rounded-xl p-4">
              <div className="flex gap-3">
                <Icons.InfoCircle className="w-5 h-5 text-primary-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-leadity-gray leading-relaxed">
                  <p>
                    Giá trị BĐS thế chấp nên có giá thị trường tối thiểu{' '}
                    <span className="font-semibold text-dark-darker">{minPropertyValue.toFixed(2)} tỷ</span>.
                  </p>
                  <p className="mt-1.5">
                    Dự tính ngân hàng sẽ định giá ~85%:{' '}
                    <span className="font-medium text-dark">{bankValuation.toFixed(2)} tỷ</span>, 
                    và cho vay tối đa 80%.
                  </p>
                  <p className="mt-1.5 text-xs text-text-muted italic">
                    Các chỉ số này sẽ thay đổi theo chính sách ngân hàng.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 2: Strategy Selection */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-dark flex items-center gap-2 px-1">
          <span className="w-6 h-6 rounded-full bg-primary-700 text-text-inverse flex items-center justify-center text-sm">
            2
          </span>
          Chiến lược trả nợ
        </h3>

        {/* Strategy 1: Pay off fast */}
        <Card
          variant="bordered"
          className={`cursor-pointer transition-all touch-manipulation ${
            strategyType === 'PAY_OFF_FAST'
              ? 'ring-2 ring-primary bg-primary-50'
              : 'hover:bg-leadity-gray-lighter active:bg-leadity-gray-light'
          }`}
          onClick={() => setStrategyType('PAY_OFF_FAST')}
        >
          <CardBody className="p-3 sm:p-4">
            <div className="flex items-start gap-2.5">
              <div className="pt-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    strategyType === 'PAY_OFF_FAST' ? 'border-primary-dark' : 'border-leadity-gray-light'
                  }`}
                >
                  {strategyType === 'PAY_OFF_FAST' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-dark" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-dark-darker text-base flex items-start gap-1.5">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-50 text-amber-500 flex-shrink-0 mt-0.5">
                    <Icons.Lightning className="w-4 h-4" />
                  </span>
                  Tôi muốn trả nợ xong sớm nhất
                </h4>
                <p className="text-sm text-leadity-gray-muted mt-1">
                  Khuyến nghị rõ ràng để bạn chọn đúng gói và không ảnh hưởng dòng tiền hàng tháng.
                </p>

                <StrategyDetails color="green">
                  <ul className="text-sm text-leadity-gray space-y-1 list-disc list-inside">
                    <li>Mục tiêu: trả hết nợ nhanh nhất nhưng không vượt ngưỡng an toàn mỗi tháng.</li>
                    <li>Tỷ lệ nợ/thu nhập khuyến nghị: 30–40% thu nhập gia đình (mặc định đề xuất 35%).</li>
                    <li>Kỳ hạn đề xuất: kỳ hạn ngắn nhất mà khoản trả (kịch bản lãi tăng +2%) vẫn nằm trong ngân sách.</li>
                    <li>Ưu tiên gói vay: phí trả trước hạn thấp/giảm nhanh • biên độ lãi thả nổi (margin) thấp, minh bạch • tránh ân hạn gốc.</li>
                  </ul>
                  <p className="mt-2 text-xs text-text-muted italic">
                    Hệ thống đang tối ưu: (1) tháng dự kiến tất toán sớm nhất → (2) tổng chi phí vay (không gồm gốc) thấp nhất → (3) khoản trả ổn định khi lãi suất tăng.
                  </p>
                </StrategyDetails>

                {strategyType === 'PAY_OFF_FAST' && (
                  <div className="mt-3 border-t border-primary/30 pt-3 space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Monthly income input */}
                    <div>
                      <label className="block text-sm font-medium text-leadity-gray mb-1.5">
                        Thu nhập gia đình hàng tháng
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="1"
                          min="5"
                          inputMode="numeric"
                          value={monthlyIncomeText}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setMonthlyIncomeText(raw);
                            if (raw === '') {
                              setMonthlyIncome(0);
                              return;
                            }
                            const parsed = Number.parseFloat(raw);
                            if (!Number.isFinite(parsed)) return;
                            setMonthlyIncome(parsed);
                          }}
                          className="pr-24 h-11 text-base"
                          placeholder="50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                          triệu/tháng
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {[30, 50, 80, 100, 150].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => {
                              setMonthlyIncome(amount);
                              setMonthlyIncomeText(String(amount));
                            }}
                            className={`px-3 py-1.5 text-sm rounded-full transition touch-manipulation ${
                              monthlyIncome === amount
                                ? 'bg-primary-700 text-text-inverse'
                                : 'bg-white text-leadity-gray hover:bg-leadity-gray-lighter border border-leadity-gray-light'
                            }`}
                          >
                            {amount}tr
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Existing monthly debt input */}
                    <div>
                      <label className="block text-sm font-medium text-leadity-gray mb-1.5">
                        Số nợ đang trả hàng tháng (nếu có)
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          inputMode="numeric"
                          value={existingDebtMonthlyText}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setExistingDebtMonthlyText(raw);
                            if (raw === '') {
                              setExistingDebtMonthly(0);
                              return;
                            }
                            const parsed = Number.parseFloat(raw);
                            if (!Number.isFinite(parsed)) return;
                            setExistingDebtMonthly(parsed);
                          }}
                          className="pr-24 h-11 text-base"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                          triệu/tháng
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-1.5">
                        Bao gồm trả góp xe, thẻ tín dụng, khoản vay khác...
                      </p>
                    </div>

                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <Icons.LightBulb className="w-3.5 h-3.5 text-status-warning" />
                      Tỷ lệ nợ/thu nhập khuyến nghị 30–40% (mặc định 35%) để an toàn dòng tiền
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Strategy 2: Low monthly + settle later */}
        <Card
          variant="bordered"
          className={`cursor-pointer transition-all touch-manipulation ${
            strategyType === 'LOW_MONTHLY_SETTLE_LATER'
              ? 'ring-2 ring-purple-500 bg-purple-50'
              : 'hover:bg-gray-50 active:bg-gray-100'
          }`}
          onClick={() => setStrategyType('LOW_MONTHLY_SETTLE_LATER')}
        >
          <CardBody className="p-3 sm:p-4">
            <div className="flex items-start gap-2.5">
              <div className="pt-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    strategyType === 'LOW_MONTHLY_SETTLE_LATER' ? 'border-purple-600' : 'border-gray-300'
                  }`}
                >
                  {strategyType === 'LOW_MONTHLY_SETTLE_LATER' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-base flex items-start gap-1.5">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 flex-shrink-0 mt-0.5">
                    <Icons.CoinStack className="w-4 h-4" />
                  </span>
                  Tôi muốn khoản trả hàng tháng thấp nhất, rồi tất toán sau {settleAfterYears} năm
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Phù hợp nếu bạn muốn số tiền thanh toán thấp nhất và dự kiến có khoản tiền lớn để tất toán.
                </p>

                <StrategyDetails color="purple">
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>
                      Mục tiêu: tối thiểu hóa khoản phải trả hàng tháng khi bạn còn giữ khoản vay, và tất toán toàn bộ ở năm{' '}
                      {settleAfterYears}.
                    </li>
                    <li>
                      Kỳ hạn đề xuất: thường dài hơn để giảm nghĩa vụ tháng (nhưng bạn vẫn tất toán ở năm {settleAfterYears}).
                    </li>
                    <li>
                      Ưu tiên gói vay: phí trả trước hạn tại mốc {settleAfterYears} năm thấp nhất (#1) • lãi ưu đãi phù hợp giai
                      đoạn bạn giữ • phí/điều kiện kèm tối ưu lợi ích.
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-500 italic">
                    Hệ thống đang tối ưu: ép tất toán tại H = {settleAfterYears}×12 (cộng phí trả trước hạn) rồi tối ưu: (1) khoản
                    trả hàng tháng thấp nhất → (2) tổng chi phí vay đến H thấp nhất.
                  </p>
                </StrategyDetails>

                {strategyType === 'LOW_MONTHLY_SETTLE_LATER' && (
                  <div className="mt-3 border-t border-purple-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    <p className="text-sm text-gray-700 mb-2">Dự kiến tất toán sau:</p>
                    <div className="flex gap-2 flex-wrap">
                      {SETTLE_AFTER_YEARS_PRESETS.map((years) => (
                        <button
                          key={years}
                          type="button"
                          onClick={() => {
                            setUseCustomSettleYears(false);
                            setSettleAfterYears(years);
                            setCustomSettleYearsText(String(years));
                          }}
                          className={`px-4 py-2 text-base rounded-lg transition touch-manipulation ${
                            !useCustomSettleYears && settleAfterYears === years
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {years} năm
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setUseCustomSettleYears(true)}
                        className={`px-4 py-2 text-base rounded-lg transition touch-manipulation ${
                          useCustomSettleYears ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Khác
                      </button>
                    </div>
                    {useCustomSettleYears && (
                      <div className="mt-3">
                        <label className="block text-xs text-gray-600 mb-1">
                          Nhập số năm muốn tất toán (từ {SETTLE_AFTER_YEARS_MIN} đến {SETTLE_AFTER_YEARS_MAX})
                        </label>
                        <div className="relative max-w-[220px]">
                          <Input
                            type="number"
                            min={SETTLE_AFTER_YEARS_MIN}
                            max={SETTLE_AFTER_YEARS_MAX}
                            step="1"
                            inputMode="numeric"
                            value={customSettleYearsText}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setCustomSettleYearsText(raw);
                              const parsed = Number.parseInt(raw, 10);
                              if (!Number.isFinite(parsed)) return;
                              const clamped = Math.min(SETTLE_AFTER_YEARS_MAX, Math.max(SETTLE_AFTER_YEARS_MIN, parsed));
                              setSettleAfterYears(clamped);
                            }}
                            className="pr-14 h-11 text-base"
                            placeholder="3"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">năm</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* CTA Button */}
      <div className="pt-2 pb-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent sm:static sm:bg-none">
        <Button onClick={handleSubmit} disabled={!isValid} className="w-full h-12 touch-manipulation">
          Xem Gói Vay Phù Hợp
          <Icons.ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Refinance Form
// =============================================================================

function RefinanceForm({
  initialData,
  onContinue,
}: {
  initialData?: RefinanceNeedsStrategy;
  onContinue: (data: NeedsStrategy) => void;
}) {
  // Current loan info
  const [remainingBalance, setRemainingBalance] = useState(
    initialData?.remaining_balance_vnd ? initialData.remaining_balance_vnd / 1e9 : 1.5
  );
  const [remainingBalanceText, setRemainingBalanceText] = useState<string>(String(remainingBalance));
  const [currentRate, setCurrentRate] = useState(initialData?.current_rate_pct ?? 10.5);
  const [currentRateText, setCurrentRateText] = useState<string>(String(currentRate));
  const [remainingMonths, setRemainingMonths] = useState(initialData?.remaining_months ?? 180);
  const [remainingMonthsText, setRemainingMonthsText] = useState<string>(String(remainingMonths));
  const [oldPrepayFeePct, setOldPrepayFeePct] = useState(initialData?.old_prepay_fee_pct ?? 2);
  const [oldPrepayFeePctText, setOldPrepayFeePctText] = useState<string>(String(oldPrepayFeePct));

  // Strategy questions
  const [holdDuration, setHoldDuration] = useState<12 | 24 | 36 | 60>(
    initialData?.hold_duration_months ?? 36
  );
  const [priority, setPriority] = useState<'REDUCE_PAYMENT' | 'MAX_TOTAL_SAVINGS'>(
    initialData?.priority ?? 'REDUCE_PAYMENT'
  );
  const [planEarlySettle, setPlanEarlySettle] = useState(initialData?.plan_early_settle ?? false);

  const isValid = remainingBalance > 0 && currentRate > 0 && remainingMonths > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    // Track GA event for viewing loan packages
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'view_loan_packages', {
        event_category: 'Simulator',
        event_label: 'Refinance',
        remaining_balance: remainingBalance,
        priority: priority,
      });
    }

    onContinue({
      mode: 'REFINANCE',
      remaining_balance_vnd: remainingBalance * 1e9,
      current_rate_pct: currentRate,
      remaining_months: remainingMonths,
      old_prepay_fee_pct: oldPrepayFeePct,
      hold_duration_months: holdDuration,
      priority,
      plan_early_settle: planEarlySettle,
    });
  };

  return (
    <div className="space-y-4">
      {/* Section 1: Current Loan Info */}
      <Card variant="bordered">
        <CardBody className="space-y-4 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 my-2">
            <span className="w-6 h-6 rounded-full bg-[#4DC614] text-white flex items-center justify-center text-sm">
              1
            </span>
            Khoản vay hiện tại
          </h3>

          {/* Remaining Balance */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1.5">
              Dư nợ còn lại (tỷ đồng)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0.1"
                inputMode="decimal"
                value={remainingBalanceText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setRemainingBalanceText(raw);
                  if (raw === '') {
                    setRemainingBalance(0);
                    return;
                  }
                  const parsed = Number.parseFloat(raw);
                  if (!Number.isFinite(parsed)) return;
                  setRemainingBalance(parsed);
                }}
                className="pr-12 text-lg h-12"
                placeholder="1.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base">
                tỷ
              </span>
            </div>
          </div>

          {/* Current Rate */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1.5">
              Lãi suất hiện tại (%/năm)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="1"
                max="20"
                inputMode="decimal"
                value={currentRateText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setCurrentRateText(raw);
                  if (raw === '') {
                    setCurrentRate(0);
                    return;
                  }
                  const parsed = Number.parseFloat(raw);
                  if (!Number.isFinite(parsed)) return;
                  setCurrentRate(parsed);
                }}
                className="pr-12 text-lg h-12"
                placeholder="10.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base">
                %
              </span>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1.5">
                Số tháng còn lại
              </label>
              <Input
                type="number"
                min="12"
                max="360"
                inputMode="numeric"
                value={remainingMonthsText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setRemainingMonthsText(raw);
                  if (raw === '') {
                    setRemainingMonths(0);
                    return;
                  }
                  const parsed = Number.parseInt(raw, 10);
                  if (!Number.isFinite(parsed)) return;
                  setRemainingMonths(parsed);
                }}
                className="text-lg h-12"
                placeholder="180"
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-1.5">
                Phí tất toán (%)
              </label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="5"
                inputMode="decimal"
                value={oldPrepayFeePctText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setOldPrepayFeePctText(raw);
                  if (raw === '') {
                    setOldPrepayFeePct(0);
                    return;
                  }
                  const parsed = Number.parseFloat(raw);
                  if (!Number.isFinite(parsed)) return;
                  setOldPrepayFeePct(parsed);
                }}
                className="text-lg h-12"
                placeholder="2"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Section 2: Strategy Questions */}
      <Card variant="bordered" className="bg-gradient-to-br from-[#F7FFF3] to-white border-[#7CD734]/50">
        <CardBody className="space-y-4 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 my-2">
            <span className="w-6 h-6 rounded-full bg-[#4DC614] text-white flex items-center justify-center text-sm">
              2
            </span>
            Chiến lược chuyển ngân hàng
          </h3>

          {/* Question 1: Hold Duration */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Bạn giữ khoản vay mới thêm bao lâu?
            </label>
            <div className="flex gap-2 flex-wrap">
              {([12, 24, 36, 60] as const).map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setHoldDuration(months)}
                  className={`px-4 py-2.5 text-sm rounded-lg transition touch-manipulation ${
                    holdDuration === months
                      ? 'bg-[#4DC614] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {months === 60 ? '5+ năm' : `${months / 12} năm`}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Priority Toggle */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Bạn muốn ưu tiên gì?
            </label>
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setPriority('REDUCE_PAYMENT')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all touch-manipulation flex items-center justify-center gap-1.5 ${
                  priority === 'REDUCE_PAYMENT'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <Icons.TrendDown className={`w-4 h-4 ${priority === 'REDUCE_PAYMENT' ? 'text-[#4DC614]' : ''}`} />
                Giảm payment ngay
              </button>
              <button
                type="button"
                onClick={() => setPriority('MAX_TOTAL_SAVINGS')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all touch-manipulation flex items-center justify-center gap-1.5 ${
                  priority === 'MAX_TOTAL_SAVINGS'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <Icons.TrendUp className={`w-4 h-4 ${priority === 'MAX_TOTAL_SAVINGS' ? 'text-[#4DC614]' : ''}`} />
                Tiết kiệm tổng nhiều nhất
              </button>
            </div>
          </div>

          {/* Question 3: Early Settle Plan */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Bạn có kế hoạch tất toán sớm lần nữa không?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPlanEarlySettle(false)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all touch-manipulation border-2 flex items-center justify-center gap-2 ${
                  !planEarlySettle
                    ? 'border-[#4DC614] bg-[#F7FFF3] text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icons.X className={`w-4 h-4 ${!planEarlySettle ? 'text-red-500' : ''}`} />
                Không có kế hoạch
              </button>
              <button
                type="button"
                onClick={() => setPlanEarlySettle(true)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all touch-manipulation border-2 flex items-center justify-center gap-2 ${
                  planEarlySettle
                    ? 'border-[#4DC614] bg-[#F7FFF3] text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icons.Check className={`w-4 h-4 ${planEarlySettle ? 'text-[#4DC614]' : ''}`} />
                Có thể sẽ tất toán
              </button>
            </div>
            {planEarlySettle && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                <Icons.LightBulb className="w-4 h-4" />
                Hệ thống sẽ ưu tiên gói có phí tất toán sớm thấp
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* CTA Button */}
      <div className="pt-2 pb-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent sm:static sm:bg-none">
        <Button onClick={handleSubmit} disabled={!isValid} className="w-full h-12 touch-manipulation">
          Xem Gói Vay Phù Hợp
          <Icons.ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

