'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { GlossaryLabel } from '@/components/ui/glossary-term';
import { Icons } from '@/components/ui/icons';
import type { MortgagePurchaseForm, RefinanceForm, OldLoanForm } from '@/lib/simulator-types';
import { formatVND } from '@/lib/simulator-types';

// Combined form type
export type SimulatorFormData = 
  | (Partial<MortgagePurchaseForm> & { type: 'MORTGAGE_RE' })
  | (Partial<RefinanceForm> & { type: 'REFINANCE' });

interface InputsStepProps {
  category: 'MORTGAGE_RE' | 'REFINANCE';
  formData: SimulatorFormData;
  onChange: (data: SimulatorFormData) => void;
}

export function InputsStep({ 
  category, 
  formData, 
  onChange, 
}: InputsStepProps) {
  // Format as billions (tỷ đồng)
  const formatBillion = (value: number | undefined) => {
    if (!value) return '';
    const billion = value / 1_000_000_000;
    // Show up to 3 decimal places, trim trailing zeros
    return billion.toFixed(3).replace(/\.?0+$/, '');
  };

  // Parse billions to VND
  const parseBillion = (value: string): number => {
    const num = parseFloat(value.replace(',', '.')) || 0;
    return Math.round(num * 1_000_000_000);
  };

  // Legacy format for backwards compatibility
  const formatCurrency = (value: number | undefined) => {
    if (!value) return '';
    return value.toLocaleString('vi-VN');
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/\D/g, ''), 10) || 0;
  };

  // Calculate down payment for mortgage when property value or loan amount changes
  const handleMortgageFieldChange = (field: string, value: number | string | boolean) => {
    if (category !== 'MORTGAGE_RE') return;
    
    const newData = { ...formData, [field]: value } as SimulatorFormData;
    
    // Auto-calculate down payment (property value - loan amount)
    if ((field === 'property_value_vnd' || field === 'loan_amount_vnd') && newData.type === 'MORTGAGE_RE') {
      const propValue = field === 'property_value_vnd' ? value as number : newData.property_value_vnd || 0;
      const loanAmount = field === 'loan_amount_vnd' ? value as number : newData.loan_amount_vnd || 0;
      if (propValue && loanAmount) {
        newData.down_payment_vnd = Math.max(0, propValue - loanAmount);
      }
    }
    
    onChange(newData);
  };

  // Handle refinance old loan field changes
  const handleOldLoanChange = (field: keyof OldLoanForm, value: number | string) => {
    if (category !== 'REFINANCE' || formData.type !== 'REFINANCE') return;
    
    const currentOldLoan = formData.old_loan || {
      old_remaining_balance_vnd: 0,
      old_remaining_term_months: 120,
      old_current_rate_pct: 10.5,
      old_repayment_method: 'annuity' as const,
      old_loan_age_months: 12,
      old_prepayment_schedule_preset: 'standard_3_2_1_0' as const,
    };
    
    onChange({
      ...formData,
      old_loan: {
        ...currentOldLoan,
        [field]: value,
      },
    } as SimulatorFormData);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    onChange({ ...formData, [field]: value } as SimulatorFormData);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-dark-darker mb-2">
          {category === 'MORTGAGE_RE' ? 'Thông Tin Vay Mua BĐS' : 'Thông Tin Chuyển Ngân Hàng'}
        </h2>
        <p className="text-gray-600">
          {category === 'MORTGAGE_RE' 
            ? 'Nhập thông tin để mô phỏng chi phí vay mua nhà' 
            : 'Nhập thông tin khoản vay cũ và mới để so sánh'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Main Form */}
        <div className="space-y-6">
          
          {/* MORTGAGE PURCHASE FORM */}
          {category === 'MORTGAGE_RE' && (
            <>
              {/* Property & Loan Info */}
              <Card variant="bordered">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-dark-darker flex items-center">
                    <Icons.Mortgage className="w-5 h-5 mr-2 text-primary" />
                    Thông Tin Tài Sản & Khoản Vay
                  </h3>
                </CardHeader>
                <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá Trị Tài Sản (tỷ đồng) *
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="VD: 2.5"
                        value={formatBillion((formData as MortgagePurchaseForm).property_value_vnd)}
                        onChange={(e) => handleMortgageFieldChange('property_value_vnd', parseBillion(e.target.value))}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">tỷ</span>
                    </div>
                    {(formData as MortgagePurchaseForm).property_value_vnd && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatVND((formData as MortgagePurchaseForm).property_value_vnd!)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Tiền Cần Vay (tỷ đồng) *
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="VD: 2"
                        value={formatBillion((formData as MortgagePurchaseForm).loan_amount_vnd)}
                        onChange={(e) => handleMortgageFieldChange('loan_amount_vnd', parseBillion(e.target.value))}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">tỷ</span>
                    </div>
                    {(formData as MortgagePurchaseForm).loan_amount_vnd && (formData as MortgagePurchaseForm).property_value_vnd && (
                      <p className="text-xs text-gray-500 mt-1">
                        Tỷ lệ vay: {(((formData as MortgagePurchaseForm).loan_amount_vnd! / (formData as MortgagePurchaseForm).property_value_vnd!) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiền Sẵn Có (Tự động tính)
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formatBillion((formData as MortgagePurchaseForm).down_payment_vnd)}
                        disabled
                        className="bg-gray-50 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">tỷ</span>
                    </div>
                    {(formData as MortgagePurchaseForm).down_payment_vnd && (formData as MortgagePurchaseForm).property_value_vnd && (
                      <p className="text-xs text-gray-500 mt-1">
                        = {(((formData as MortgagePurchaseForm).down_payment_vnd! / (formData as MortgagePurchaseForm).property_value_vnd!) * 100).toFixed(1)}% giá trị tài sản
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời Hạn Vay *
                    </label>
                    <Select
                      value={(formData as MortgagePurchaseForm).term_months?.toString() || '240'}
                      onChange={(e) => handleInputChange('term_months', parseInt(e.target.value))}
                    >
                      <option value="60">5 năm (60 tháng)</option>
                      <option value="120">10 năm (120 tháng)</option>
                      <option value="180">15 năm (180 tháng)</option>
                      <option value="240">20 năm (240 tháng)</option>
                      <option value="300">25 năm (300 tháng)</option>
                    </Select>
                  </div>
                </CardBody>
              </Card>

            </>
          )}

          {/* REFINANCE FORM */}
          {category === 'REFINANCE' && (
            <>
              {/* Old Loan Info */}
              <Card variant="bordered" className="border-leadity-gray-light bg-leadity-gray-light/30">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-dark-darker flex items-center">
                    <Icons.DocumentText className="w-5 h-5 mr-2 text-dark" />
                    Khoản Vay Cũ (Hiện Tại)
                  </h3>
                  <p className="text-sm text-gray-500">Thông tin khoản vay bạn đang muốn tái cấu trúc</p>
                </CardHeader>
                <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dư Nợ Còn Lại (tỷ đồng) *
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="VD: 1.5"
                        value={formatBillion((formData as RefinanceForm).old_loan?.old_remaining_balance_vnd)}
                        onChange={(e) => handleOldLoanChange('old_remaining_balance_vnd', parseBillion(e.target.value))}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">tỷ</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lãi Suất Hiện Tại (%) *
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="VD: 10.5"
                      value={(formData as RefinanceForm).old_loan?.old_current_rate_pct || ''}
                      onChange={(e) => handleOldLoanChange('old_current_rate_pct', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Tháng Còn Lại *
                    </label>
                    <Input
                      type="number"
                      placeholder="VD: 180"
                      value={(formData as RefinanceForm).old_loan?.old_remaining_term_months || ''}
                      onChange={(e) => handleOldLoanChange('old_remaining_term_months', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Tháng Đã Trả *
                    </label>
                    <Input
                      type="number"
                      placeholder="VD: 24"
                      value={(formData as RefinanceForm).old_loan?.old_loan_age_months || ''}
                      onChange={(e) => handleOldLoanChange('old_loan_age_months', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Dùng để xác định mức phí tất toán sớm
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <GlossaryLabel term="repayment_method" label="Phương Thức Trả Nợ Cũ" size="sm" />
                    </label>
                    <Select
                      value={(formData as RefinanceForm).old_loan?.old_repayment_method || 'annuity'}
                      onChange={(e) => handleOldLoanChange('old_repayment_method', e.target.value)}
                    >
                      <option value="annuity">Gốc + lãi chia đều hàng tháng (Niên kim)</option>
                      <option value="equal_principal">Gốc cố định, lãi giảm dần</option>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Ảnh hưởng đến cách tính dư nợ còn lại
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phí Tất Toán Sớm (Cũ)
                    </label>
                    <Select
                      value={(formData as RefinanceForm).old_loan?.old_prepayment_schedule_preset || 'standard_3_2_1_0'}
                      onChange={(e) => handleOldLoanChange('old_prepayment_schedule_preset', e.target.value)}
                    >
                      <option value="standard_3_2_1_0">Tiêu chuẩn: 3% → 2% → 1% → 0%</option>
                      <option value="moderate_2_1_0">Vừa phải: 2% → 1% → 0%</option>
                      <option value="low_1_0">Thấp: 1% → 0%</option>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Phí giảm dần theo năm vay
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* New Loan Info */}
              <Card variant="bordered" className="border-primary/50 bg-primary-50/30">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-dark-darker flex items-center">
                    <Icons.Refinance className="w-5 h-5 mr-2 text-primary-700" />
                    Khoản Vay Mới (Chuyển ngân hàng)
                  </h3>
                  <p className="text-sm text-gray-500">Thông số khoản vay mới thay thế</p>
                </CardHeader>
                <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời Hạn Vay Mới *
                    </label>
                    <Select
                      value={(formData as RefinanceForm).new_term_months?.toString() || '180'}
                      onChange={(e) => handleInputChange('new_term_months', parseInt(e.target.value))}
                    >
                      <option value="60">5 năm (60 tháng)</option>
                      <option value="120">10 năm (120 tháng)</option>
                      <option value="180">15 năm (180 tháng)</option>
                      <option value="240">20 năm (240 tháng)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rút Thêm Tiền (tỷ đồng)
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={formatBillion((formData as RefinanceForm).cash_out_vnd)}
                        onChange={(e) => handleInputChange('cash_out_vnd', parseBillion(e.target.value))}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">tỷ</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Vay thêm ngoài số tiền tất toán cũ
                    </p>
                  </div>

                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
