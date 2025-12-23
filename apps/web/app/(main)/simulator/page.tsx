'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { StepIndicator } from '@/components/simulator/step-indicator';
import { CategoryStep } from '@/components/simulator/category-step';
import { InputsStep, SimulatorFormData } from '@/components/simulator/inputs-step';
import { StrategyResultsStep } from '@/components/simulator/strategy-results-step';
import { 
  useTemplates, 
  useSimulationV3,
  isMortgageResponse,
  isRefinanceResponse,
  buildMortgagePurchaseInput,
  buildRefinanceInput,
} from '@/lib/hooks/use-simulator';
import type { 
  MortgagePurchaseForm, 
  RefinanceForm, 
  MortgageMultiStrategyResult, 
  RefinanceMultiStrategyResult,
  SimulateResponseV3,
} from '@/lib/simulator-types';

type Step = 'category' | 'inputs' | 'strategy-results';

const STEPS = [
  { label: 'Loại Vay', description: 'Chọn mục đích' },
  { label: 'Thông Tin', description: 'Nhập dữ liệu' },
  { label: 'Kết Quả', description: 'So sánh chi phí' },
];

// Default prefilled values for mortgage scenario
const DEFAULT_MORTGAGE_FORM: Partial<MortgagePurchaseForm> & { type: 'MORTGAGE_RE' } = {
  type: 'MORTGAGE_RE',
  property_value_vnd: 2_500_000_000,
  down_payment_vnd: 500_000_000,
  loan_amount_vnd: 2_000_000_000,
  term_months: 240,
  repayment_method: 'annuity',
  include_insurance: true,
  stress_bump: 2,
  extra_principal_vnd: 10_000_000,
  exit_rule: 'PROMO_END',
};

// Default prefilled values for refinance scenario
const DEFAULT_REFINANCE_FORM: Partial<RefinanceForm> & { type: 'REFINANCE' } = {
  type: 'REFINANCE',
  old_loan: {
    old_remaining_balance_vnd: 1_500_000_000,
    old_remaining_term_months: 180,
    old_current_rate_pct: 10.5,
    old_repayment_method: 'annuity',
    old_loan_age_months: 24,
    old_prepayment_schedule_preset: 'standard_3_2_1_0',
  },
  new_term_months: 180,
  cash_out_vnd: 0,
  refinance_month_index: 0,
  repayment_method: 'annuity',
  include_insurance: false,
  stress_bump: 2,
  extra_principal_vnd: 10_000_000,
  objective: 'MAX_NET_SAVING',
};

export default function SimulatorPage(_props: {
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [category, setCategory] = useState<'MORTGAGE_RE' | 'REFINANCE' | null>(null);
  const [formData, setFormData] = useState<SimulatorFormData>(DEFAULT_MORTGAGE_FORM);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [results, setResults] = useState<SimulateResponseV3 | null>(null);

  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates(category || undefined);
  const simulation = useSimulationV3();

  const getStepIndex = (step: Step): number => {
    const steps: Step[] = ['category', 'inputs', 'strategy-results'];
    return steps.indexOf(step);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'category':
        return category !== null;
      case 'inputs':
        if (category === 'MORTGAGE_RE') {
          const mortgageData = formData as MortgagePurchaseForm;
          return Boolean(mortgageData.loan_amount_vnd && mortgageData.loan_amount_vnd > 0);
        } else {
          const refiData = formData as RefinanceForm;
          return Boolean(refiData.old_loan?.old_remaining_balance_vnd && refiData.old_loan.old_remaining_balance_vnd > 0);
        }
      default:
        return false;
    }
  };

  const runSimulation = useCallback(async () => {
    if (selectedTemplates.length === 0) {
      return;
    }

    try {
      let input;
      
      if (category === 'MORTGAGE_RE') {
        const mortgageData = formData as MortgagePurchaseForm;
        input = buildMortgagePurchaseInput({
          property_value_vnd: mortgageData.property_value_vnd!,
          down_payment_vnd: mortgageData.down_payment_vnd!,
          loan_amount_vnd: mortgageData.loan_amount_vnd!,
          term_months: mortgageData.term_months!,
          repayment_method: mortgageData.repayment_method,
          include_insurance: mortgageData.include_insurance!,
          stress_bump: mortgageData.stress_bump!,
          // Strategy params for M2 and M3
          extra_principal_vnd: mortgageData.extra_principal_vnd,
          exit_rule: mortgageData.exit_rule,
          exit_fee_threshold_pct: mortgageData.exit_fee_threshold_pct,
          exit_custom_month: mortgageData.exit_custom_month,
        });
      } else {
        const refiData = formData as RefinanceForm;
        input = buildRefinanceInput({
          old_remaining_balance_vnd: refiData.old_loan!.old_remaining_balance_vnd,
          old_remaining_term_months: refiData.old_loan!.old_remaining_term_months,
          old_current_rate_pct: refiData.old_loan!.old_current_rate_pct,
          old_repayment_method: refiData.old_loan!.old_repayment_method,
          old_loan_age_months: refiData.old_loan!.old_loan_age_months,
          old_prepayment_schedule_preset: refiData.old_loan!.old_prepayment_schedule_preset,
          new_term_months: refiData.new_term_months!,
          cash_out_vnd: refiData.cash_out_vnd,
          refinance_month_index: refiData.refinance_month_index ?? 0,
          repayment_method: refiData.repayment_method,
          include_insurance: refiData.include_insurance!,
          stress_bump: refiData.stress_bump!,
          // Strategy params for R2 and R3
          extra_principal_vnd: refiData.extra_principal_vnd,
          objective: refiData.objective,
        });
      }

      const response = await simulation.mutateAsync({
        template_ids: selectedTemplates,
        input,
      });

      setResults(response);
    } catch (error) {
      console.error('Simulation failed:', error);
    }
  }, [formData, selectedTemplates, simulation, category]);

  const handleNext = async () => {
    if (currentStep === 'category') {
      setCurrentStep('inputs');
    } else if (currentStep === 'inputs') {
      setCurrentStep('strategy-results');
    }
  };

  const handleBack = () => {
    if (currentStep === 'inputs') {
      setCurrentStep('category');
    } else if (currentStep === 'strategy-results') {
      setCurrentStep('inputs');
    }
  };

  const handleCategorySelect = (cat: 'MORTGAGE_RE' | 'REFINANCE') => {
    setCategory(cat);
    // Set appropriate default form data
    if (cat === 'MORTGAGE_RE') {
      setFormData(DEFAULT_MORTGAGE_FORM);
    } else {
      setFormData(DEFAULT_REFINANCE_FORM);
    }
    // Clear selections
    setSelectedTemplates([]);
    setResults(null);
  };

  const handleReset = useCallback(() => {
    setCurrentStep('category');
    setCategory(null);
    setFormData(DEFAULT_MORTGAGE_FORM);
    setSelectedTemplates([]);
    setResults(null);
  }, []);

  const handleTemplateChange = useCallback((templateIds: string[]) => {
    setSelectedTemplates(templateIds);
  }, []);

  const handleFormChange = useCallback((data: SimulatorFormData) => {
    setFormData(data);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark-darker mb-1">
              Mô Phỏng Chi Phí Vay
            </h1>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
              {category === 'MORTGAGE_RE' 
                ? 'So sánh chi phí vay mua BĐS giữa các gói vay và 3 chiến lược trả nợ'
                : category === 'REFINANCE'
                ? 'Phân tích lợi ích tái tài trợ với 3 chiến lược và tìm điểm hoà vốn'
                : 'So sánh chi phí giữa các gói vay và chiến lược trả nợ khác nhau'}
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <StepIndicator 
          currentStep={getStepIndex(currentStep)} 
          steps={STEPS} 
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Loading State */}
        {isLoadingTemplates && currentStep !== 'category' && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Đang tải...</span>
          </div>
        )}

        {/* Category Step */}
        {currentStep === 'category' && (
          <CategoryStep
            selectedCategory={category}
            onSelect={handleCategorySelect}
          />
        )}

        {/* Inputs Step */}
        {currentStep === 'inputs' && category && (
          <InputsStep
            category={category}
            formData={formData}
            onChange={handleFormChange}
          />
        )}

        {/* Strategy + Results Step (Combined) */}
        {currentStep === 'strategy-results' && category && templatesData && (
          <StrategyResultsStep
            category={category}
            templates={templatesData.templates}
            selectedTemplates={selectedTemplates}
            onTemplateChange={handleTemplateChange}
            formData={formData}
            onFormChange={handleFormChange}
            onSimulate={runSimulation}
            isSimulating={simulation.isPending}
            results={results}
            onReset={handleReset}
          />
        )}

        {/* Navigation Buttons */}
        {currentStep !== 'strategy-results' && (
          <div className="mt-8 flex justify-between items-center max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 'category'}
              className={currentStep === 'category' ? 'invisible' : ''}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay Lại
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="min-w-[140px]"
            >
              Tiếp Tục
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        )}

        {/* Back button for strategy-results step */}
        {currentStep === 'strategy-results' && (
          <div className="mt-4 flex justify-start max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Chỉnh Sửa Thông Tin
            </Button>
          </div>
        )}

        {/* Error Display */}
        {simulation.isError && (
          <Card variant="bordered" className="mt-6 bg-red-50 border-red-200 max-w-4xl mx-auto">
            <CardBody className="p-4">
              <div className="flex items-center text-red-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Có lỗi xảy ra: {simulation.error?.message}</span>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
