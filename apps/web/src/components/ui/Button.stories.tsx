import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Button, ButtonProps } from './Button';
import { 
  Search, 
  Download, 
  Heart, 
  Settings, 
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus
} from 'lucide-react';

const meta: Meta<ButtonProps> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Visual style variant of the button'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button'
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state with spinner'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button take full width of container'
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button'
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Position of icon relative to text'
    }
  },
};

export default meta;
type Story = StoryObj<ButtonProps>;

// Default story
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

// Variant stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

// Size stories
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

// State stories
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

// Icon stories
export const WithLeftIcon: Story = {
  args: {
    children: 'Search',
    icon: <Search className="w-5 h-5" />,
    iconPosition: 'left',
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Download',
    icon: <Download className="w-5 h-5" />,
    iconPosition: 'right',
  },
};

export const IconOnly: Story = {
  args: {
    variant: 'outline',
    icon: <Heart className="w-5 h-5" />,
    children: 'Like',
    'aria-label': 'Like this item',
  },
};

// Functional stories
export const ActionButtons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
        Add Item
      </Button>
      <Button variant="secondary" icon={<Settings className="w-4 h-4" />}>
        Settings
      </Button>
      <Button variant="outline" icon={<User className="w-4 h-4" />}>
        Profile
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A row of action buttons demonstrating different use cases'
      }
    }
  }
};

export const StatusButtons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary" icon={<CheckCircle className="w-4 h-4" />}>
        Success
      </Button>
      <Button variant="danger" icon={<XCircle className="w-4 h-4" />}>
        Error
      </Button>
      <Button variant="outline" icon={<AlertTriangle className="w-4 h-4" />}>
        Warning
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons used for different status actions'
      }
    }
  }
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div className="flex gap-4">
        <Button size="sm" variant="primary">Small Primary</Button>
        <Button size="md" variant="primary">Medium Primary</Button>
        <Button size="lg" variant="primary">Large Primary</Button>
      </div>
      <div className="flex gap-4">
        <Button loading variant="primary">Loading</Button>
        <Button disabled variant="primary">Disabled</Button>
        <Button fullWidth variant="primary">Full Width</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive showcase of all button variants, sizes, and states'
      }
    }
  }
};

// Accessibility showcase
export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Button 
          variant="primary" 
          icon={<Heart className="w-4 h-4" />}
          aria-label="Add to favorites"
        >
          <span className="sr-only">Add to favorites</span>
        </Button>
      </div>
      <div>
        <Button 
          variant="danger"
          onClick={() => alert('Delete clicked!')}
        >
          Delete Item
        </Button>
      </div>
      <div>
        <Button 
          loading 
          variant="primary"
          aria-label="Saving your data, please wait"
        >
          Saving...
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of accessible button usage with proper ARIA labels and semantic interactions'
      }
    }
  }
};