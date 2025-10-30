import React, { forwardRef, InputHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  description?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  success?: boolean;
  warning?: boolean;
  required?: boolean;
  indeterminate?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      helperText,
      variant = 'default',
      size = 'md',
      success = false,
      warning = false,
      required = false,
      indeterminate = false,
      disabled,
      id,
      checked,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const internalId = useId();
    const checkboxId = id || internalId;
    const errorId = `${checkboxId}-error`;
    const helperTextId = `${checkboxId}-helper`;
    const descriptionId = `${checkboxId}-description`;

    const getSizeClasses = () => {
      const sizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
      };
      return sizes[size];
    };

    const getCheckboxClasses = () => {
      if (disabled) {
        return 'bg-gray-100 border-gray-200 cursor-not-allowed';
      }

      if (error) {
        return 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20';
      }

      if (success) {
        return 'border-success-500 focus:border-success-500 focus:ring-success-500/20';
      }

      if (warning) {
        return 'border-warning-500 focus:border-warning-500 focus:ring-warning-500/20';
      }

      if (variant === 'filled') {
        return 'border-transparent bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-primary-500/20';
      }

      if (variant === 'ghost') {
        return 'border-transparent bg-transparent hover:bg-gray-50 focus:bg-gray-50 focus:border-primary-500 focus:ring-primary-500/20';
      }

      return 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20';
    };

    const getTextSizeClasses = () => {
      const sizes = {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
      };
      return sizes[size];
    };

    React.useEffect(() => {
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.indeterminate = indeterminate;
      }
    }, [indeterminate, ref]);

    const checkbox = (
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={clsx(
              'sr-only',
              className
            )}
            disabled={disabled}
            checked={checked}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={clsx(error && errorId, helperText && helperTextId, description && descriptionId)}
            {...props}
          />
          
          {/* Custom checkbox UI */}
          <div
            className={clsx(
              getSizeClasses(),
              'rounded border-2 flex items-center justify-center transition-all duration-200',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2',
              error 
                ? 'border-danger-500 focus-within:ring-danger-500/20' 
                : success 
                ? 'border-success-500 focus-within:ring-success-500/20'
                : warning
                ? 'border-warning-500 focus-within:ring-warning-500/20'
                : 'border-gray-300 focus-within:ring-primary-500/20',
              disabled && 'cursor-not-allowed opacity-50',
              checked || indeterminate ? 'bg-primary-500 border-primary-500' : 'bg-white',
              checked || indeterminate ? 'text-white' : 'text-transparent'
            )}
            onClick={() => {
              const input = document.getElementById(checkboxId) as HTMLInputElement;
              if (input && !disabled) {
                input.click();
              }
            }}
          >
            {(checked || indeterminate) && (
              <Check 
                size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} 
                className={clsx(
                  'font-bold',
                  indeterminate ? 'rotate-0' : ''
                )}
              />
            )}
          </div>
        </div>

        {(label || leftIcon) && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {leftIcon && (
              <div className="flex-shrink-0 text-gray-400">
                {leftIcon}
              </div>
            )}
            {label && (
              <label
                htmlFor={checkboxId}
                className={clsx(
                  getTextSizeClasses(),
                  'font-medium cursor-pointer select-none',
                  disabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-900',
                  error ? 'text-danger-700' : success ? 'text-success-700' : warning ? 'text-warning-700' : 'text-gray-700',
                  !label && description ? 'sr-only' : ''
                )}
              >
                {label}
                {required && <span className="text-danger-500 ml-1" aria-label="required">*</span>}
              </label>
            )}
          </div>
        )}

        {rightIcon && (
          <div className="flex-shrink-0 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (description) {
      return (
        <div className="w-full">
          {checkbox}
          {description && (
            <div className="mt-1 pl-8">
              <p
                id={descriptionId}
                className={clsx(
                  'text-sm',
                  disabled ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                {description}
              </p>
            </div>
          )}
          {error && (
            <div className="mt-1 pl-8">
              <p
                id={errorId}
                className="text-sm text-danger-600"
                role="alert"
              >
                {error}
              </p>
            </div>
          )}
          {!error && helperText && (
            <div className="mt-1 pl-8">
              <p
                id={helperTextId}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        {checkbox}
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-danger-600 pl-8"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={helperTextId}
            className="mt-1.5 text-sm text-gray-500 pl-8"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;