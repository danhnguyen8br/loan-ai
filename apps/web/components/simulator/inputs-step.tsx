'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { GlossaryLabel } from '@/components/ui/glossary-term';
import type { MortgagePurchaseForm, RefinanceForm, OldLoanForm } from '@/lib/simulator-types';
import { formatVND } from '@/lib/simulator-types';

// Billion Input Component - allows decimal input while typing
function BillionInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  value: number | undefined;
  onChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  // Convert VND to billion for display
  const vndToBillion = (vnd: number | undefined) => {
    if (vnd === undefined || vnd === null) return '';
    if (vnd === 0) return '0';
    const billion = vnd / 1_000_000_000;
    return billion.toFixed(3).replace(/\.?0+$/, '');
  };

  // Local state to track raw input while typing
  const [localValue, setLocalValue] = useState(vndToBillion(value));
  const [isFocused, setIsFocused] = useState(false);

  // Update local value when external value changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(vndToBillion(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, dots, and commas
    if (!/^[\d.,]*$/.test(raw)) return;
    
    setLocalValue(raw);
    
    // Parse and update parent
    if (onChange) {
      const normalized = raw.replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num)) {
        onChange(Math.round(num * 1_000_000_000));
      } else if (raw === '' || raw === '0') {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format on blur
    setLocalValue(vndToBillion(value));
  };

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
        className={`pr-12 ${className || ''}`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">tỷ</span>
    </div>
  );
}

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

  // Calculate loan amount for mortgage when property value or down payment changes
  const handleMortgageFieldChange = (field: string, value: number | string | boolean) => {
    if (category !== 'MORTGAGE_RE') return;
    
    const newData = { ...formData, [field]: value } as SimulatorFormData;
    
    // Auto-calculate loan amount
    if ((field === 'property_value_vnd' || field === 'down_payment_vnd') && newData.type === 'MORTGAGE_RE') {
      const propValue = field === 'property_value_vnd' ? value as number : newData.property_value_vnd || 0;
      const downPayment = field === 'down_payment_vnd' ? value as number : newData.down_payment_vnd || 0;
      if (propValue && downPayment) {
        newData.loan_amount_vnd = propValue - downPayment;
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
          {category === 'MORTGAGE_RE' ? 'Thông Tin Vay Mua BĐS' : 'Thông Tin Tái Tài Trợ'}
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
                    <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Thông Tin Tài Sản & Khoản Vay
                  </h3>
                </CardHeader>
                <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá Trị Tài Sản (tỷ đồng) *
                    </label>
                    <BillionInput
                      placeholder="VD: 2.5"
                      value={(formData as MortgagePurchaseForm).property_value_vnd}
                      onChange={(v) => handleMortgageFieldChange('property_value_vnd', v)}
                    />
                    {(formData as MortgagePurchaseForm).property_value_vnd && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatVND((formData as MortgagePurchaseForm).property_value_vnd!)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiền Sẵn Có (tỷ đồng) *
                    </label>
                    <BillionInput
                      placeholder="VD: 0.5"
                      value={(formData as MortgagePurchaseForm).down_payment_vnd}
                      onChange={(v) => handleMortgageFieldChange('down_payment_vnd', v)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Tiền Vay (Tự động tính)
                    </label>
                    <BillionInput
                      value={(formData as MortgagePurchaseForm).loan_amount_vnd}
                      disabled
                      className="bg-gray-50"
                    />
                    {(formData as MortgagePurchaseForm).loan_amount_vnd && (formData as MortgagePurchaseForm).property_value_vnd && (
                      <p className="text-xs text-gray-500 mt-1">
                        LTV: {(((formData as MortgagePurchaseForm).loan_amount_vnd! / (formData as MortgagePurchaseForm).property_value_vnd!) * 100).toFixed(1)}%
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
              <Card variant="bordered" className="border-orange-200 bg-orange-50/30">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-dark-darker flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Khoản Vay Cũ (Hiện Tại)
                  </h3>
                  <p className="text-sm text-gray-500">Thông tin khoản vay bạn đang muốn tái cấu trúc</p>
                </CardHeader>
                <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dư Nợ Còn Lại (tỷ đồng) *
                    </label>
                    <BillionInput
                      placeholder="VD: 1.5"
                      value={(formData as RefinanceForm).old_loan?.old_remaining_balance_vnd}
                      onChange={(v) => handleOldLoanChange('old_remaining_balance_vnd', v)}
                    />
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
              <Card variant="bordered" className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-dark-darker flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Khoản Vay Mới (Refinance)
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
                    <BillionInput
                      placeholder="0"
                      value={(formData as RefinanceForm).cash_out_vnd}
                      onChange={(v) => handleInputChange('cash_out_vnd', v)}
                    />
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
