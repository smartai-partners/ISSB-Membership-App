import React from 'react';
import { cn } from '../../utils/cn';

export interface CardLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'skeleton' | 'spinner' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  text?: string;
}

const CardLoading = React.forwardRef<HTMLDivElement, CardLoadingProps>(
  ({ 
    className, 
    variant = 'skeleton',
    size = 'md',
    overlay = false,
    text = 'Loading...',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };

    const textSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    const renderSkeleton = () => (
      <div className="animate-pulse space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          <div className="h-4 bg-gray-300 rounded w-4/6"></div>
        </div>
        {/* Footer skeleton */}
        <div className="flex justify-between items-center pt-4">
          <div className="h-8 bg-gray-300 rounded w-20"></div>
          <div className="h-8 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    );

    const renderSpinner = () => (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={cn(
          'spinner',
          sizeClasses[size]
        )}></div>
        {text && (
          <p className={cn(
            'text-gray-500 font-medium',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );

    const renderDots = () => (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        {text && (
          <p className={cn(
            'text-gray-500 font-medium',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );

    const renderLoadingContent = () => {
      switch (variant) {
        case 'spinner':
          return renderSpinner();
        case 'dots':
          return renderDots();
        case 'skeleton':
        default:
          return renderSkeleton();
      }
    };

    if (overlay) {
      return (
        <div
          ref={ref}
          className={cn(
            'absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10',
            className
          )}
          {...props}
        >
          {renderLoadingContent()}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-lg p-6 border border-gray-200',
          className
        )}
        {...props}
      >
        {renderLoadingContent()}
      </div>
    );
  }
);

CardLoading.displayName = 'CardLoading';

// Simple loading card with just spinner
export const CardSpinner = React.forwardRef<HTMLDivElement, Omit<CardLoadingProps, 'variant'>>(
  ({ size = 'md', text, ...props }, ref) => (
    <CardLoading
      ref={ref}
      variant="spinner"
      size={size}
      text={text}
      {...props}
    />
  )
);

CardSpinner.displayName = 'CardSpinner';

// Simple loading card with skeleton content
export const CardSkeleton = React.forwardRef<HTMLDivElement, Omit<CardLoadingProps, 'variant'>>(
  (props, ref) => (
    <CardLoading
      ref={ref}
      variant="skeleton"
      {...props}
    />
  )
);

CardSkeleton.displayName = 'CardSkeleton';

// Inline loading indicator for use within existing cards
export const InlineLoading = React.forwardRef<HTMLDivElement, Omit<CardLoadingProps, 'variant' | 'overlay' | 'className'>>(
  ({ size = 'sm', text, ...props }, ref) => (
    <CardLoading
      ref={ref}
      variant="spinner"
      size={size}
      text={text}
      className="bg-transparent border-none p-0"
      {...props}
    />
  )
);

InlineLoading.displayName = 'InlineLoading';

export default CardLoading;