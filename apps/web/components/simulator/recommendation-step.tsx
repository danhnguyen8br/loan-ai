'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { DetailedScheduleTable } from './detailed-schedule-table';
import type { RecommendResponse, RecommendedPackage } from '@/app/api/simulator/recommend/route';
import type { NeedsStrategy } from '@/components/simulator/needs-strategy-step';

type Category = 'MORTGAGE_RE' | 'REFINANCE';

interface RecommendationStepProps {
  category: Category;
  needsStrategy: NeedsStrategy;
  result: RecommendResponse;
  isLoading: boolean;
  error?: string;
  onEditNeeds: () => void;
}

export function RecommendationStep({
  category,
  needsStrategy,
  result,
  isLoading,
  error,
  onEditNeeds,
}: RecommendationStepProps) {
  const [showSchedule, setShowSchedule] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-14 h-14 border-4 border-primary-50 border-t-primary-dark rounded-full animate-spin mb-4" />
        <p className="text-lg text-leadity-gray-muted">Đang tính toán phương án tối ưu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8">
        <Card variant="bordered" className="bg-red-50 border-red-200">
          <CardBody className="text-center py-8">
            <Icons.Warning className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Có lỗi xảy ra</h3>
            <p className="text-red-600 text-base">{error}</p>
            <Button onClick={onEditNeeds} className="mt-4">
              Thử lại
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { best, explanations, shouldRefinance, currentMonthlyPayment } = result;

  // Handle refinance case where no good option exists
  if (category === 'REFINANCE' && shouldRefinance === false) {
    return (
      <NoRefinanceRecommendation
        explanations={explanations}
        currentMonthlyPayment={currentMonthlyPayment}
        onEditNeeds={onEditNeeds}
      />
    );
  }

  // Handle case where no best package was found
  if (!best) {
    return (
      <div className="px-4 py-8 space-y-6">
        <Card variant="bordered" className="bg-amber-50 border-amber-200">
          <CardBody className="text-center py-8">
            <Icons.InfoCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="font-semibold text-amber-800 mb-2">Không tìm thấy gói phù hợp</h3>
            <p className="text-amber-600 text-sm">Vui lòng điều chỉnh lại nhu cầu của bạn.</p>
            <Button onClick={onEditNeeds} className="mt-4">
              Chỉnh lại nhu cầu
            </Button>
          </CardBody>
        </Card>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#4DC614]/10 to-emerald-50 rounded-xl p-4 sm:p-5 border border-[#4DC614]/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 leading-relaxed">
                Lãi suất được <span className="font-semibold text-[#4DC614]">Leadity</span> lựa chọn từ các gói vay cạnh tranh nhất trên thị trường. Để có được thông tin cụ thể hơn, hãy liên hệ với chúng tôi ngay hôm nay.
              </p>
            </div>
            <a
              href="https://www.leadity.ai/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#4DC614] hover:bg-[#45b312] text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <span>Liên hệ tư vấn</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0 pt-8 sm:pt-6">
      {/* Header - Hidden on desktop */}
      <div className="text-center lg:hidden">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Gói Vay Phù Hợp Nhất
        </h2>
        <p className="text-base text-gray-600">
          Dựa trên nhu cầu và chiến lược của bạn
        </p>
      </div>

      {/* Best Package Card - Different for Mortgage vs Refinance */}
      {category === 'MORTGAGE_RE' ? (
        <MortgageResultCard
          pkg={best}
          explanations={explanations}
          recommendedTermMonths={result.recommendedTermMonths}
          recommendedDTI={result.recommendedDTI}
          needsStrategy={needsStrategy.mode === 'MORTGAGE_RE' ? needsStrategy : undefined}
          onToggleSchedule={() => setShowSchedule(!showSchedule)}
          showSchedule={showSchedule}
        />
      ) : (
        <RefinanceResultCard
          pkg={best}
          explanations={explanations}
          currentMonthlyPayment={currentMonthlyPayment}
          onToggleSchedule={() => setShowSchedule(!showSchedule)}
          showSchedule={showSchedule}
        />
      )}

      {/* Navigation */}
      <div className="space-y-3 pt-4">
        <Button onClick={onEditNeeds} variant="outline" className="w-full h-12 text-base sm:h-auto touch-manipulation">
          Chỉnh Lại Nhu Cầu
        </Button>
      </div>

      {/* CTA Section */}
      <div className="mt-6 pb-4 sm:pb-6 lg:pb-0">
        <div className="bg-gradient-to-r from-[#4DC614]/10 to-emerald-50 rounded-xl p-4 sm:p-5 border border-[#4DC614]/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 leading-relaxed">
                Lãi suất được <span className="font-semibold text-[#4DC614]">Leadity</span> lựa chọn từ các gói vay cạnh tranh nhất trên thị trường. Để có được thông tin cụ thể hơn, hãy liên hệ với chúng tôi ngay hôm nay.
              </p>
            </div>
            <a
              href="https://www.leadity.ai/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#4DC614] hover:bg-[#45b312] text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <span>Liên hệ tư vấn</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Mortgage Result Card
// =============================================================================

function MortgageResultCard({
  pkg,
  explanations,
  recommendedTermMonths,
  recommendedDTI,
  needsStrategy,
  onToggleSchedule,
  showSchedule,
}: {
  pkg: RecommendedPackage;
  explanations: string[];
  recommendedTermMonths?: number;
  recommendedDTI?: number;
  needsStrategy?: Extract<NeedsStrategy, { mode: 'MORTGAGE_RE' }>;
  onToggleSchedule: () => void;
  showSchedule: boolean;
}) {
  const termYears = pkg.termMonths / 12;
  const isExitPlan = pkg.strategyId === 'M3_EXIT_PLAN';

  const exitYears =
    needsStrategy?.strategy.type === 'LOW_MONTHLY_SETTLE_LATER'
      ? needsStrategy.strategy.settle_after_years
      : undefined;

  // For exit plan: check if settlement is AFTER promo/grace period ends
  // If settling before, stress section is not relevant
  const exitMonth = exitYears ? exitYears * 12 : undefined;
  const maxPromoGraceMonth = Math.max(pkg.promoEndMonth ?? 0, pkg.gracePrincipalMonths ?? 0);
  const showStressSection = pkg.stressPayments && (
    !isExitPlan || (exitMonth !== undefined && exitMonth > maxPromoGraceMonth)
  );

  const dtiPct =
    needsStrategy?.strategy.type === 'PAY_OFF_FAST'
      ? (() => {
          const income = needsStrategy.strategy.monthly_income_vnd;
          const existingDebt = needsStrategy.strategy.existing_debt_monthly_vnd ?? 0;
          const mortgagePayment =
            pkg.regularMonthlyPaymentMax ??
            pkg.firstMonthPayment ??
            pkg.maxMonthlyPayment;
          if (!income || income <= 0) return undefined;
          return ((mortgagePayment + existingDebt) / income) * 100;
        })()
      : undefined;

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-dark to-primary px-4 sm:px-5 py-4 sm:py-5 text-text-inverse">
        <div className="flex items-center gap-2 mb-1">
          <Icons.Check className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-sm sm:text-base font-medium text-text-inverse/90">Đề xuất cho bạn</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold">{pkg.templateName}</h3>
        <p className="text-sm sm:text-base text-text-inverse/90">
          Kỳ hạn: {termYears} năm • Ưu đãi LS {pkg.promoEndMonth} tháng {pkg.promoRatePct ? `${pkg.promoRatePct}%` : ''}
        </p>
        <p className="text-sm text-text-inverse/80">
          {isExitPlan && exitYears ? `Tất toán sau ${exitYears} năm` : pkg.strategyLabel}
        </p>
      </div>

      <CardBody className="space-y-3 sm:space-y-4 p-3 sm:p-4">
        {/* Key Metrics (per mortgage strategy intent) */}
        {!isExitPlan ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <MetricBox
              label="Kỳ hạn + tỷ lệ nợ/thu nhập"
              value={`${termYears} năm`}
              sublabel={dtiPct !== undefined ? `Tỷ lệ nợ/thu nhập ~${dtiPct.toFixed(0)}%` : 'Theo thu nhập khai báo'}
              color="gray"
            />
            <MetricBox
              label="Tháng dự kiến tất toán"
              value={`${pkg.payoffMonth ?? pkg.termMonths}`}
              sublabel="Trả hết nợ vào khoảng tháng này"
              color="green"
            />
            <MetricBox
              label="Khoản trả tháng đầu"
              value={formatVND(pkg.firstMonthPayment ?? pkg.avgFirst12MonthsPayment)}
              sublabel="Dùng để ước lượng ngân sách"
              color="blue"
            />
            <MetricBox
              label="Tổng chi phí vay"
              value={formatVND(pkg.totalCost)}
              sublabel="Lãi + phí + bảo hiểm + phạt (nếu có)"
              color="gray"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <MetricBox
              label="Khoản trả tháng đầu"
              value={formatVND(pkg.firstMonthPayment ?? pkg.avgFirst12MonthsPayment)}
              sublabel="Dùng để ước lượng ngân sách"
              color="blue"
            />
            <MetricBox
              label="Ân hạn nợ gốc"
              value={`${pkg.gracePrincipalMonths ?? 0} tháng`}
              sublabel="Chỉ trả lãi, chưa trả gốc"
              color="gray"
            />
            <MetricBox
              label={exitYears ? `Tất toán ở năm ${exitYears}` : 'Tất toán (mốc năm)'}
              value={
                pkg.exitSummary
                  ? formatVND(pkg.exitSummary.totalSettlement)
                  : 'Chưa có'
              }
              sublabel={pkg.exitSummary ? 'Dư nợ + phí trả trước hạn' : 'Chưa đủ dữ liệu'}
              color="purple"
            />
            <MetricBox
              label={exitYears ? `Tổng chi phí đến năm ${exitYears}` : 'Tổng chi phí đến mốc tất toán'}
              value={formatVND(pkg.totalCost)}
              sublabel="Lãi + phí + bảo hiểm + phạt"
              color="blue"
            />
          </div>
        )}

        {/* Stress Test - only show if not exit plan OR exit is after promo/grace */}
        {showStressSection && (
          <div className="bg-status-warning-light rounded-xl p-4">
            <h4 className="text-base font-medium text-status-warning-dark mb-2 flex items-center gap-2">
              <Icons.TrendUp className="w-5 h-5" />
              Kịch bản lãi suất biến động khi hết ưu đãi
            </h4>
            <div className="flex gap-2 text-base">
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-text-muted">
                  LS sau ưu đãi{pkg.stressBaseRatePct !== undefined ? ` ~${pkg.stressBaseRatePct.toFixed(2)}%` : ''}
                </div>
                <div className="font-semibold text-dark-darker text-base">{formatVND(pkg.stressPayments!.base)}</div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-status-warning">+2%</div>
                <div className="font-semibold text-status-warning-dark text-base">{formatVND(pkg.stressPayments!.plus2)}</div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-status-error">+4%</div>
                <div className="font-semibold text-status-error-dark text-base">{formatVND(pkg.stressPayments!.plus4)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Explanations */}
        <div className="bg-leadity-gray-lighter rounded-xl p-4 sm:p-5">
          <h4 className="text-sm sm:text-base font-medium text-dark mb-3 flex items-center gap-2">
            <Icons.InfoCircle className="w-5 h-5 text-primary-700" />
            Vì sao chọn gói này?
          </h4>
          <ul className="space-y-2">
            {explanations.map((exp, idx) => (
              <li key={idx} className="text-sm sm:text-base text-leadity-gray flex items-start gap-2">
                {exp.trim().startsWith('Lưu ý:') ? (
                  <Icons.X className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <span className="text-primary-700 mt-0.5 flex-shrink-0">✓</span>
                )}
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Schedule Toggle */}
        <Button variant="outline" onClick={onToggleSchedule} className="w-full h-11 sm:h-auto touch-manipulation">
          {showSchedule ? 'Ẩn lịch trả nợ' : 'Xem lịch trả nợ chi tiết'}
          <Icons.ChevronDown
            className={`w-4 h-4 ml-2 transition-transform ${showSchedule ? 'rotate-180' : ''}`}
          />
        </Button>

        {showSchedule && pkg.schedule && pkg.schedule.length > 0 && (
          <DetailedScheduleTable 
            schedule={pkg.schedule} 
            promoEndMonth={pkg.promoEndMonth}
          />
        )}
      </CardBody>
    </Card>
  );
}

// =============================================================================
// Refinance Result Card (NEW - with Net Saving, Break-even, Stress, Exit Fees)
// =============================================================================

function RefinanceResultCard({
  pkg,
  explanations,
  currentMonthlyPayment,
  onToggleSchedule,
  showSchedule,
}: {
  pkg: RecommendedPackage;
  explanations: string[];
  currentMonthlyPayment?: number;
  onToggleSchedule: () => void;
  showSchedule: boolean;
}) {
  const termYears = pkg.termMonths / 12;
  const monthlySaving = currentMonthlyPayment ? currentMonthlyPayment - pkg.maxMonthlyPayment : 0;

  // Hide stress section if hold duration is less than promo/grace period
  const maxPromoGraceMonth = Math.max(pkg.promoEndMonth ?? 0, pkg.gracePrincipalMonths ?? 0);
  const showStressSection = pkg.stressPayments && (
    !pkg.horizonMonths || pkg.horizonMonths > maxPromoGraceMonth
  );

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-dark to-primary px-4 sm:px-5 py-4 sm:py-5 text-text-inverse">
        <div className="flex items-center gap-2 mb-1">
          <Icons.Check className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-sm sm:text-base font-medium text-text-inverse/90">Đề xuất chuyển sang</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold">{pkg.templateName}</h3>
        <p className="text-sm sm:text-base text-text-inverse/90">
          Kỳ hạn mới: {termYears} năm • Ưu đãi LS {pkg.promoEndMonth} tháng {pkg.promoRatePct ? `${pkg.promoRatePct}%` : ''}
        </p>
      </div>

      <CardBody className="space-y-3 sm:space-y-4 p-3 sm:p-4">
        {/* Refinance Key Metrics */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Net Saving */}
          <MetricBox
            label="Tiết kiệm ròng"
            value={pkg.netSavingVnd !== undefined ? `${pkg.netSavingVnd >= 0 ? '+' : ''}${formatVND(pkg.netSavingVnd)}` : 'Chưa có'}
            sublabel={pkg.horizonMonths ? `Trong ${pkg.horizonMonths} tháng giữ khoản vay` : 'So với giữ khoản cũ'}
            color="green"
          />
          
          {/* Break-even */}
          <MetricBox
            label="Hoàn vốn sau"
            value={pkg.breakEvenMonth ? `${pkg.breakEvenMonth} tháng` : 'Chưa có'}
            sublabel="Chi phí chuyển đổi"
            color="blue"
          />

          {/* Payment Reduction */}
          <MetricBox
            label="Khoản trả tháng đầu"
            value={formatVND(pkg.firstMonthPayment ?? pkg.avgFirst12MonthsPayment)}
            sublabel={monthlySaving > 0 ? `Giảm ${formatVND(monthlySaving)}/tháng` : 'Dùng để ước lượng ngân sách'}
            color="blue"
          />

          {/* Switching Costs */}
          <MetricBox
            label="Chi phí chuyển NH"
            value={pkg.switchingCostsTotal ? formatVND(pkg.switchingCostsTotal) : 'N/A'}
            sublabel="Phí tất toán khoản cũ + hồ sơ mới"
            color="purple"
          />
        </div>

        {/* Stress Test Payments - only show if hold duration > promo/grace period */}
        {showStressSection && (
          <div className="bg-status-warning-light rounded-xl p-4">
            <h4 className="text-base font-medium text-status-warning-dark mb-2 flex items-center gap-2">
              <Icons.TrendUp className="w-5 h-5" />
              Kịch bản lãi suất biến động khi hết ưu đãi
            </h4>
            <div className="flex gap-2 text-base">
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-text-muted mb-0.5">
                  LS sau ưu đãi{pkg.stressBaseRatePct !== undefined ? ` ~${pkg.stressBaseRatePct.toFixed(2)}%` : ''}
                </div>
                <div className="font-semibold text-dark-darker text-base">{formatVND(pkg.stressPayments!.base)}</div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-status-warning mb-0.5">+2%</div>
                <div className="font-semibold text-status-warning-dark text-base">{formatVND(pkg.stressPayments!.plus2)}</div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-status-error mb-0.5">+4%</div>
                <div className="font-semibold text-status-error-dark text-base">{formatVND(pkg.stressPayments!.plus4)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Exit Fees for New Loan */}
        {pkg.newLoanExitFees && (
          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="text-base font-medium text-purple-800 mb-2 flex items-center gap-2">
              <Icons.Money className="w-5 h-5" />
              Phí tất toán sớm (khoản mới)
            </h4>
            <div className="flex gap-2 text-base">
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-gray-500 mb-0.5">Sau 12T</div>
                <div className={`font-semibold text-base ${pkg.newLoanExitFees.at12Months > 0 ? 'text-purple-700' : 'text-green-600'}`}>
                  {pkg.newLoanExitFees.at12Months > 0 ? formatVND(pkg.newLoanExitFees.at12Months) : 'Miễn phí'}
                </div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-gray-500 mb-0.5">Sau 24T</div>
                <div className={`font-semibold text-base ${pkg.newLoanExitFees.at24Months > 0 ? 'text-purple-700' : 'text-green-600'}`}>
                  {pkg.newLoanExitFees.at24Months > 0 ? formatVND(pkg.newLoanExitFees.at24Months) : 'Miễn phí'}
                </div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-2.5 text-center">
                <div className="text-sm text-gray-500 mb-0.5">Sau 36T</div>
                <div className={`font-semibold text-base ${pkg.newLoanExitFees.at36Months > 0 ? 'text-purple-700' : 'text-green-600'}`}>
                  {pkg.newLoanExitFees.at36Months > 0 ? formatVND(pkg.newLoanExitFees.at36Months) : 'Miễn phí'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Explanations */}
        <div className="bg-leadity-gray-lighter rounded-xl p-4 sm:p-5">
          <h4 className="text-sm sm:text-base font-medium text-dark mb-3 flex items-center gap-2">
            <Icons.InfoCircle className="w-5 h-5 text-primary-700" />
            Phân tích chi tiết
          </h4>
          <ul className="space-y-2">
            {explanations.map((exp, idx) => (
              <li key={idx} className="text-sm sm:text-base text-leadity-gray flex items-start gap-2">
                {exp.trim().startsWith('Lưu ý:') ? (
                  <Icons.X className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <span className="text-primary-700 mt-0.5 flex-shrink-0">✓</span>
                )}
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Schedule Toggle */}
        <Button variant="outline" onClick={onToggleSchedule} className="w-full h-11 sm:h-auto touch-manipulation">
          {showSchedule ? 'Ẩn lịch trả nợ' : 'Xem lịch trả nợ chi tiết'}
          <Icons.ChevronDown
            className={`w-4 h-4 ml-2 transition-transform ${showSchedule ? 'rotate-180' : ''}`}
          />
        </Button>

        {showSchedule && pkg.schedule && pkg.schedule.length > 0 && (
          <DetailedScheduleTable 
            schedule={pkg.schedule} 
            promoEndMonth={pkg.promoEndMonth}
          />
        )}
      </CardBody>
    </Card>
  );
}

// =============================================================================
// Metric Box
// =============================================================================

function MetricBox({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: string;
  sublabel: string;
  // keep compatibility; allow one-off colors used by new mortgage cards
  color: 'blue' | 'green' | 'red' | 'orange' | 'gray' | 'purple';
}) {
  // Using design tokens for WCAG AA compliant colors
  const colorMap = {
    blue: 'bg-primary-50 text-dark',
    green: 'bg-primary-50 text-primary-700',
    red: 'bg-status-error-light text-status-error-dark',
    orange: 'bg-status-warning-light text-status-warning-dark',
    gray: 'bg-leadity-gray-light text-dark',
    purple: 'bg-purple-50 text-purple-800',
  };

  return (
    <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 my-3 ${colorMap[color]}`}>
      <div className="text-sm opacity-75 mb-0.5 leading-tight">{label}</div>
      <div className="text-lg sm:text-xl font-bold leading-tight">{value}</div>
      {sublabel && <div className="text-sm opacity-60 leading-tight mt-0.5">{sublabel}</div>}
    </div>
  );
}

// =============================================================================
// No Refinance Recommendation Component
// =============================================================================

function NoRefinanceRecommendation({
  explanations,
  currentMonthlyPayment,
  onEditNeeds,
}: {
  explanations: string[];
  currentMonthlyPayment?: number;
  onEditNeeds: () => void;
}) {
  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Khuyến Nghị Giữ Nguyên</h2>
        <p className="text-base text-gray-600">
          Chuyển ngân hàng không có lợi trong trường hợp của bạn
        </p>
      </div>

      {/* Main Card */}
      <Card variant="bordered" className="bg-amber-50 border-amber-200">
        <CardBody className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
              <Icons.Warning className="w-8 h-8" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">Lý do:</h3>
              <ul className="space-y-2">
                {explanations.map((exp, idx) => (
                  <li key={idx} className="text-base text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Current Loan Info */}
      {currentMonthlyPayment && (
        <Card variant="bordered" className="bg-gray-50">
          <CardBody className="p-5">
            <div className="text-center">
              <p className="text-base text-gray-600 mb-1">Số tiền trả hiện tại của bạn</p>
              <p className="text-3xl font-bold text-gray-900">{formatVND(currentMonthlyPayment)}/tháng</p>
              <p className="text-sm text-gray-500 mt-1">Đây là mức tối ưu cho trường hợp của bạn</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Navigation */}
      <div className="space-y-3 pt-4">
        <Button onClick={onEditNeeds} variant="outline" className="w-full text-base">
          Thay Đổi Thông Tin
        </Button>
      </div>

      {/* CTA Section */}
      <div className="mt-6 pb-6">
        <div className="bg-gradient-to-r from-[#4DC614]/10 to-emerald-50 rounded-xl p-4 sm:p-5 border border-[#4DC614]/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 leading-relaxed">
                Lãi suất được <span className="font-semibold text-[#4DC614]">Leadity</span> lựa chọn từ các gói vay cạnh tranh nhất trên thị trường. Để có được thông tin cụ thể hơn, hãy liên hệ với chúng tôi ngay hôm nay.
              </p>
            </div>
            <a
              href="https://www.leadity.ai/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#4DC614] hover:bg-[#45b312] text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <span>Liên hệ tư vấn</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatVND(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (absAmount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} triệu`;
  }
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}
