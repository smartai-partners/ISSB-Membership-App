# Button Component

A comprehensive, accessible, and customizable button component built with React, TypeScript, and TailwindCSS.

## Features

- **Multiple Variants**: Primary, Secondary, Outline, Ghost, and Danger styles
- **Flexible Sizes**: Small, Medium, and Large options
- **Loading States**: Built-in loading spinner with disabled state
- **Icon Support**: Left and right icon positioning
- **Full Accessibility**: ARIA attributes, keyboard navigation, and screen reader support
- **Responsive Design**: Full-width option available
- **Smooth Animations**: Hover effects and transitions
- **TypeScript Support**: Fully typed with comprehensive prop interfaces

## Installation

The Button component is part of the UI components library. Import it directly:

```tsx
import { Button } from '@/components/ui';
```

## Basic Usage

```tsx
import { Button } from '@/components/ui';
import { Search } from 'lucide-react';

function Example() {
  return (
    <div>
      <Button>Default Button</Button>
      
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Shows loading spinner and disables button |
| `icon` | `React.ReactNode` | - | Icon element to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Position of icon relative to text |
| `fullWidth` | `boolean` | `false` | Makes button take full container width |
| `children` | `React.ReactNode` | **required** | Button content |
| `disabled` | `boolean` | `false` | Disables button interactions |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `(event: React.MouseEvent<HTMLButtonElement>) => void` | - | Click handler |

## Variants

### Primary
```tsx
<Button variant="primary">Primary Action</Button>
```
Default blue button for main actions.

### Secondary
```tsx
<Button variant="secondary">Secondary Action</Button>
```
Gray button for secondary actions.

### Outline
```tsx
<Button variant="outline">Outline Action</Button>
```
Transparent button with colored border and text.

### Ghost
```tsx
<Button variant="ghost">Ghost Action</Button>
```
Transparent button that shows background on hover.

### Danger
```tsx
<Button variant="danger">Delete Item</Button>
```
Red button for destructive actions.

## Sizes

```tsx
<div>
  <Button size="sm">Small Button</Button>
  <Button size="md">Medium Button</Button>
  <Button size="lg">Large Button</Button>
</div>
```

| Size | Padding | Font Size |
|------|---------|-----------|
| `sm` | `px-3 py-1.5` | `text-sm` |
| `md` | `px-4 py-2` | `text-base` |
| `lg` | `px-6 py-3` | `text-lg` |

## Loading State

```tsx
<Button loading>Saving...</Button>
```

Shows a spinner and disables the button automatically. The spinner size matches the button size.

## Icons

### Left Icon
```tsx
<Button icon={<Search size={20} />}>Search</Button>
```

### Right Icon
```tsx
<Button icon={<Download size={20} />} iconPosition="right">
  Download
</Button>
```

### Icon Only
```tsx
<Button 
  icon={<Heart size={20} />} 
  aria-label="Add to favorites"
>
  <span className="sr-only">Add to favorites</span>
</Button>
```

## Full Width

```tsx
<Button fullWidth>Full Width Button</Button>
```

Makes the button span the entire width of its container.

## Examples

### Action Buttons
```tsx
<div className="flex gap-4">
  <Button variant="primary" icon={<Plus />}>
    Add Item
  </Button>
  <Button variant="secondary" icon={<Settings />}>
    Settings
  </Button>
  <Button variant="outline" icon={<User />}>
    Profile
  </Button>
</div>
```

### Form Actions
```tsx
<div className="flex gap-4 justify-end">
  <Button variant="ghost">Cancel</Button>
  <Button variant="primary" loading={saving}>
    {saving ? 'Saving...' : 'Save'}
  </Button>
</div>
```

### Status Actions
```tsx
<div className="flex gap-4">
  <Button variant="primary" icon={<CheckCircle />}>
    Approve
  </Button>
  <Button variant="danger" icon={<XCircle />}>
    Reject
  </Button>
  <Button variant="outline" icon={<AlertTriangle />}>
    Review
  </Button>
</div>
```

## Accessibility

The Button component includes several accessibility features:

- **Semantic HTML**: Renders as a native `<button>` element
- **ARIA Support**: Includes `aria-disabled` and `aria-label` attributes
- **Focus Management**: Clear focus indicators with ring styling
- **Keyboard Navigation**: Full keyboard support for button activation
- **Screen Readers**: Proper labeling and state announcements

### Accessibility Example
```tsx
<Button 
  variant="danger"
  onClick={handleDelete}
  aria-label="Delete user account"
>
  Delete Account
</Button>
```

## Styling

The component uses TailwindCSS classes with the following features:

- **Transition Effects**: Smooth transitions for all interactive states
- **Hover Effects**: Subtle scale animation and shadow changes
- **Focus States**: Clear focus indicators for keyboard navigation
- **Disabled States**: Reduced opacity and cursor changes
- **Responsive Design**: Works across all screen sizes

### Custom Styling

```tsx
<Button className="font-bold uppercase tracking-wider">
  Custom Styled Button
</Button>
```

Additional classes are merged with the base classes.

## Testing

The component includes comprehensive tests covering:

- Rendering with all variants and sizes
- Loading and disabled states
- Icon positioning
- Accessibility attributes
- Event handling
- CSS class application

Run tests:
```bash
npm test Button.test.tsx
```

## Dependencies

- React 18+
- TypeScript 4.5+
- TailwindCSS 3+
- Lucide React (for icons in examples)

## Stories

The component includes Storybook stories demonstrating:

- All variants and sizes
- Loading states
- Icon examples
- Accessibility patterns
- Real-world usage patterns

View stories:
```bash
npm run storybook
```

## Migration from HTML Buttons

Replace standard HTML buttons:

```tsx
// Before
<button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleClick}>
  Click me
</button>

// After
<Button onClick={handleClick}>Click me</Button>
```

## Performance

- Lightweight component with minimal re-renders
- Optimized className generation
- Efficient event handling
- No unnecessary DOM elements

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- All modern mobile browsers