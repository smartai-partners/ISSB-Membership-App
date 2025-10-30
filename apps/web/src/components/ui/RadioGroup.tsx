import React, { forwardRef, useId, useState } from 'react';
import { clsx } from 'clsx';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  description?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  required?: boolean;
  success?: boolean;
  warning?: boolean;
  options: RadioOption[];
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  (
    {
      name,
      value,
      defaultValue,
      onChange,
      label,
      description,
      error,
      helperText,
      variant = 'default',
      size = 'md',
      disabled = false,
      required = false,
      success = false,
      warning = false,
      options,
      direction = 'vertical',
      className,
    },
    ref
  ) => {
    const internalId = useId();
    const groupId = `${internalId}-group`;
    const errorId = `${groupId}-error`;
    const helperTextId = `${groupId}-helper`;
    const descriptionId = `${groupId}-description`;

    const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    const handleChange = (optionValue: string) => {
      if (disabled) return;
      
      if (value === undefined) {
        setSelectedValue(optionValue);
      }
      
      onChange?.(optionValue);
    };

    const getSizeClasses = () => {
      const sizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
      };
      return sizes[size];
    };

    const getRadioClasses = (option: RadioOption, isSelected: boolean) => {
      const baseClasses = 'flex-shrink-0 rounded-full border-2 transition-all duration-200';
      
      if (disabled || option.disabled) {
        return `${baseClasses} border-gray-200 bg-gray-100 cursor-not-allowed`;
      }

      if (error) {
        return `${baseClasses} border-danger-500 focus-within:ring-danger-500/20`;
      }

      if (success) {
        return `${baseClasses} border-success-500 focus-within:ring-success-500/20`;
      }

      if (warning) {
        return `${baseClasses} border-warning-500 focus-within:ring-warning-500/20`;
      }

      if (variant === 'filled') {
        return `${baseClasses} border-transparent bg-gray-50 focus:bg-white focus:border-primary-500 focus-within:ring-primary-500/20`;
      }

      if (variant === 'ghost') {
        return `${baseClasses} border-transparent bg-transparent hover:bg-gray-50 focus:bg-gray-50 focus:border-primary-500 focus-within:ring-primary-500/20`;
      }

      return `${baseClasses} border-gray-300 focus-within:border-primary-500 focus-within:ring-primary-500/20`;
    };

    const getTextSizeClasses = () => {
      const sizes = {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
      };
      return sizes[size];
    };

    const getDirectionClasses = () => {
      return direction === 'horizontal' ? 'flex-row space-x-4' : 'space-y-3';
    };

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <div className="mb-3">
            <label
              className={clsx(
                'block text-sm font-medium',
                error ? 'text-danger-700' : success ? 'text-success-700' : warning ? 'text-warning-700' : 'text-gray-700',
                disabled && 'text-gray-400'
              )}
            >
              {label}
              {required && <span className="text-danger-500 ml-1" aria-label="required">*</span>}
            </label>
          </div>
        )}

        {description && (
          <div className="mb-3">
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

        <div
          role="radiogroup"
          aria-labelledby={label ? `${groupId}-label` : undefined}
          aria-describedby={clsx(error && errorId, helperText && helperTextId, description && descriptionId)}
          aria-invalid={error ? 'true' : 'false'}
          className={clsx(
            'flex',
            getDirectionClasses(),
            disabled && 'opacity-50'
          )}
        >
          {options.map((option, index) => {
            const isSelected = selectedValue === option.value;
            const optionId = `${groupId}-${index}`;
            
            return (
              <div
                key={option.value}
                className={clsx(
                  'flex items-start gap-3',
                  direction === 'horizontal' ? 'flex-1' : 'w-full'
                )}
              >
                <div className="relative flex-shrink-0 pt-0.5">
                  <input
                    ref={ref}
                    type="radio"
                    id={optionId}
                    name={name}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => handleChange(option.value)}
                    disabled={disabled || option.disabled}
                    className="sr-only"
                    aria-describedby={clsx(error && errorId, helperText && helperTextId)}
                    aria-required={required}
                  />
                  
                  {/* Custom radio UI */}
                  <div
                    className={clsx(
                      getSizeClasses(),
                      getRadioClasses(option, isSelected),
                      'flex items-center justify-center cursor-pointer'
                    )}
                    onClick={() => handleChange(option.value)}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleChange(option.value);
                      }
                    }}
                  >
                    {isSelected && (
                      <div
                        className={clsx(
                          'rounded-full transition-all duration-200',
                          disabled || option.disabled 
                            ? 'bg-gray-400' 
                            : error 
                            ? 'bg-danger-500'
                            : success
                            ? 'bg-success-500'
                            : warning
                            ? 'bg-warning-500'
                            : 'bg-primary-500',
                          getSizeClasses().includes('w-4') && 'w-2 h-2',
                          getSizeClasses().includes('w-5') && 'w-2.5 h-2.5',
                          getSizeClasses().includes('w-6') && 'w-3 h-3'
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={optionId}
                    className={clsx(
                      'flex items-start gap-2 cursor-pointer',
                      disabled || option.disabled ? 'cursor-not-allowed opacity-50' : ''
                    )}
                  >
                    <div className="flex-1">
                      <div className={clsx(
                        'font-medium',
                        getTextSizeClasses(),
                        disabled || option.disabled ? 'text-gray-400' : 'text-gray-900'
                      )}>
                        {option.icon && (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-gray-400">{option.icon}</span>
                            {option.label}
                          </span>
                        )}
                        {!option.icon && option.label}
                      </div>
                      
                      {option.description && (
                        <p className={clsx(
                          'mt-1 text-sm',
                          disabled || option.disabled ? 'text-gray-400' : 'text-gray-500'
                        )}>
                          {option.description}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-danger-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={helperTextId}
            className="mt-2 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export default RadioGroup;