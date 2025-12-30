'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

type Category = 'MORTGAGE_RE' | 'REFINANCE';

// Loan needs types
export interface MortgageNeeds {
  category: 'MORTGAGE_RE';
  property_value_vnd: number;
  down_payment_vnd: number;
  monthly_budget_vnd?: number;
}

export interface RefinanceNeeds {
  category: 'REFINANCE';
  remaining_balance_vnd: number;
  current_rate_pct: number;
  remaining_months: number;
  loan_age_months: number;
  monthly_budget_vnd?: number;
}

export type LoanNeeds = MortgageNeeds | RefinanceNeeds;

// Intent types
export type MortgageIntent =
  | { type: 'MIN_MONTHLY'; max_monthly_vnd?: number }
  | { type: 'EARLY_PAYOFF'; exit_after_years: number };

export type RefinanceIntent = {
  type: 'OPTIMIZE_REFINANCE';
  max_monthly_vnd?: number;
};

export type RepaymentIntent = MortgageIntent | RefinanceIntent;

// Combined data
export interface CombinedNeedsIntent {
  needs: LoanNeeds;
  intent: RepaymentIntent;
}

interface CombinedNeedsIntentStepProps {
  category: Category;
  initialData?: CombinedNeedsIntent;
  onContinue: (data: CombinedNeedsIntent) => void;
  onBack: () => void;
}

export function CombinedNeedsIntentStep({
  category,
  initialData,
  onContinue,
  onBack,
}: CombinedNeedsIntentStepProps) {
  if (category === 'MORTGAGE_RE') {
    return (
      <MortgageCombinedForm
        initialData={initialData}
        onContinue={onContinue}
        onBack={onBack}
      />
    );
  }
  return (
    <RefinanceCombinedForm
      initialData={initialData}
      onContinue={onContinue}
      onBack={onBack}
    />
  );
}

// =============================================================================
// Mortgage Combined Form (Loan Info + Strategy)
// =============================================================================

function MortgageCombinedForm({
  initialData,
  onContinue,
  onBack,
}: {
  initialData?: CombinedNeedsIntent;
  onContinue: (data: CombinedNeedsIntent) => void;
  onBack: () => void;
}) {
  const initialNeeds = initialData?.needs as MortgageNeeds | undefined;
  const initialIntent = initialData?.intent as MortgageIntent | undefined;

  // Loan info state
  const [propertyValue, setPropertyValue] = useState(
    initialNeeds?.property_value_vnd ? initialNeeds.property_value_vnd / 1e9 : 2.5
  );
  // Loan amount is user input, down payment is calculated
  const [loanAmountInput, setLoanAmountInput] = useState(
    initialNeeds?.down_payment_vnd && initialNeeds?.property_value_vnd
      ? (initialNeeds.property_value_vnd - initialNeeds.down_payment_vnd) / 1e9
      : 2
  );

  // Strategy state
  const [selectedType, setSelectedType] = useState<'MIN_MONTHLY' | 'EARLY_PAYOFF'>(
    initialIntent?.type ?? 'MIN_MONTHLY'
  );
  const [hasMaxBudget, setHasMaxBudget] = useState(
    initialIntent?.type === 'MIN_MONTHLY' && !!initialIntent.max_monthly_vnd
  );
  const [maxMonthly, setMaxMonthly] = useState(
    initialIntent?.type === 'MIN_MONTHLY' && initialIntent.max_monthly_vnd
      ? initialIntent.max_monthly_vnd / 1e6
      : 20
  );
  const [exitYears, setExitYears] = useState(
    initialIntent?.type === 'EARLY_PAYOFF' ? initialIntent.exit_after_years : 3
  );

  const downPayment = Math.max(0, propertyValue - loanAmountInput);
  const ltv = propertyValue > 0 ? (loanAmountInput / propertyValue) * 100 : 0;

  const isValid =
    propertyValue > 0 &&
    loanAmountInput > 0 &&
    ltv <= 80 &&
    (selectedType === 'MIN_MONTHLY' ||
      (selectedType === 'EARLY_PAYOFF' && exitYears >= 1 && exitYears <= 10));

  const handleSubmit = () => {
    if (!isValid) return;

    const needs: MortgageNeeds = {
      category: 'MORTGAGE_RE',
      property_value_vnd: propertyValue * 1e9,
      down_payment_vnd: downPayment * 1e9,
      monthly_budget_vnd: hasMaxBudget && selectedType === 'MIN_MONTHLY' ? maxMonthly * 1e6 : undefined,
    };

    let intent: MortgageIntent;
    if (selectedType === 'MIN_MONTHLY') {
      intent = {
        type: 'MIN_MONTHLY',
        max_monthly_vnd: hasMaxBudget ? maxMonthly * 1e6 : undefined,
      };
    } else {
      intent = { type: 'EARLY_PAYOFF', exit_after_years: exitYears };
    }

    onContinue({ needs, intent });
  };

  return (
    <div className="space-y-4 sm:space-y-5 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Vay Mua Bất Động Sản</h2>
        <p className="text-base text-gray-600">Nhập thông tin và chọn cách trả phù hợp</p>
      </div>

      {/* Section 1: Loan Info */}
      <Card variant="bordered">
        <CardBody className="space-y-4 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 my-2">
            <span className="w-6 h-6 rounded-full bg-[#4DC614] text-white flex items-center justify-center text-sm">1</span>
            Thông tin khoản vay
          </h3>

          {/* Property Value */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1.5">
              Giá trị tài sản (tỷ đồng)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0.1"
                inputMode="decimal"
                value={propertyValue}
                onChange={(e) => setPropertyValue(parseFloat(e.target.value) || 0)}
                className="pr-12 text-lg h-12"
                placeholder="2.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base">tỷ</span>
            </div>
          </div>

          {/* Loan Amount - User input */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1.5">
              Số tiền cần vay (tỷ đồng)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0.1"
                inputMode="decimal"
                value={loanAmountInput}
                onChange={(e) => setLoanAmountInput(parseFloat(e.target.value) || 0)}
                className="pr-12 text-lg h-12"
                placeholder="2"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base">tỷ</span>
            </div>
          </div>

          {/* Calculated Down Payment & LTV */}
          <div className="bg-[#F7FFF3] rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#343839]">Tiền bạn cần có sẵn</span>
              <span className="text-xl font-bold text-[#141718]">{downPayment.toFixed(2)} tỷ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#343839]">Tỷ lệ vay/giá nhà</span>
              <span className={`text-sm font-medium ${ltv > 70 ? 'text-amber-600' : 'text-[#4DC614]'}`}>
                {ltv.toFixed(0)}%
              </span>
            </div>
            {ltv > 70 && ltv <= 80 && (
              <p className="text-sm text-orange-600 mt-1.5">
                💡 Vay trên 70% giá nhà có thể cần điều kiện bổ sung
              </p>
            )}
            {ltv > 80 && (
              <p className="text-sm text-red-600 mt-1.5">
                ⚠️ Hầu hết ngân hàng chỉ cho vay tối đa 80% giá trị tài sản
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Section 2: Strategy Selection */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1">
          <span className="w-6 h-6 rounded-full bg-[#4DC614] text-white flex items-center justify-center text-sm">2</span>
          Bạn muốn trả như thế nào?
        </h3>

        {/* Option 1: Minimize Monthly */}
        <Card
          variant="bordered"
          className={`cursor-pointer transition-all touch-manipulation ${
            selectedType === 'MIN_MONTHLY' ? 'ring-2 ring-[#7CD734] bg-[#F7FFF3]' : 'hover:bg-gray-50 active:bg-gray-100'
          }`}
          onClick={() => setSelectedType('MIN_MONTHLY')}
        >
          <CardBody className="p-3">
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedType === 'MIN_MONTHLY' ? 'border-[#4DC614]' : 'border-gray-300'
                  }`}
                >
                  {selectedType === 'MIN_MONTHLY' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4DC614]" />
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#F7FFF3] text-[#4DC614]">
                <Icons.TrendDown className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-base">Trả hàng tháng thấp nhất</h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  Tìm gói vay với số tiền trả mỗi tháng thấp nhất
                </p>

                {selectedType === 'MIN_MONTHLY' && (
                  <div className="mt-3 border-t border-[#7CD734]/30 pt-3" onClick={(e) => e.stopPropagation()}>
                    <label className="flex items-start gap-2.5 cursor-pointer touch-manipulation">
                      <input
                        type="checkbox"
                        checked={hasMaxBudget}
                        onChange={(e) => setHasMaxBudget(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4DC614] accent-[#4DC614]"
                      />
                      <span className="text-sm text-gray-700">
                        Tôi muốn giới hạn số tiền trả mỗi tháng
                      </span>
                    </label>

                    {hasMaxBudget && (
                      <div className="mt-2 ml-7">
                        <div className="relative">
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            inputMode="numeric"
                            value={maxMonthly}
                            onChange={(e) => setMaxMonthly(parseFloat(e.target.value) || 0)}
                            className="pr-24 h-11 text-base"
                            placeholder="20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                            triệu/tháng
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {[15, 20, 30, 50].map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => setMaxMonthly(amount)}
                              className={`px-3 py-1.5 text-sm rounded-full transition touch-manipulation ${
                                maxMonthly === amount
                                  ? 'bg-[#4DC614] text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {amount}tr
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Option 2: Early Payoff */}
        <Card
          variant="bordered"
          className={`cursor-pointer transition-all touch-manipulation ${
            selectedType === 'EARLY_PAYOFF' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50 active:bg-gray-100'
          }`}
          onClick={() => setSelectedType('EARLY_PAYOFF')}
        >
          <CardBody className="p-3">
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedType === 'EARLY_PAYOFF' ? 'border-purple-600' : 'border-gray-300'
                  }`}
                >
                  {selectedType === 'EARLY_PAYOFF' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600">
                <Icons.Lightning className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-base">Tôi sẽ trả hết sớm</h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  Dự định tất toán toàn bộ khoản vay sau vài năm
                </p>

                {selectedType === 'EARLY_PAYOFF' && (
                  <div className="mt-3 border-t border-purple-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    <p className="text-sm text-gray-700 mb-2">Dự kiến trả hết sau:</p>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 5, 7].map((years) => (
                        <button
                          key={years}
                          type="button"
                          onClick={() => setExitYears(years)}
                          className={`px-4 py-2 text-base rounded-lg transition touch-manipulation ${
                            exitYears === years
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {years} năm
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Navigation - Sticky on mobile */}
      <div className="flex gap-3 pt-2 pb-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent sm:static sm:bg-none">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 touch-manipulation">
          Quay lại
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} className="flex-1 h-12 touch-manipulation">
          Xem Kết Quả
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Refinance Combined Form (Loan Info + Strategy)
// =============================================================================

function RefinanceCombinedForm({
  initialData,
  onContinue,
  onBack,
}: {
  initialData?: CombinedNeedsIntent;
  onContinue: (data: CombinedNeedsIntent) => void;
  onBack: () => void;
}) {
  const initialNeeds = initialData?.needs as RefinanceNeeds | undefined;
  const initialIntent = initialData?.intent as RefinanceIntent | undefined;

  // Loan info state
  const [remainingBalance, setRemainingBalance] = useState(
    initialNeeds?.remaining_balance_vnd ? initialNeeds.remaining_balance_vnd / 1e9 : 1.5
  );
  const [remainingBalanceText, setRemainingBalanceText] = useState<string>(String(remainingBalance));
  const [currentRate, setCurrentRate] = useState(initialNeeds?.current_rate_pct ?? 10.5);
  const [currentRateText, setCurrentRateText] = useState<string>(String(currentRate));
  const [remainingMonths, setRemainingMonths] = useState(initialNeeds?.remaining_months ?? 180);
  const [remainingMonthsText, setRemainingMonthsText] = useState<string>(String(remainingMonths));
  const [loanAgeMonths, setLoanAgeMonths] = useState(initialNeeds?.loan_age_months ?? 24);

  // Strategy state (budget limit option for refinance)
  const [hasBudget, setHasBudget] = useState(!!initialIntent?.max_monthly_vnd);
  const [budget, setBudget] = useState(
    initialIntent?.max_monthly_vnd ? initialIntent.max_monthly_vnd / 1e6 : 15
  );

  const isValid = remainingBalance > 0 && currentRate > 0 && remainingMonths > 0;

  const remainingYears = Math.floor(remainingMonths / 12);
  const remainingMonthsRemainder = remainingMonths % 12;

  const handleSubmit = () => {
    if (!isValid) return;

    const needs: RefinanceNeeds = {
      category: 'REFINANCE',
      remaining_balance_vnd: remainingBalance * 1e9,
      current_rate_pct: currentRate,
      remaining_months: remainingMonths,
      loan_age_months: loanAgeMonths,
      monthly_budget_vnd: hasBudget ? budget * 1e6 : undefined,
    };

    const intent: RefinanceIntent = {
      type: 'OPTIMIZE_REFINANCE',
      max_monthly_vnd: hasBudget ? budget * 1e6 : undefined,
    };

    onContinue({ needs, intent });
  };

  return (
    <div className="space-y-4 sm:space-y-5 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Chuyển Ngân Hàng</h2>
        <p className="text-base text-gray-600">Nhập thông tin khoản vay hiện tại</p>
      </div>

      {/* Section 1: Current Loan Info */}
      <Card variant="bordered">
        <CardBody className="space-y-4 p-4 sm:p-5">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 my-2">
            <span className="w-6 h-6 rounded-full bg-[#4DC614] text-white flex items-center justify-center text-sm">1</span>
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base">tỷ</span>
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base">%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Xem hợp đồng vay hoặc app ngân hàng để biết lãi suất hiện tại
            </p>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Remaining Months */}
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
              {remainingMonths > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  ≈ {remainingYears} năm {remainingMonthsRemainder > 0 ? `${remainingMonthsRemainder}T` : ''}
                </p>
              )}
            </div>

            {/* Loan Age */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1.5">
                Đã trả (tháng)
              </label>
              <Input
                type="number"
                min="0"
                max="120"
                inputMode="numeric"
                value={loanAgeMonths}
                onChange={(e) => setLoanAgeMonths(parseInt(e.target.value) || 0)}
                className="text-lg h-12"
                placeholder="24"
              />
              <p className="text-sm text-gray-500 mt-1">
                Ảnh hưởng phí tất toán sớm
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Section 2: Strategy Selection */}
      <Card variant="bordered" className="bg-gradient-to-br from-[#F7FFF3] to-[#E8ECEF] border-[#7CD734]/50">
        <CardBody className="p-4 sm:p-5">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-[#4DC614] text-white flex items-center justify-center text-sm">2</span>
            Chiến lược chuyển ngân hàng
          </h3>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-[#F7FFF3] text-[#4DC614]">
              <Icons.Target className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base text-gray-800 font-medium mb-2">
                Hệ thống sẽ tự động tìm gói vay tối ưu nhất:
              </p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-[#4DC614] mt-0.5">✓</span>
                  <span>Trả ít hơn hiện tại</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#4DC614] mt-0.5">✓</span>
                  <span>Hoàn vốn nhanh nhất</span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget limit option for Refinance */}
          <div className="mt-4 pt-3 border-t border-[#7CD734]/30">
            <label className="flex items-start gap-2.5 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={hasBudget}
                onChange={(e) => setHasBudget(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4DC614] accent-[#4DC614] focus:ring-[#7CD734]"
              />
              <div>
                <span className="text-base font-medium text-gray-700">
                  Tôi muốn giới hạn số tiền trả mỗi tháng
                </span>
                <p className="text-sm text-gray-500">Hệ thống sẽ ưu tiên gói phù hợp ngân sách</p>
              </div>
            </label>

            {hasBudget && (
              <div className="mt-3 ml-7">
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    className="pr-24 h-11 text-base"
                    placeholder="15"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                    triệu/tháng
                  </span>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[10, 15, 20, 30].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBudget(amount)}
                      className={`px-3 py-1.5 text-sm rounded-full transition touch-manipulation ${
                        budget === amount
                          ? 'bg-[#4DC614] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {amount}tr
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Icons.InfoCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Nếu không có gói nào thỏa mãn điều kiện, hệ thống sẽ cho bạn biết và gợi ý có nên chuyển hay không.
          </p>
        </div>
      </div>

      {/* Navigation - Sticky on mobile */}
      <div className="flex gap-3 pt-2 pb-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent sm:static sm:bg-none">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 touch-manipulation">
          Quay lại
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} className="flex-1 h-12 touch-manipulation">
          Tìm Gói Tốt Nhất
        </Button>
      </div>
    </div>
  );
}

