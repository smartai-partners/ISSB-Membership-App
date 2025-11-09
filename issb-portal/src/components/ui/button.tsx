import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useHighContrast, useReducedMotion } from "./accessibility"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow-sm hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 btn-enhanced",
        destructive:
          "bg-error text-white shadow-sm hover:bg-error-dark hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 btn-enhanced",
        outline:
          "border-2 border-primary-500 bg-white text-primary-700 hover:bg-primary-50 hover:shadow-sm hover:border-primary-600",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-sm",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover-lift",
        link: "text-primary-600 underline-offset-4 hover:text-primary-700 hover:underline p-0 h-auto",
        success: "bg-success text-white shadow-sm hover:bg-success-dark hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 btn-enhanced",
        warning: "bg-warning text-white shadow-sm hover:bg-warning-dark hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 btn-enhanced",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-12 w-12",
      },
      loading: {
        true: "cursor-not-allowed opacity-75",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading, 
    loadingText, 
    leftIcon, 
    rightIcon, 
    asChild = false, 
    children, 
    disabled,
    onClick,
    onKeyDown,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isHighContrast = useHighContrast();
    const prefersReducedMotion = useReducedMotion();
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }
      
      // Support Enter and Space keys
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Trigger the native click event to maintain proper event types
        e.currentTarget.click();
      }
      
      onKeyDown?.(e);
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, loading, className }),
          {
            'focus-visible:ring-4 focus-visible:ring-primary-300': isHighContrast,
            'transition-none': prefersReducedMotion,
          }
        )}
        ref={ref}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        aria-label={loading ? (loadingText || 'Loading') : ariaLabel}
        aria-describedby={loading ? 'loading-status' : ariaDescribedby}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2" aria-hidden="true">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2" aria-hidden="true">{rightIcon}</span>
        )}
        {loading && loadingText && (
          <span className="ml-2">{loadingText}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
