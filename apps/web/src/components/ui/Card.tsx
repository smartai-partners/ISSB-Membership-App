import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    children, 
    variant = 'default', 
    padding = 'md',
    hover = false,
    interactive = false,
    ...props 
  }, ref) => {
    const baseClasses = 'bg-white rounded-lg transition-all duration-200';
    
    const variantClasses = {
      default: 'shadow-sm border border-gray-200',
      elevated: 'shadow-md border border-gray-200',
      outlined: 'shadow-sm border-2 border-gray-300',
      ghost: 'shadow-none border border-gray-100'
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    };

    const hoverClasses = hover || interactive ? 'hover:shadow-lg hover:-translate-y-1' : '';
    const interactiveClasses = interactive ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50' : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          hoverClasses,
          interactiveClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;