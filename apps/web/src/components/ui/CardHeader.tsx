import React from 'react';
import { cn } from '../../utils/cn';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ 
    className, 
    children, 
    border = true,
    padding = 'md',
    ...props 
  }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'px-3 py-2',
      md: 'px-6 py-4',
      lg: 'px-8 py-6'
    };

    const borderClasses = border ? 'border-b border-gray-200' : '';

    return (
      <div
        ref={ref}
        className={cn(
          paddingClasses[padding],
          borderClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export default CardHeader;