import React, { forwardRef, SelectHTMLAttributes, useId, useState } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  success?: boolean;
  warning?: boolean;
  required?: boolean;
  placeholder?: string;
  options: SelectOption[];
  leftIcon?: React.ReactNode;
  clearable?: boolean;
  searchable?: boolean;
  multiple?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      variant = 'default',
      size = 'md',
      isLoading = false,
      success = false,
      warning = false,
      required = false,
      placeholder = 'Select an option...',
      options,
      disabled,
      id,
      multiple = false,
      clearable = false,
      searchable = false,
      leftIcon,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalId = useId();
    const inputId = id || internalId;
    const errorId = `${inputId}-error`;
    const helperTextId = `${inputId}-helper`;
    
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedValue, setSelectedValue] = useState<string | string[]>(
      multiple ? [] : (props.value as string) || ''
    );

    const filteredOptions = searchable 
      ? options.filter(option => 
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    const getVariantClasses = () => {
      const baseClasses = 'w-full rounded-lg border transition-colors duration-200 cursor-pointer';
      
      if (disabled) {
        return `${baseClasses} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`;
      }

      if (error) {
        return `${baseClasses} border-danger-500 focus:border-danger-500 focus:ring-danger-500/20 text-danger-900`;
      }

      if (success) {
        return `${baseClasses} border-success-500 focus:border-success-500 focus:ring-success-500/20 text-success-900`;
      }

      if (warning) {
        return `${baseClasses} border-warning-500 focus:border-warning-500 focus:ring-warning-500/20 text-warning-900`;
      }

      if (variant === 'filled') {
        return `${baseClasses} border-transparent bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-primary-500/20 text-gray-900`;
      }

      if (variant === 'ghost') {
        return `${baseClasses} border-transparent bg-transparent hover:bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-primary-500/20 text-gray-900`;
      }

      return `${baseClasses} bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 text-gray-900`;
    };

    const getSizeClasses = () => {
      const sizes = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base',
      };
      return sizes[size];
    };

    const getIconPadding = () => {
      if (leftIcon) return 'pl-10';
      return '';
    };

    const handleSelect = (value: string) => {
      if (multiple) {
        const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
        const newValue = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        
        setSelectedValue(newValue);
        if (onChange) {
          const event = {
            target: { ...props.target, value: newValue, name: props.name }
          } as any;
          onChange(event);
        }
      } else {
        setSelectedValue(value);
        setIsOpen(false);
        if (onChange) {
          const event = {
            target: { ...props.target, value, name: props.name }
          } as any;
          onChange(event);
        }
      }
    };

    const getSelectedLabel = () => {
      if (multiple && Array.isArray(selectedValue)) {
        if (selectedValue.length === 0) return placeholder;
        if (selectedValue.length === 1) {
          const option = options.find(opt => opt.value === selectedValue[0]);
          return option?.label || placeholder;
        }
        return `${selectedValue.length} items selected`;
      }
      
      const selectedOption = options.find(opt => opt.value === selectedValue);
      return selectedOption?.label || placeholder;
    };

    const clearSelection = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedValue(multiple ? [] : '');
      if (onChange) {
        const event = {
          target: { ...props.target, value: multiple ? [] : '', name: props.name }
        } as any;
        onChange(event);
      }
    };

    return (
      <div className="w-full relative">
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
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}

          <div
            className={clsx(
              getVariantClasses(),
              getSizeClasses(),
              getIconPadding(),
              'font-medium',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'flex items-center justify-between',
              'relative'
            )}
            onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={inputId}
            tabIndex={disabled ? -1 : 0}
          >
            <span className={clsx(
              selectedValue || (multiple && Array.isArray(selectedValue) && selectedValue.length > 0) 
                ? 'text-gray-900' 
                : 'text-gray-500'
            )}>
              {getSelectedLabel()}
            </span>
            
            <div className="flex items-center gap-2">
              {clearable && (selectedValue || (multiple && Array.isArray(selectedValue) && selectedValue.length > 0)) && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:bg-gray-100"
                  tabIndex={-1}
                >
                  <span className="sr-only">Clear selection</span>
                  <div className="w-3 h-3 text-gray-400 hover:text-gray-600">×</div>
                </button>
              )}
              
              <ChevronDown 
                size={16} 
                className={clsx(
                  'text-gray-400 transition-transform duration-200',
                  isOpen && 'transform rotate-180'
                )}
              />
            </div>
          </div>

          {isOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {searchable && (
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
              )}
              
              <div role="listbox">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = multiple 
                      ? Array.isArray(selectedValue) && selectedValue.includes(option.value)
                      : selectedValue === option.value;
                    
                    return (
                      <div
                        key={option.value}
                        className={clsx(
                          'px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50',
                          option.disabled && 'cursor-not-allowed opacity-50',
                          isSelected && 'bg-primary-50 text-primary-700'
                        )}
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center gap-2">
                          {option.icon && (
                            <div className="text-gray-400">
                              {option.icon}
                            </div>
                          )}
                          <span>{option.label}</span>
                        </div>
                        
                        {isSelected && (
                          <Check size={16} className="text-primary-600" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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

        {/* Backdrop to close dropdown */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;