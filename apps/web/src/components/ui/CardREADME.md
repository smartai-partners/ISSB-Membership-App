# Card Components

A comprehensive set of Card components built with React, TypeScript, and TailwindCSS. These components provide a flexible and consistent way to display content in card-based layouts throughout your application.

## Components Overview

### Core Components

- **Card** - The main container component with various styling variants
- **CardHeader** - Header section with optional border and custom content
- **CardContent** - Main content area with configurable padding
- **CardFooter** - Footer section with alignment options
- **CardGrid** - Responsive grid layout for multiple cards
- **CardLoading** - Loading state variants (skeleton, spinner, dots)

### Predefined Grid Layouts

- **DefaultCardGrid** - Responsive grid (1→2→3→4 columns)
- **CompactCardGrid** - Dense grid (1→2→4→5→6 columns)
- **FeatureCardGrid** - Feature showcase grid (1→2→3 columns)

## Installation & Setup

```typescript
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardGrid,
  CardLoading,
  CardSpinner,
  CardSkeleton,
  InlineLoading,
  DefaultCardGrid,
  CompactCardGrid,
  FeatureCardGrid
} from '@/components/ui';
```

## Component Usage

### Basic Card

```tsx
<Card>
  <CardHeader title="Card Title" subtitle="Optional subtitle" />
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <button className="btn-primary">Action</button>
  </CardFooter>
</Card>
```

### Card Variants

```tsx
// Default card
<Card variant="default">
  <CardContent>Default styling</CardContent>
</Card>

// Elevated card with more shadow
<Card variant="elevated">
  <CardContent>Elevated styling</CardContent>
</Card>

// Outlined card with thicker border
<Card variant="outlined">
  <CardContent>Outlined styling</CardContent>
</Card>

// Minimal ghost card
<Card variant="ghost">
  <CardContent>Minimal styling</CardContent>
</Card>
```

### Interactive Cards

```tsx
// Card with hover effects
<Card hover>
  <CardContent>Hover to see shadow effect</CardContent>
</Card>

// Fully interactive card (clickable)
<Card interactive onClick={() => handleClick()}>
  <CardContent>Click anywhere on this card</CardContent>
</Card>
```

### Padding Options

```tsx
<Card padding="none">  // No padding
<Card padding="sm">    // Small padding
<Card padding="md">    // Medium padding (default)
<Card padding="lg">    // Large padding
<Card padding="xl">    // Extra large padding
```

### Custom Header Content

```tsx
<Card>
  <CardHeader title="Title" subtitle="Subtitle">
    <div className="flex space-x-2">
      <button>Action 1</button>
      <button>Action 2</button>
    </div>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Footer Alignment

```tsx
<CardFooter align="left">      // Left aligned
<CardFooter align="center">    // Center aligned
<CardFooter align="right">     // Right aligned
<CardFooter align="between">   // Space between (justify-between)
```

## Grid Layouts

### Default Responsive Grid

```tsx
<DefaultCardGrid>
  {[1, 2, 3, 4, 5, 6].map((i) => (
    <Card key={i}>
      <CardContent>Card {i}</CardContent>
    </Card>
  ))}
</DefaultCardGrid>
```

### Custom Grid Configuration

```tsx
<CardGrid
  cols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
  gap="md"
  responsive={true}
>
  {/* Cards */}
</CardGrid>
```

### Compact Grid (Many Cards)

```tsx
<CompactCardGrid gap="sm">
  {/* Cards for dense layouts */}
</CompactCardGrid>
```

### Feature Grid (Fewer, Larger Cards)

```tsx
<FeatureCardGrid gap="lg">
  {/* Cards for feature showcases */}
</FeatureCardGrid>
```

## Loading States

### Skeleton Loading

```tsx
<CardLoading variant="skeleton">
  <p className="sr-only">Loading content...</p>
</CardLoading>
```

### Spinner Loading

```tsx
<CardLoading 
  variant="spinner" 
  size="md" 
  text="Loading..." 
/>
```

### Dots Loading

```tsx
<CardLoading 
  variant="dots" 
  size="lg" 
  text="Please wait..." 
/>
```

### Inline Loading (Within Existing Cards)

```tsx
<Card>
  <CardContent>
    <p>Content with inline loading:</p>
    <InlineLoading size="sm" />
  </CardContent>
</Card>
```

### Overlay Loading (Covers Card Content)

```tsx
<div className="relative">
  <Card>
    <CardContent>Content will be covered by loading overlay</CardContent>
  </Card>
  <CardLoading 
    variant="spinner" 
    overlay 
    text="Processing..." 
  />
</div>
```

## Customization

### Custom Styling

All components accept standard React props and TailwindCSS classes:

```tsx
<Card className="custom-card-styles" style={{ backgroundColor: 'lightblue' }}>
  <CardContent className="custom-content-styles">
    Custom styled content
  </CardContent>
</Card>
```

### Color Scheme Customization

The components use CSS custom properties defined in `globals.css`:

```css
:root {
  --color-primary: 14 165 233;     /* Primary blue */
  --color-primary-dark: 2 132 199; /* Darker blue */
  --color-secondary: 100 116 139;  /* Gray */
  --shadow-primary: 0 4px 14px 0 rgba(14, 165, 233, 0.2);
}
```

## Accessibility Features

- **Focus Management**: Interactive cards include proper focus indicators
- **Screen Reader Support**: Loading states include hidden text for screen readers
- **Keyboard Navigation**: Cards with `interactive` prop are keyboard accessible
- **High Contrast Mode**: CSS includes high contrast media queries
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

## Performance Considerations

- **Forwarded refs**: All components use `React.forwardRef` for better performance
- **Class name merging**: Efficient class name merging with `cn()` utility
- **Conditional rendering**: Minimal re-renders through proper component structure
- **CSS-in-JS**: TailwindCSS ensures optimal CSS delivery

## Examples

See `CardExamples.tsx` for comprehensive usage examples including:

- All card variants
- Interactive cards with hover effects
- Different padding options
- Header and footer variations
- Grid layout examples
- Loading state demonstrations
- Complex card layouts

## Dependencies

- `react` >= 18.2.0
- `@types/react` >= 18.2.15
- `tailwindcss` >= 3.3.3
- `clsx` >= 2.0.0

## Browser Support

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## Contributing

When adding new card components or modifying existing ones:

1. Follow the established naming conventions
2. Include TypeScript types
3. Add examples to `CardExamples.tsx`
4. Update this documentation
5. Ensure accessibility compliance
6. Test responsive behavior