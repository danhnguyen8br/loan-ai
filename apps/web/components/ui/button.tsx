import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'dark' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    // Standardized focus ring: 3px width, primary color with 30% opacity
    const baseStyles = `
      inline-flex items-center justify-center font-semibold
      transition-all duration-200 ease-out
      focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 focus-visible:ring-offset-2
      disabled:opacity-70 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
      active:scale-[0.98]
      touch-manipulation select-none
    `;

    // Using design tokens for consistent colors
    const variantStyles = {
      primary: `
        bg-primary text-dark-darker 
        hover:bg-primary-dark hover:text-text-inverse
        active:bg-primary-700
        shadow-md hover:shadow-lg active:shadow-sm
        hover:-translate-y-0.5 active:translate-y-0
        rounded-leadity-lg
      `,
      secondary: `
        bg-leadity-gray-lighter text-leadity-gray 
        hover:bg-leadity-gray-light hover:text-dark-darker
        active:bg-leadity-gray-light
        border border-leadity-gray-light hover:border-leadity-gray
        rounded-leadity-lg
      `,
      outline: `
        border-2 border-primary text-dark bg-transparent
        hover:bg-primary hover:text-dark-darker
        active:bg-primary-dark active:border-primary-dark active:text-text-inverse
        rounded-leadity-lg
      `,
      danger: `
        bg-status-error text-text-inverse 
        hover:bg-status-error-dark 
        active:bg-red-900
        focus-visible:ring-status-error/30
        shadow-sm hover:shadow-md
        rounded-leadity-lg
      `,
      dark: `
        bg-dark text-text-inverse 
        hover:bg-dark-darker
        active:bg-black
        shadow-sm hover:shadow-md
        rounded-leadity-lg
      `,
      ghost: `
        bg-transparent text-leadity-gray 
        hover:bg-leadity-gray-lighter hover:text-dark-darker
        active:bg-leadity-gray-light
        rounded-leadity-lg
      `,
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-leadity-md min-h-[36px]',
      md: 'px-6 py-2.5 text-base min-h-[44px]',
      lg: 'px-8 py-3.5 text-lg min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
