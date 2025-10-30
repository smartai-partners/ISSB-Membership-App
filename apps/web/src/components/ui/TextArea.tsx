import React, { forwardRef, TextareaHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  isLoading?: boolean;
  success?: boolean;
  warning?: boolean;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      variant = 'default',
      size = 'md',
      resize = 'vertical',
      isLoading = false,
      success = false,
      warning = false,
      required = false,
      disabled,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const internalId = useId();
    const inputId = id || internalId;
    const errorId = `${inputId}-error`;
    const helperTextId = `${inputId}-helper`;

    const getVariantClasses = () => {
      const baseClasses = 'w-full rounded-lg border transition-colors duration-200';
      
      if (disabled) {
        return `${baseClasses} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`;
      }

      if (error) {
        return `${baseClasses} border-danger-500 focus:border-danger-500 focus:ring-danger-500/20 text-danger-900 placeholder:text-danger-300`;
      }

      if (success) {
        return `${baseClasses} border-success-500 focus:border-success-500 focus:ring-success-500/20 text-success-900 placeholder:text-success-300`;
      }

      if (warning) {
        return `${baseClasses} border-warning-500 focus:border-warning-500 focus:ring-warning-500/20 text-warning-900 placeholder:text-warning-300`;
      }

      if (variant === 'filled') {
        return `${baseClasses} border-transparent bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-primary-500/20 text-gray-900 placeholder:text-gray-400`;
      }

      if (variant === 'ghost') {
        return `${baseClasses} border-transparent bg-transparent hover:bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-primary-500/20 text-gray-900 placeholder:text-gray-400`;
      }

      return `${baseClasses} bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 text-gray-900 placeholder:text-gray-400`;
    };

    const getSizeClasses = () => {
      const sizes = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base',
      };
      return sizes[size];
    };

    const getResizeClasses = () => {
      const resizeOptions = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      };
      return resizeOptions[resize];
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              'block text-sm font-medium mb-1.5',
              error ? 'text-danger-700' : success ? 'text-success-700' : warning ? 'text-warning-700' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
            {required && <span className="text-danger-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            rows={rows}
            className={clsx(
              getVariantClasses(),
              getSizeClasses(),
              getResizeClasses(),
              'font-medium',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[80px]',
              className
            )}
            disabled={disabled || isLoading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={clsx(error && errorId, helperText && helperTextId)}
            {...props}
          />

          {isLoading && (
            <div className="absolute right-3 top-3">
              <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-3">
              <AlertCircle className="w-4 h-4 text-danger-500" />
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-danger-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={helperTextId}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;