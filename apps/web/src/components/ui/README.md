# UI Components

A comprehensive set of accessible, customizable UI components built with React, TypeScript, and TailwindCSS.

## Components

- [Modal](#modal) - Fully-featured modal dialogs with accessibility
- [Input](#input) - Text input fields with various styles
- [TextArea](#textarea) - Multi-line text input
- [Select](#select) - Dropdown selection with search and multiple options
- [Checkbox](#checkbox) - Single or indeterminate checkbox states
- [RadioGroup](#radiogroup) - Group of radio buttons with selection

## Modal Component

A fully-featured, accessible Modal component with comprehensive focus management, keyboard navigation, and accessibility features.

### Features

- ✅ **Accessibility First**: WCAG compliant with ARIA attributes
- ✅ **Focus Management**: Automatic focus trapping and restoration
- ✅ **Keyboard Navigation**: ESC to close, Tab cycling
- ✅ **Backdrop Click**: Configurable backdrop click handling
- ✅ **Scroll Lock**: Prevents body scroll when modal is open
- ✅ **Multiple Sizes**: sm, md, lg, xl, full
- ✅ **Visual Variants**: default, danger, warning, success, info
- ✅ **Custom Hooks**: Easy state management with useModal
- ✅ **Portal Rendering**: Renders to document body for proper layering

### Basic Usage

```tsx
import { Modal, useModal } from '@/components/ui';

function MyComponent() {
  const { isOpen, open, close } = useModal();

  return (
    <>
      <button onClick={open}>Open Modal</button>
      
      <Modal isOpen={isOpen} onClose={close} title="My Modal">
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

### Modal with Sizes and Variants

```tsx
<Modal size="lg" variant="success" title="Success!">
  <p>Your action was completed successfully!</p>
</Modal>
```

### Structured Modal

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';

<Modal isOpen={isOpen} onClose={close}>
  <ModalHeader>User Settings</ModalHeader>
  <ModalBody>
    <p>Configure your settings here</p>
  </ModalBody>
  <ModalFooter>
    <button onClick={close}>Cancel</button>
    <button onClick={handleSave}>Save</button>
  </ModalFooter>
</Modal>
```

### useModal Hook

```tsx
const { isOpen, open, close, toggle } = useModal({
  initialOpen: false,
  onOpen: () => console.log('Opened'),
  onClose: () => console.log('Closed'),
});
```

### useConfirmModal Hook

```tsx
const { state, confirm, cancel } = useConfirmModal();

const handleDelete = () => {
  confirm({
    title: 'Delete Item',
    message: 'Are you sure?',
    variant: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: () => console.log('Deleted!'),
  });
};
```

### Modal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | **required** | Controls modal visibility |
| `onClose` | `() => void` | **required** | Called when modal closes |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `variant` | `'default' \| 'danger' \| 'warning' \| 'success' \| 'info'` | `'default'` | Visual variant |
| `preventClose` | `boolean` | `false` | Prevent closing via ESC/backdrop |
| `initialFocusRef` | `RefObject<HTMLElement>` | - | Element to focus on open |

### Accessibility Features

- **ARIA Attributes**: Automatically sets `role="dialog"`, `aria-modal="true"`
- **Focus Trapping**: Tab navigation cycles within modal
- **Focus Restoration**: Returns focus to previous element on close
- **Keyboard Support**: ESC to close, Tab to cycle through elements
- **Screen Reader Support**: Proper ARIA labels and descriptions

## Features

### 🎨 Design Features
- **Variants**: `default`, `filled`, `ghost`
- **Sizes**: `sm`, `md`, `lg`
- **Validation States**: `error`, `success`, `warning`
- **Loading States**: Built-in loading spinners
- **Icons**: Left/right icon support

### ♿ Accessibility
- ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- Proper labeling and descriptions
- Error announcements for screen readers

### 🔧 Developer Experience
- Full TypeScript support
- React Hook Form integration
- Zod validation compatible
- Forward refs support
- Comprehensive prop types

### 📱 Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interactions

## Installation

These components are part of the `src/components/ui/` directory and depend on:
- React 18+
- TypeScript 5+
- TailwindCSS 3+
- React Hook Form 7+
- Zod 3+ (for validation)

## Usage

### Input Component

```tsx
import { Input } from '@/components/ui';

function MyForm() {
  return (
    <div className="space-y-4">
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        error="Please enter a valid email"
        leftIcon={<Mail size={18} />}
        required
      />
      
      <Input
        label="Password"
        type="password"
        placeholder="Enter password"
        showPasswordToggle
        leftIcon={<Lock size={18} />}
      />
    </div>
  );
}
```

### TextArea Component

```tsx
import { TextArea } from '@/components/ui';

function MyForm() {
  return (
    <TextArea
      label="Biography"
      placeholder="Tell us about yourself..."
      rows={4}
      resize="vertical"
      error="Bio cannot exceed 500 characters"
      helperText="500 characters max"
      required
    />
  );
}
```

### Select Component

```tsx
import { Select } from '@/components/ui';

function MyForm() {
  const options = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
  ];

  return (
    <Select
      label="Department"
      options={options}
      placeholder="Choose department..."
      searchable
      clearable
      required
    />
  );
}
```

### Checkbox Component

```tsx
import { Checkbox } from '@/components/ui';

function MyForm() {
  return (
    <Checkbox
      label="Accept Terms"
      description="I agree to the terms and conditions"
      error="You must accept the terms to continue"
      required
      leftIcon={<CheckCircle size={16} />}
    />
  );
}
```

### RadioGroup Component

```tsx
import { RadioGroup } from '@/components/ui';

function MyForm() {
  const options = [
    { 
      value: 'intern', 
      label: 'Intern', 
      description: 'Student or recent graduate' 
    },
    { 
      value: 'senior', 
      label: 'Senior', 
      description: '3+ years experience' 
    },
  ];

  return (
    <RadioGroup
      name="role"
      label="Select Your Role"
      options={options}
      direction="vertical"
      required
    />
  );
}
```

## Form Integration

### React Hook Form Integration

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Checkbox } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Invalid email'),
  department: z.string().min(1, 'Select department'),
  terms: z.boolean().refine(val => val === true, 'Accept terms'),
});

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('email')}
        label="Email"
        error={errors.email?.message}
        required
      />
      
      <Checkbox
        {...register('terms')}
        label="Accept terms"
        error={errors.terms?.message}
        required
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Props Reference

### InputProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Field label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |
| `variant` | `'default' \| 'filled' \| 'ghost'` | `'default'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of input |
| `leftIcon` | `ReactNode` | - | Icon on the left |
| `rightIcon` | `ReactNode` | - | Icon on the right |
| `showPasswordToggle` | `boolean` | `false` | Show password visibility toggle |
| `isLoading` | `boolean` | `false` | Show loading spinner |
| `required` | `boolean` | `false` | Mark as required |
| `success` | `boolean` | `false` | Success state |
| `warning` | `boolean` | `false` | Warning state |

### TextAreaProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Resize behavior |
| `rows` | `number` | `4` | Number of rows |
| `minHeight` | `string` | `'80px'` | Minimum height |

### SelectProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | - | Array of options |
| `placeholder` | `string` | `'Select an option...'` | Placeholder text |
| `searchable` | `boolean` | `false` | Enable search |
| `clearable` | `boolean` | `false` | Show clear button |
| `multiple` | `boolean` | `false` | Allow multiple selection |

### CheckboxProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `description` | `string` | - | Additional description |
| `indeterminate` | `boolean` | `false` | Show indeterminate state |

### RadioGroupProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `RadioOption[]` | - | Array of radio options |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction |
| `name` | `string` | - | Group name for form |

## Customization

### TailwindCSS Classes

Components use TailwindCSS classes and can be customized through:
1. **Theme customization** in `tailwind.config.js`
2. **Component-specific classes** via the `className` prop
3. **CSS overrides** using Tailwind's `@apply` directive

### Custom Color Schemes

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // Your custom primary colors
        },
      },
    },
  },
};
```

### Custom Component Styles

```tsx
<Input
  className="border-2 border-dashed rounded-xl"
  label="Custom Input"
/>
```

## Accessibility Guidelines

1. **Always include labels** for form inputs
2. **Provide descriptive error messages** that help users understand what went wrong
3. **Use helper text** for additional context
4. **Ensure keyboard navigation** works properly
5. **Test with screen readers** for complete accessibility

## Best Practices

1. **Use validation schemas** with Zod for type-safe validation
2. **Provide loading states** for async operations
3. **Use appropriate input types** (email, tel, password, etc.)
4. **Group related inputs** using fieldset/legend
5. **Clear form data** after successful submission

## Contributing

When adding new input components or modifying existing ones:

1. Follow the established TypeScript interfaces
2. Include comprehensive accessibility features
3. Add proper validation state handling
4. Update this documentation
5. Add examples to the demo component

## License

These components are part of the ISSB Web application and follow the same licensing terms.