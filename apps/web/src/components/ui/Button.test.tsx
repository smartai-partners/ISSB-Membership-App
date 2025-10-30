import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './Button';
import { Search, Heart } from 'lucide-react';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-blue-600'); // primary variant default
    });

    it('renders with custom text', () => {
      render(<Button>Custom Text</Button>);
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });

    it('applies variant classes correctly', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');

      rerender(<Button variant="secondary">Secondary</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600');

      rerender(<Button variant="outline">Outline</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('border-2', 'border-blue-600');

      rerender(<Button variant="ghost">Ghost</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('text-blue-600');

      rerender(<Button variant="danger">Danger</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('applies size classes correctly', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');

      rerender(<Button size="md">Medium</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');

      rerender(<Button size="lg">Large</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });

    it('applies full width class when specified', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('does not apply full width by default', () => {
      render(<Button>Normal</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const icon = <Search data-testid="icon" />;
      render(<Button icon={icon} iconPosition="left">Search</Button>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      const icon = <Heart data-testid="icon" />;
      render(<Button icon={icon} iconPosition="right">Like</Button>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('hides icons when loading', () => {
      const icon = <Search data-testid="icon" />;
      render(<Button icon={icon} loading>Loading</Button>);
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toContainElement(
        screen.getByRole('img', { hidden: true })
      );
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toContainElement(
        screen.getByRole('img', { hidden: true })
      );
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled styling when loading', () => {
      render(<Button variant="primary" loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-blue-300');
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<Button variant="primary" disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-blue-300');
    });
  });

  describe('Accessibility', () => {
    it('renders as a button element', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
    });

    it('supports custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('passes through additional HTML attributes', () => {
      render(
        <Button 
          data-testid="custom-button"
          id="button-id"
          type="submit"
        >
          Button
        </Button>
      );
      
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('id', 'button-id');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Animation and Effects', () => {
    it('applies hover and focus classes', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      
      // Check base classes
      expect(button).toHaveClass('transition-all', 'duration-200');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
    });

    it('applies transform classes for hover effects', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      
      // Check hover animation classes
      expect(button).toHaveClass('transform', 'hover:scale-[1.02]', 'active:scale-[0.98]');
    });
  });

  describe('Icon-only buttons', () => {
    it('renders icon-only button correctly', () => {
      const icon = <Search data-testid="icon" />;
      render(
        <Button 
          icon={icon} 
          variant="outline"
          aria-label="Search"
        >
          <span className="sr-only">Search</span>
        </Button>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Search');
    });
  });
});