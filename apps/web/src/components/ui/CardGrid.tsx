import React from 'react';
import { cn } from '../../utils/cn';

export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  responsive?: boolean;
}

const CardGrid = React.forwardRef<HTMLDivElement, CardGridProps>(
  ({ 
    className, 
    children, 
    cols = { sm: 1, md: 2, lg: 3, xl: 4 },
    gap = 'md',
    responsive = true,
    ...props 
  }, ref) => {
    // Build responsive grid classes
    const buildGridClasses = () => {
      const gridClasses = ['grid'];
      
      if (responsive) {
        // Add responsive column classes
        if (cols.sm) gridClasses.push(`grid-cols-${cols.sm}`);
        if (cols.md) gridClasses.push(`md:grid-cols-${cols.md}`);
        if (cols.lg) gridClasses.push(`lg:grid-cols-${cols.lg}`);
        if (cols.xl) gridClasses.push(`xl:grid-cols-${cols.xl}`);
        if (cols['2xl']) gridClasses.push(`2xl:grid-cols-${cols['2xl']}`);
      } else {
        // Use sm breakpoint for all
        gridClasses.push(`grid-cols-${cols.sm || 1}`);
      }
      
      // Add gap classes
      const gapClasses = {
        none: 'gap-0',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
        '2xl': 'gap-10'
      };
      
      gridClasses.push(gapClasses[gap]);
      
      return gridClasses.join(' ');
    };

    return (
      <div
        ref={ref}
        className={cn(
          buildGridClasses(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardGrid.displayName = 'CardGrid';

// Predefined responsive layouts
export const DefaultCardGrid = React.forwardRef<HTMLDivElement, Omit<CardGridProps, 'cols'>>(
  ({ children, gap = 'md', ...props }, ref) => (
    <CardGrid
      ref={ref}
      cols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
      gap={gap}
      {...props}
    >
      {children}
    </CardGrid>
  )
);

DefaultCardGrid.displayName = 'DefaultCardGrid';

export const CompactCardGrid = React.forwardRef<HTMLDivElement, Omit<CardGridProps, 'cols'>>(
  ({ children, gap = 'sm', ...props }, ref) => (
    <CardGrid
      ref={ref}
      cols={{ sm: 1, md: 2, lg: 4, xl: 5, '2xl': 6 }}
      gap={gap}
      {...props}
    >
      {children}
    </CardGrid>
  )
);

CompactCardGrid.displayName = 'CompactCardGrid';

export const FeatureCardGrid = React.forwardRef<HTMLDivElement, Omit<CardGridProps, 'cols'>>(
  ({ children, gap = 'lg', ...props }, ref) => (
    <CardGrid
      ref={ref}
      cols={{ sm: 1, md: 2, lg: 3 }}
      gap={gap}
      {...props}
    >
      {children}
    </CardGrid>
  )
);

FeatureCardGrid.displayName = 'FeatureCardGrid';

export default CardGrid;