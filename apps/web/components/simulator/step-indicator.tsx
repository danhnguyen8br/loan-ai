'use client';

interface StepIndicatorProps {
  currentStep: number;
  steps: { label: string; description: string }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li key={step.label} className="relative flex-1">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={`absolute top-5 left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] h-0.5 transition-colors duration-300 ${
                  index < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            )}
            
            <div className="flex flex-col items-center relative">
              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-primary-500 text-white shadow-sm'
                    : index === currentStep
                    ? 'bg-primary text-gray-900 ring-4 ring-primary/25 shadow-sm'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Label */}
              <div className="mt-3 text-center">
                <p className={`text-sm font-medium transition-colors duration-200 ${
                  index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                <p className={`text-xs mt-0.5 hidden sm:block transition-colors duration-200 ${
                  index <= currentStep ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

