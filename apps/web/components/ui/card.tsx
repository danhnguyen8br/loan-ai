import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'leadity';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = false, children, ...props }, ref) => {
    // Using design tokens for consistent gray colors
    const variantStyles = {
      default: 'bg-white rounded-leadity shadow-leadity border border-leadity-gray-light/50',
      bordered: 'bg-white rounded-leadity border border-leadity-gray-light hover:border-leadity-gray',
      elevated: 'bg-white rounded-leadity shadow-leadity-lg border border-leadity-gray-light/50',
      leadity: 'bg-white rounded-leadity shadow-leadity border border-leadity-gray-light/50',
    };

    const hoverStyles = hover 
      ? 'transition-all duration-200 hover:shadow-leadity-lg hover:-translate-y-1 hover:border-leadity-gray-light' 
      : 'transition-colors duration-200';

    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`p-4 sm:p-6 pb-3 sm:pb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`p-4 sm:p-6 pt-0 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`p-4 sm:p-6 pt-3 sm:pt-4 border-t border-leadity-gray-light bg-leadity-gray-lighter/50 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };
