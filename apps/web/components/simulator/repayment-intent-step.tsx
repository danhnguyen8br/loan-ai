'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

type Category = 'MORTGAGE_RE' | 'REFINANCE';

// Simplified intent types
export type MortgageIntent =
  | { type: 'MIN_MONTHLY'; max_monthly_vnd?: number }
  | { type: 'EARLY_PAYOFF'; exit_after_years: number };

export type RefinanceIntent = {
  type: 'OPTIMIZE_REFINANCE';
  // System will find best package that:
  // 1. Has lower monthly payment than current
  // 2. Has fastest break-even time
};

export type RepaymentIntent = MortgageIntent | RefinanceIntent;

interface RepaymentIntentStepProps {
  category: Category;
  initialIntent?: RepaymentIntent;
  onContinue: (intent: RepaymentIntent) => void;
  onBack: () => void;
}

export function RepaymentIntentStep({
  category,
  initialIntent,
  onContinue,
  onBack,
}: RepaymentIntentStepProps) {
  if (category === 'MORTGAGE_RE') {
    return (
      <MortgageIntentForm
        initialIntent={initialIntent as MortgageIntent | undefined}
        onContinue={onContinue}
        onBack={onBack}
      />
    );
  }

  return (
    <RefinanceIntentForm
      onContinue={onContinue}
      onBack={onBack}
    />
  );
}

// =============================================================================
// Mortgage Intent Form (2 options)
// =============================================================================

function MortgageIntentForm({
  initialIntent,
  onContinue,
  onBack,
}: {
  initialIntent?: MortgageIntent;
  onContinue: (intent: RepaymentIntent) => void;
  onBack: () => void;
}) {
  const [selectedType, setSelectedType] = useState<'MIN_MONTHLY' | 'EARLY_PAYOFF' | null>(
    initialIntent?.type ?? null
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

  const isValid =
    selectedType === 'MIN_MONTHLY' ||
    (selectedType === 'EARLY_PAYOFF' && exitYears >= 1 && exitYears <= 10);

  const handleSubmit = () => {
    if (!selectedType || !isValid) return;

    let intent: MortgageIntent;
    if (selectedType === 'MIN_MONTHLY') {
      intent = {
        type: 'MIN_MONTHLY',
        max_monthly_vnd: hasMaxBudget ? maxMonthly * 1e6 : undefined,
      };
    } else {
      intent = { type: 'EARLY_PAYOFF', exit_after_years: exitYears };
    }
    onContinue(intent);
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0">
      {/* Header - Hidden on desktop */}
      <div className="text-center lg:hidden">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Bạn Muốn Trả Như Thế Nào?</h2>
        <p className="text-sm text-gray-600">Chọn 1 trong 2 cách phù hợp với bạn</p>
      </div>

      {/* Option 1: Minimize Monthly */}
      <Card
        variant="bordered"
        className={`cursor-pointer transition-all touch-manipulation ${
          selectedType === 'MIN_MONTHLY' ? 'ring-2 ring-[#7CD734] bg-[#F7FFF3]' : 'hover:bg-gray-50 active:bg-gray-100'
        }`}
        onClick={() => setSelectedType('MIN_MONTHLY')}
      >
        <CardBody className="p-3 sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4">
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

            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#F7FFF3] text-[#4DC614]">
              <Icons.TrendDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Trả hàng tháng thấp nhất có thể</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Hệ thống tìm gói vay và kỳ hạn để số tiền trả mỗi tháng thấp nhất
              </p>

              {selectedType === 'MIN_MONTHLY' && (
                <div className="mt-3 sm:mt-4 border-t border-[#7CD734]/30 pt-3" onClick={(e) => e.stopPropagation()}>
                  <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                    <input
                      type="checkbox"
                      checked={hasMaxBudget}
                      onChange={(e) => setHasMaxBudget(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#4DC614] accent-[#4DC614]"
                    />
                    <span className="text-sm text-gray-700">
                      Tôi muốn trả không quá một số tiền cố định
                    </span>
                  </label>

                  {hasMaxBudget && (
                    <div className="mt-2 ml-8">
                      <div className="relative">
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          inputMode="numeric"
                          value={maxMonthly}
                          onChange={(e) => setMaxMonthly(parseFloat(e.target.value) || 0)}
                          className="pr-20 sm:pr-24 h-11 sm:h-auto"
                          placeholder="20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted">
                          triệu/tháng
                        </span>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 mt-2 flex-wrap">
                        {[15, 20, 30, 50].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setMaxMonthly(amount)}
                            className={`px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs rounded-full transition touch-manipulation ${
                              maxMonthly === amount
                                ? 'bg-[#4DC614] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                            }`}
                          >
                            {amount} triệu
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
        <CardBody className="p-3 sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4">
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

            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600">
              <Icons.Lightning className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Tôi sẽ trả hết sớm</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Tôi có kế hoạch tất toán toàn bộ khoản vay sau vài năm
              </p>

              {selectedType === 'EARLY_PAYOFF' && (
                <div className="mt-3 sm:mt-4 border-t border-purple-100 pt-3" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-sm text-gray-700 mb-2">
                    Dự kiến trả hết sau bao lâu?
                  </label>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                    {[1, 2, 3, 5, 7].map((years) => (
                      <button
                        key={years}
                        type="button"
                        onClick={() => setExitYears(years)}
                        className={`px-3 sm:px-4 py-2 text-sm rounded-lg transition touch-manipulation ${
                          exitYears === years
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                        }`}
                      >
                        {years} năm
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                    Hệ thống sẽ tính phí tất toán sớm và tìm gói tối ưu
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Navigation - Sticky on mobile */}
      <div className="flex gap-3 pt-2 pb-4 sm:pb-6 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent sm:static sm:bg-none">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 sm:h-auto touch-manipulation">
          Quay lại
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} className="flex-1 h-12 sm:h-auto touch-manipulation">
          Xem Kết Quả
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Refinance Intent Form (Single optimized strategy)
// =============================================================================

function RefinanceIntentForm({
  onContinue,
  onBack,
}: {
  onContinue: (intent: RepaymentIntent) => void;
  onBack: () => void;
}) {
  const handleSubmit = () => {
    onContinue({ type: 'OPTIMIZE_REFINANCE' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0">
      {/* Header - Hidden on desktop */}
      <div className="text-center lg:hidden">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Tìm Gói Tốt Nhất Cho Bạn</h2>
        <p className="text-sm text-gray-600">
          Hệ thống sẽ tự động tìm gói vay tối ưu nhất
        </p>
      </div>

      {/* Info Card */}
      <Card variant="bordered" className="bg-gradient-to-br from-[#F7FFF3] to-[#E8ECEF] border-[#7CD734]/50">
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-[#F7FFF3] text-[#4DC614]">
              <Icons.Target className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                Hệ thống sẽ tìm gói vay đáp ứng:
              </h3>
              
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F7FFF3] text-[#4DC614] flex items-center justify-center text-xs sm:text-sm font-bold border border-[#7CD734]/50">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Trả ít hơn hiện tại</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Số tiền trả hàng tháng phải thấp hơn khoản vay cũ
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F7FFF3] text-[#4DC614] flex items-center justify-center text-xs sm:text-sm font-bold border border-[#7CD734]/50">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Hoàn vốn nhanh nhất</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Thời gian để lợi ích vượt qua chi phí chuyển đổi ngắn nhất
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <Icons.InfoCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-amber-800">
            Nếu không có gói nào thỏa mãn cả 2 điều kiện, hệ thống sẽ cho bạn biết 
            và gợi ý có nên chuyển ngân hàng hay không.
          </p>
        </div>
      </div>

      {/* Navigation - Sticky on mobile, normal on desktop */}
      <div className="flex gap-3 pt-2 pb-4 sm:pb-6 lg:pb-0 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent lg:static lg:bg-transparent">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 sm:h-auto touch-manipulation">
          Quay lại
        </Button>
        <Button onClick={handleSubmit} className="flex-1 h-12 sm:h-auto touch-manipulation">
          Tìm Gói Tốt Nhất
        </Button>
      </div>
    </div>
  );
}

