import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary-500',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
  title?: boolean;
}

export function LoadingSkeleton({ 
  className, 
  lines = 3, 
  avatar = false, 
  title = false 
}: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse-soft', className)}>
      {title && (
        <div className="skeleton-title animate-shimmer" />
      )}
      
      {avatar && (
        <div className="skeleton-avatar animate-shimmer mb-4" />
      )}
      
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={cn(
            'skeleton-text animate-shimmer',
            i === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
  showImage?: boolean;
  showAvatar?: boolean;
  showTitle?: boolean;
  lines?: number;
}

export function LoadingCard({ 
  className, 
  showImage = true, 
  showAvatar = true, 
  showTitle = true, 
  lines = 4 
}: LoadingCardProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow-md p-6 border', className)}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <div className="skeleton-avatar animate-shimmer flex-shrink-0" />
        )}
        
        <div className="flex-1 space-y-3">
          {showTitle && (
            <div className="skeleton-title animate-shimmer" />
          )}
          
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                'skeleton-text animate-shimmer',
                i === lines - 1 && 'w-1/2'
              )}
            />
          ))}
        </div>
      </div>
      
      {showImage && (
        <div className="mt-4 h-32 bg-gray-200 rounded-lg animate-shimmer" />
      )}
    </div>
  );
}

interface LoadingButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function LoadingButton({ 
  text, 
  size = 'md', 
  variant = 'default', 
  className 
}: LoadingButtonProps) {
  return (
    <div 
      className={cn(
        'skeleton-button animate-shimmer inline-block',
        {
          'h-10 w-20': size === 'sm',
          'h-12 w-24': size === 'md', 
          'h-14 w-32': size === 'lg',
        },
        {
          'rounded-md': variant === 'outline',
          'rounded-lg': variant === 'default',
          'rounded-full': variant === 'ghost',
        },
        className
      )}
    />
  );
}

interface LoadingPageProps {
  title?: boolean;
  showNavigation?: boolean;
  cardCount?: number;
  className?: string;
}

export function LoadingPage({ 
  title = true, 
  showNavigation = true, 
  cardCount = 3, 
  className 
}: LoadingPageProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {title && (
        <div className="text-center space-y-4">
          <div className="skeleton-title w-1/2 mx-auto animate-shimmer" />
          <div className="skeleton-text w-3/4 mx-auto animate-shimmer" />
        </div>
      )}
      
      {showNavigation && (
        <div className="flex space-x-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="skeleton w-16 h-8 rounded-full animate-shimmer"
            />
          ))}
        </div>
      )}
      
      <div className="grid gap-6">
        {Array.from({ length: cardCount }, (_, i) => (
          <LoadingCard 
            key={i}
            showImage={i % 2 === 0}
            showAvatar={i % 3 === 0}
            showTitle={true}
            lines={3}
          />
        ))}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  children, 
  className 
}: LoadingOverlayProps) {
  if (!isVisible) return <>{children}</>;
  
  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 animate-pulse">Loading...</p>
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function ProgressBar({ 
  progress, 
  className, 
  showPercentage = true, 
  size = 'md',
  color = 'primary'
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };
  
  return (
    <div className={cn('w-full', className)}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// Toast-style loading notification
interface LoadingToastProps {
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  className?: string;
}

export function LoadingToast({ 
  message, 
  isVisible, 
  onClose, 
  className 
}: LoadingToastProps) {
  if (!isVisible) return null;
  
  return (
    <div
      className={cn(
        'fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-80',
        'animate-slide-in-right',
        className
      )}
    >
      <div className="flex items-center space-x-3">
        <LoadingSpinner size="sm" />
        <p className="text-gray-700 font-medium">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
