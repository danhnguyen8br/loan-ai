'use client';

import { useState, useCallback } from 'react';
import { NeedsStrategyStep, type NeedsStrategy } from '@/components/simulator/needs-strategy-step';
import { RecommendationStep } from '@/components/simulator/recommendation-step';
import { useRecommendation, type RecommendResponse } from '@/lib/hooks/use-simulator';

type Step = 'input' | 'result';

const STEP_CONFIG = {
  input: { index: 0, label: 'Nhập thông tin' },
  result: { index: 1, label: 'Kết quả' },
};

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [inputData, setInputData] = useState<NeedsStrategy | null>(null);
  const [result, setResult] = useState<RecommendResponse | null>(null);

  const recommendation = useRecommendation();

  // Run recommendation when we have input data
  const runRecommendation = useCallback(async (data: NeedsStrategy) => {
    try {
      const response = await recommendation.mutateAsync(data);
      setResult(response);
    } catch (error) {
      console.error('Recommendation failed:', error);
    }
  }, [recommendation]);

  // Step navigation handlers
  const handleInputComplete = async (data: NeedsStrategy) => {
    setInputData(data);
    setCurrentStep('result');
    await runRecommendation(data);
  };

  const handleEditInput = () => {
    setCurrentStep('input');
    setResult(null);
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <NeedsStrategyStep
            initialData={inputData ?? undefined}
            onContinue={handleInputComplete}
          />
        );
      case 'result':
        return inputData ? (
          <RecommendationStep
            category={inputData.mode}
            needsStrategy={inputData}
            result={result!}
            isLoading={recommendation.isPending}
            error={recommendation.error?.message}
            onEditNeeds={handleEditInput}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ==================== MOBILE LAYOUT ==================== */}
      <div className="lg:hidden">
        {/* Mobile Main Content */}
        <div className="max-w-lg mx-auto py-4">
          {renderStepContent()}
        </div>

        {/* Mobile Footer CTA */}
        {currentStep === 'input' && (
          <div className="text-center px-4 pb-6 space-y-4">
            <div className="bg-gradient-to-r from-[#4DC614]/10 to-emerald-50 rounded-xl p-4 max-w-sm mx-auto border border-[#4DC614]/20">
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Lãi suất được <span className="font-semibold text-[#4DC614]">Leadity</span> lựa chọn từ các gói vay cạnh tranh nhất trên thị trường. Để có được thông tin cụ thể hơn, hãy liên hệ với chúng tôi ngay hôm nay.
              </p>
              <a
                href="https://www.leadity.ai/#contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#4DC614] hover:bg-[#45b312] text-white font-semibold px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <span>Liên hệ tư vấn</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ==================== DESKTOP LAYOUT ==================== */}
      <div className="hidden lg:block">
        {/* Desktop Header */}
        <div className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Tìm Gói Vay Phù Hợp</h1>
              <p className="text-base text-gray-500 mt-0.5">
                Công cụ tìm kiếm gói vay phù hợp với nhu cầu của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Main Content - Centered */}
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Step Title Bar */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4DC614] text-white flex items-center justify-center text-base font-bold">
                  {STEP_CONFIG[currentStep].index + 1}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentStep === 'input' && 'Thông Tin & Chiến Lược Trả Nợ'}
                    {currentStep === 'result' && 'Gói Vay Được Đề Xuất'}
                  </h2>
                  <p className="text-base text-gray-500">
                    Bước {STEP_CONFIG[currentStep].index + 1} / 2
                  </p>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              {renderStepContent()}
            </div>
          </div>

          {/* Desktop Footer CTA */}
          {currentStep === 'input' && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-[#4DC614]/10 to-emerald-50 rounded-xl p-5 border border-[#4DC614]/20 flex items-center justify-between gap-6">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Lãi suất được <span className="font-semibold text-[#4DC614]">Leadity</span> lựa chọn từ các gói vay cạnh tranh nhất trên thị trường. Để có được thông tin cụ thể hơn, hãy liên hệ với chúng tôi ngay hôm nay.
                  </p>
                </div>
                <a
                  href="https://www.leadity.ai/#contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#4DC614] hover:bg-[#45b312] text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  <span>Liên hệ tư vấn</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
