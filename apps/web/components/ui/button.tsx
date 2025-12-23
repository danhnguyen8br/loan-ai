import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'dark' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-semibold
      transition-all duration-200 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500
      disabled:opacity-70 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
      active:scale-[0.98]
    `;

    const variantStyles = {
      primary: `
        bg-primary text-gray-900 
        hover:bg-primary-dark hover:text-white
        active:bg-primary-700
        shadow-md hover:shadow-lg active:shadow-sm
        hover:-translate-y-0.5 active:translate-y-0
        rounded-leadity-lg
      `,
      secondary: `
        bg-gray-100 text-gray-700 
        hover:bg-gray-200 hover:text-gray-900
        active:bg-gray-300
        border border-gray-200 hover:border-gray-300
        rounded-leadity-lg
      `,
      outline: `
        border-2 border-primary text-gray-800 bg-transparent
        hover:bg-primary hover:text-gray-900
        active:bg-primary-dark active:border-primary-dark active:text-white
        rounded-leadity-lg
      `,
      danger: `
        bg-red-600 text-white 
        hover:bg-red-700 
        active:bg-red-800
        focus-visible:ring-red-500
        shadow-sm hover:shadow-md
        rounded-leadity-lg
      `,
      dark: `
        bg-dark text-white 
        hover:bg-dark-darker
        active:bg-black
        shadow-sm hover:shadow-md
        rounded-leadity-lg
      `,
      ghost: `
        bg-transparent text-gray-700 
        hover:bg-gray-100 hover:text-gray-900
        active:bg-gray-200
        rounded-leadity-lg
      `,
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-leadity-md',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3.5 text-lg',
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
