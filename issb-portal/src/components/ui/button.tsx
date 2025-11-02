import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow-sm hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-error text-white shadow-sm hover:bg-error-dark hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-2 border-primary-500 bg-white text-primary-700 hover:bg-primary-50 hover:shadow-sm",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-sm",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        link: "text-primary-600 underline-offset-4 hover:text-primary-700 hover:underline",
        success: "bg-success text-white shadow-sm hover:bg-success-dark hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        warning: "bg-warning text-white shadow-sm hover:bg-warning-dark hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
