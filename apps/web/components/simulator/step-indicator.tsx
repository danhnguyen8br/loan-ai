'use client';

import { Icons } from '@/components/ui/icons';

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
                  index < currentStep ? 'bg-primary-dark' : 'bg-leadity-gray-light'
                }`}
              />
            )}
            
            <div className="flex flex-col items-center relative">
              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-primary-dark text-text-inverse shadow-sm'
                    : index === currentStep
                    ? 'bg-primary text-dark-darker ring-4 ring-primary/25 shadow-sm'
                    : 'bg-leadity-gray-lighter text-text-muted border border-leadity-gray-light'
                }`}
              >
                {index < currentStep ? (
                  <Icons.Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Label */}
              <div className="mt-3 text-center">
                <p className={`text-sm font-medium transition-colors duration-200 ${
                  index <= currentStep ? 'text-dark-darker' : 'text-text-muted'
                }`}>
                  {step.label}
                </p>
                <p className={`text-xs mt-0.5 hidden sm:block transition-colors duration-200 ${
                  index <= currentStep ? 'text-leadity-gray-muted' : 'text-text-muted'
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

