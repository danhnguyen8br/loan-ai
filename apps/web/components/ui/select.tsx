import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
  children?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, options, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-dark mb-2 mt-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              block w-full rounded-leadity-md border-2 px-4 py-3 text-base
              appearance-none bg-white
              transition-all duration-200
              focus:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/30
              disabled:bg-leadity-gray-lighter disabled:border-leadity-gray-light disabled:text-text-disabled disabled:cursor-not-allowed
              ${error 
                ? 'border-status-error focus-visible:border-status-error focus-visible:ring-status-error/20 bg-status-error-light/30' 
                : 'border-leadity-gray-light hover:border-leadity-gray'
              }
              ${className}
            `}
            {...props}
          >
            {options ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )) : children}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <svg className="w-5 h-5 text-leadity-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-status-error flex items-center gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
