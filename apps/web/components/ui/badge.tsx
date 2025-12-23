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
    // Updated with WCAG AA compliant contrast ratios
    const variantStyles = {
      // Core variants - improved contrast
      default: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      warning: 'bg-amber-50 text-amber-800 border border-amber-200',
      danger: 'bg-red-50 text-red-700 border border-red-200',
      info: 'bg-blue-50 text-blue-700 border border-blue-200',
      primary: 'bg-primary/15 text-primary-700 border border-primary/30',
      // Semantic loan-related variants
      promoRate: 'bg-blue-50 text-blue-700 border border-blue-200',
      floatingRate: 'bg-orange-50 text-orange-700 border border-orange-200',
      grace: 'bg-purple-50 text-purple-700 border border-purple-200',
      fee: 'bg-teal-50 text-teal-700 border border-teal-200',
      insurance: 'bg-violet-50 text-violet-700 border border-violet-200',
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
