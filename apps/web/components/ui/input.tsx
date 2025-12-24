import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-base font-medium text-dark mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            block w-full rounded-leadity-md border-2 px-4 py-3 text-lg
            transition-all duration-200
            placeholder:text-text-muted
            focus:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/30
            disabled:bg-leadity-gray-lighter disabled:border-leadity-gray-light disabled:text-text-disabled disabled:cursor-not-allowed
            ${error 
              ? 'border-status-error focus-visible:border-status-error focus-visible:ring-status-error/20 bg-status-error-light/30' 
              : 'border-leadity-gray-light hover:border-leadity-gray bg-white'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-base text-status-error flex items-center gap-1.5">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-base text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
