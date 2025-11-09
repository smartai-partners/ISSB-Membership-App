import * as React from "react"
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from "@/lib/utils"

const cardVariants = cva(
  'bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-300 relative overflow-hidden group',
  {
    variants: {
      variant: {
        default: 'hover:shadow-lg hover:-translate-y-1',
        elevated: 'shadow-lg hover:shadow-xl hover:-translate-y-2',
        interactive: 'cursor-pointer hover:shadow-lg hover:-translate-y-1 interactive-card',
        featured: 'border-2 border-primary-200 hover:border-primary-400',
        subtle: 'shadow-sm hover:shadow-md',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  elevated?: boolean;
  interactive?: boolean;
  loading?: boolean;
  showHoverEffect?: boolean;
  glowOnHover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    elevated, 
    interactive, 
    loading, 
    showHoverEffect = true,
    glowOnHover = false,
    children, 
    ...props 
  }, ref) => {
    const cardVariant = elevated ? 'elevated' : interactive ? 'interactive' : variant;
    
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant: cardVariant, size }),
          {
            'hover:shadow-green-500/10 hover:shadow-lg': glowOnHover,
            'opacity-75 pointer-events-none': loading,
            'animate-pulse-soft': loading,
          },
          className
        )}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-primary-500" />
          </div>
        )}
        <div className={cn('relative z-0', loading && 'opacity-50')}>
          {children}
        </div>
        
        {/* Hover effect overlay */}
        {showHoverEffect && !loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight text-gray-900", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
}
