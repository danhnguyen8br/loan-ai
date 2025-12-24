import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 
    | 'default' 
    | 'success' 
    | 'warning' 
    | 'danger' 
    | 'info' 
    | 'primary'
    // Semantic loan-related variants
    | 'promoRate'
    | 'floatingRate'
    | 'grace'
    | 'fee'
    | 'insurance';
  size?: 'xs' | 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'sm', children, ...props }, ref) => {
    // WCAG AA compliant contrast ratios (4.5:1 minimum for normal text)
    // Using primary-700 (#2d7a0b) for green text on light backgrounds
    const variantStyles = {
      // Core variants - WCAG AA compliant
      default: 'bg-leadity-gray-lighter text-leadity-gray border border-leadity-gray-light',
      success: 'bg-primary-50 text-primary-700 border border-primary-200',
      warning: 'bg-status-warning-light text-status-warning-dark border border-amber-200',
      danger: 'bg-status-error-light text-status-error-dark border border-red-200',
      info: 'bg-primary-50 text-dark border border-primary-200',
      primary: 'bg-primary-100 text-primary-700 border border-primary-300',
      // Semantic loan-related variants - using darker text for contrast
      promoRate: 'bg-primary-50 text-primary-700 border border-primary-200',
      floatingRate: 'bg-orange-50 text-orange-800 border border-orange-200',
      grace: 'bg-purple-50 text-purple-800 border border-purple-200',
      fee: 'bg-teal-50 text-teal-800 border border-teal-200',
      insurance: 'bg-violet-50 text-violet-800 border border-violet-200',
    };

    const sizeStyles = {
      xs: 'px-1.5 py-0.5 text-[10px]',
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-full font-medium
          ${variantStyles[variant]} 
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
