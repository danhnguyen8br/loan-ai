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
      transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:scale-[0.98]
    `;

    const variantStyles = {
      primary: `
        bg-primary text-dark-darker hover:bg-primary-hover
        shadow-leadity-button hover:shadow-leadity-lg
        hover:-translate-y-0.5
        rounded-leadity-lg
      `,
      secondary: `
        bg-gray-100 text-dark hover:bg-gray-200
        rounded-leadity-lg
      `,
      outline: `
        border-2 border-primary text-dark bg-transparent
        hover:bg-primary hover:text-dark-darker
        rounded-leadity-lg
      `,
      danger: `
        bg-red-600 text-white hover:bg-red-700
        focus:ring-red-500
        rounded-leadity-lg
      `,
      dark: `
        bg-dark text-white hover:bg-dark-darker
        rounded-leadity-lg
      `,
      ghost: `
        bg-transparent text-dark hover:bg-gray-100
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
