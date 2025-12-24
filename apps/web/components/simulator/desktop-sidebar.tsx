'use client';

import { Card, CardBody } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import type { LoanNeeds } from './needs-step';
import type { RepaymentIntent } from './repayment-intent-step';

type Step = 'offers' | 'needs' | 'intent' | 'result';
type Category = 'MORTGAGE_RE' | 'REFINANCE';

interface DesktopSidebarProps {
  currentStep: Step;
  category: Category | null;
  needs: LoanNeeds | null;
  intent: RepaymentIntent | null;
}

const STEP_CONFIG = {
  offers: { index: 0, label: 'Khám phá gói vay', Icon: Icons.Search },
  needs: { index: 1, label: 'Nhu cầu vay', Icon: Icons.Edit },
  intent: { index: 2, label: 'Cách trả nợ', Icon: Icons.Money },
  result: { index: 3, label: 'Kết quả', Icon: Icons.Sparkles },
};

const CATEGORY_LABELS: Record<Category, string> = {
  MORTGAGE_RE: 'Vay Mua BĐS',
  REFINANCE: 'Chuyển Ngân Hàng',
};

function formatVND(amount: number): string {
  if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)} tỷ`;
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(0)} triệu`;
  return amount.toLocaleString('vi-VN') + ' đ';
}

export function DesktopSidebar({
  currentStep,
  category,
  needs,
  intent,
}: DesktopSidebarProps) {
  return (
    <div className="w-72 flex-shrink-0 space-y-4">
      {/* Summary Panel - shows collected data */}
      {(category || needs) && (
        <Card variant="bordered">
          <CardBody className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Tóm tắt
            </h3>
            <div className="space-y-3 text-sm">
              {category && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Loại vay</span>
                  <span className="font-medium text-gray-900">{CATEGORY_LABELS[category]}</span>
                </div>
              )}

              {needs && needs.category === 'MORTGAGE_RE' && (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Giá trị BĐS</span>
                    <span className="font-medium text-gray-900">
                      {formatVND(needs.property_value_vnd || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Cần vay</span>
                    <span className="font-medium text-[#4DC614]">
                      {formatVND((needs.property_value_vnd || 0) - (needs.down_payment_vnd || 0))}
                    </span>
                  </div>
                  {needs.monthly_budget_vnd && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Ngân sách/tháng</span>
                      <span className="font-medium text-gray-900">
                        ≤ {formatVND(needs.monthly_budget_vnd)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {needs && needs.category === 'REFINANCE' && (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Dư nợ còn lại</span>
                    <span className="font-medium text-gray-900">
                      {formatVND(needs.remaining_balance_vnd)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Lãi suất hiện tại</span>
                    <span className="font-medium text-amber-600">
                      {needs.current_rate_pct}%/năm
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Còn lại</span>
                    <span className="font-medium text-gray-900">
                      {needs.remaining_months} tháng
                    </span>
                  </div>
                </>
              )}

              {intent && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1">Chiến lược</span>
                  <span className="font-medium text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded">
                    {intent.type === 'MIN_MONTHLY' && 'Trả hàng tháng thấp nhất'}
                    {intent.type === 'EARLY_PAYOFF' && `Tất toán sau ${intent.exit_after_years} năm`}
                    {intent.type === 'OPTIMIZE_REFINANCE' && 'Tối ưu chuyển ngân hàng'}
                  </span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick Tips */}
      <Card variant="bordered" className="bg-gradient-to-br from-[#F7FFF3] to-[#E8ECEF] border-[#7CD734]/30">
        <CardBody className="p-4">
          <h3 className="text-sm font-semibold text-[#343839] mb-2 flex items-center gap-2">
            <Icons.LightBulb className="w-4 h-4 text-[#4DC614]" />
            Mẹo nhỏ
          </h3>
          <p className="text-xs text-[#343839] leading-relaxed">
            {currentStep === 'offers' && 'Khám phá các gói vay tiêu biểu để hiểu các yếu tố quan trọng nhất.'}
            {currentStep === 'needs' && 'Nhập chính xác số liệu để nhận đề xuất phù hợp nhất.'}
            {currentStep === 'intent' && 'Chọn cách trả phù hợp với dòng tiền và kế hoạch tài chính của bạn.'}
            {currentStep === 'result' && 'So sánh kết quả với các gói khác hoặc điều chỉnh nhu cầu để tối ưu hơn.'}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

