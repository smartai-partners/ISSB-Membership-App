import React from 'react';
import { cn } from '../../utils/cn';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right' | 'between';
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ 
    className, 
    children, 
    border = true,
    padding = 'md',
    align = 'left',
    ...props 
  }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'px-3 py-2',
      md: 'px-6 py-4',
      lg: 'px-8 py-6'
    };

    const borderClasses = border ? 'border-t border-gray-200' : '';
    
    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between'
    };

    return (
      <div
        ref={ref}
        className={cn(
          paddingClasses[padding],
          borderClasses,
          'flex items-center',
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default CardFooter;