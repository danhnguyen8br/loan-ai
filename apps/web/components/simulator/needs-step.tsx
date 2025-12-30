'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Category = 'MORTGAGE_RE' | 'REFINANCE';

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

interface NeedsStepProps {
  category: Category;
  initialData?: LoanNeeds;
  onContinue: (needs: LoanNeeds) => void;
  onBack: () => void;
}

export function NeedsStep({ category, initialData, onContinue, onBack }: NeedsStepProps) {
  if (category === 'MORTGAGE_RE') {
    return (
      <MortgageNeedsForm
        initialData={initialData as MortgageNeeds | undefined}
        onContinue={onContinue}
        onBack={onBack}
      />
    );
  }
  return (
    <RefinanceNeedsForm
      initialData={initialData as RefinanceNeeds | undefined}
      onContinue={onContinue}
      onBack={onBack}
    />
  );
}

// =============================================================================
// Mortgage Needs Form
// =============================================================================

function MortgageNeedsForm({
  initialData,
  onContinue,
  onBack,
}: {
  initialData?: MortgageNeeds;
  onContinue: (needs: LoanNeeds) => void;
  onBack: () => void;
}) {
  const [propertyValue, setPropertyValue] = useState(
    initialData?.property_value_vnd ? initialData.property_value_vnd / 1e9 : 2.5
  );
  // Loan amount is user input, down payment is calculated
  const [loanAmountInput, setLoanAmountInput] = useState(
    initialData?.down_payment_vnd && initialData?.property_value_vnd
      ? (initialData.property_value_vnd - initialData.down_payment_vnd) / 1e9
      : 2
  );
  const [hasBudget, setHasBudget] = useState(!!initialData?.monthly_budget_vnd);
  const [budget, setBudget] = useState(
    initialData?.monthly_budget_vnd ? initialData.monthly_budget_vnd / 1e6 : 20
  );

  const downPayment = Math.max(0, propertyValue - loanAmountInput);
  const ltv = propertyValue > 0 ? (loanAmountInput / propertyValue) * 100 : 0;

  const isValid = propertyValue > 0 && loanAmountInput > 0 && ltv <= 80;

  const handleSubmit = () => {
    if (!isValid) return;

    const needs: MortgageNeeds = {
      category: 'MORTGAGE_RE',
      property_value_vnd: propertyValue * 1e9,
      down_payment_vnd: downPayment * 1e9,
      monthly_budget_vnd: hasBudget ? budget * 1e6 : undefined,
    };
    onContinue(needs);
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0">
      {/* Header - Hidden on desktop */}
      <div className="text-center lg:hidden">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Nhu Cầu Vay Mua BĐS</h2>
        <p className="text-sm text-gray-600">Chỉ cần 3 thông tin cơ bản</p>
      </div>

      {/* Form */}
      <Card variant="bordered">
        <CardBody className="space-y-4 sm:space-y-5 p-4 sm:p-6">
          {/* Property Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                className="pr-12 text-base sm:text-lg h-12 sm:h-auto"
                placeholder="2.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm sm:text-base">tỷ</span>
            </div>
          </div>

          {/* Loan Amount - User input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                className="pr-12 text-base sm:text-lg h-12 sm:h-auto"
                placeholder="2"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm sm:text-base">tỷ</span>
            </div>
          </div>

          {/* Calculated Down Payment & LTV */}
          <div className="bg-[#F7FFF3] rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm text-[#343839]">Tiền bạn cần có sẵn</span>
              <span className="text-lg sm:text-xl font-bold text-[#141718]">{downPayment.toFixed(2)} tỷ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-[#343839]">Tỷ lệ vay/giá nhà</span>
              <span
                className={`text-xs sm:text-sm font-medium ${ltv > 70 ? 'text-amber-600' : 'text-[#4DC614]'}`}
              >
                {ltv.toFixed(0)}%
              </span>
            </div>
            {ltv > 70 && ltv <= 80 && (
              <p className="text-[10px] sm:text-xs text-orange-600 mt-2">
                💡 Vay trên 70% giá nhà có thể cần điều kiện bổ sung
              </p>
            )}
            {ltv > 80 && (
              <p className="text-[10px] sm:text-xs text-red-600 mt-1">
                ⚠️ Hầu hết ngân hàng chỉ cho vay tối đa 80% giá trị tài sản
              </p>
            )}
          </div>

          {/* Budget Toggle */}
          <div className="border-t border-gray-100 pt-3 sm:pt-4">
            <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={hasBudget}
                onChange={(e) => setHasBudget(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4DC614] accent-[#4DC614] focus:ring-[#7CD734]"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Tôi muốn giới hạn số tiền trả mỗi tháng
                </span>
                <p className="text-xs text-gray-500">Hệ thống sẽ ưu tiên gói phù hợp ngân sách</p>
              </div>
            </label>

            {hasBudget && (
              <div className="mt-3 ml-8">
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    className="pr-20 sm:pr-24 text-base sm:text-lg h-12 sm:h-auto"
                    placeholder="20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs sm:text-sm">
                    triệu/tháng
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Navigation - Sticky on mobile, normal on desktop */}
      <div className="flex gap-3 pt-2 pb-4 sm:pb-6 lg:pb-0 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent lg:static lg:bg-transparent">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 sm:h-auto touch-manipulation">
          Quay lại
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} className="flex-1 h-12 sm:h-auto touch-manipulation">
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Refinance Needs Form
// =============================================================================

function RefinanceNeedsForm({
  initialData,
  onContinue,
  onBack,
}: {
  initialData?: RefinanceNeeds;
  onContinue: (needs: LoanNeeds) => void;
  onBack: () => void;
}) {
  const [remainingBalance, setRemainingBalance] = useState(
    initialData?.remaining_balance_vnd ? initialData.remaining_balance_vnd / 1e9 : 1.5
  );
  const [remainingBalanceText, setRemainingBalanceText] = useState<string>(String(remainingBalance));
  const [currentRate, setCurrentRate] = useState(initialData?.current_rate_pct ?? 10.5);
  const [currentRateText, setCurrentRateText] = useState<string>(String(currentRate));
  const [remainingMonths, setRemainingMonths] = useState(initialData?.remaining_months ?? 180);
  const [remainingMonthsText, setRemainingMonthsText] = useState<string>(String(remainingMonths));
  const [loanAgeMonths, setLoanAgeMonths] = useState(initialData?.loan_age_months ?? 24);
  const [hasBudget, setHasBudget] = useState(!!initialData?.monthly_budget_vnd);
  const [budget, setBudget] = useState(
    initialData?.monthly_budget_vnd ? initialData.monthly_budget_vnd / 1e6 : 15
  );

  const isValid = remainingBalance > 0 && currentRate > 0 && remainingMonths > 0;

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
    onContinue(needs);
  };

  const remainingYears = Math.floor(remainingMonths / 12);
  const remainingMonthsRemainder = remainingMonths % 12;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0">
      {/* Header - Hidden on desktop */}
      <div className="text-center lg:hidden">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Khoản Vay Hiện Tại</h2>
        <p className="text-sm text-gray-600">Thông tin để so sánh lợi ích chuyển ngân hàng</p>
      </div>

      {/* Form */}
      <Card variant="bordered">
        <CardBody className="space-y-4 sm:space-y-5 p-4 sm:p-6">
          {/* Remaining Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                className="pr-12 text-base sm:text-lg h-12 sm:h-auto"
                placeholder="1.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm sm:text-base">tỷ</span>
            </div>
          </div>

          {/* Current Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                className="pr-12 text-base sm:text-lg h-12 sm:h-auto"
                placeholder="10.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm sm:text-base">%</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              Xem hợp đồng vay hoặc app ngân hàng để biết lãi suất hiện tại
            </p>
          </div>

          {/* Two columns on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Remaining Months */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                className="text-base sm:text-lg h-12 sm:h-auto"
                placeholder="180"
              />
              {remainingMonths > 0 && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  ≈ {remainingYears} năm {remainingMonthsRemainder > 0 ? `${remainingMonthsRemainder} tháng` : ''}
                </p>
              )}
            </div>

            {/* Loan Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Đã trả được bao lâu? (tháng)
              </label>
              <Input
                type="number"
                min="0"
                max="120"
                inputMode="numeric"
                value={loanAgeMonths}
                onChange={(e) => setLoanAgeMonths(parseInt(e.target.value) || 0)}
                className="text-base sm:text-lg h-12 sm:h-auto"
                placeholder="24"
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                Ảnh hưởng đến phí tất toán sớm
              </p>
            </div>
          </div>

          {/* Budget Toggle */}
          <div className="border-t border-gray-100 pt-3 sm:pt-4">
            <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={hasBudget}
                onChange={(e) => setHasBudget(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4DC614] accent-[#4DC614] focus:ring-[#7CD734]"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Tôi muốn giới hạn số tiền trả mỗi tháng
                </span>
                <p className="text-xs text-gray-500">Hệ thống sẽ ưu tiên gói phù hợp ngân sách</p>
              </div>
            </label>

            {hasBudget && (
              <div className="mt-3 ml-8">
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    className="pr-20 sm:pr-24 text-base sm:text-lg h-12 sm:h-auto"
                    placeholder="15"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs sm:text-sm">
                    triệu/tháng
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Navigation - Sticky on mobile, normal on desktop */}
      <div className="flex gap-3 pt-2 pb-4 sm:pb-6 lg:pb-0 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent lg:static lg:bg-transparent">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 sm:h-auto touch-manipulation">
          Quay lại
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} className="flex-1 h-12 sm:h-auto touch-manipulation">
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}

