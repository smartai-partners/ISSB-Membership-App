# Navigation Components

A comprehensive, accessible, and responsive navigation system for the ISSB Membership Application. This module provides a complete set of navigation components with role-based access control, mobile support, and accessibility features.

## Features

- **Role-based Access Control**: Automatically filters navigation based on user roles and permissions
- **Responsive Design**: Mobile-first approach with collapsible menus
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Breadcrumb Navigation**: Dynamic breadcrumb generation with hierarchical navigation
- **Mobile Support**: Dedicated mobile menu with drawer behavior
- **Theme Support**: Dark/light mode compatibility
- **Extensible**: Easy to customize and extend

## Components

### Navigation
The main navigation component that provides the primary navigation bar for the application.

```tsx
import { Navigation } from '@/components/navigation';

<Navigation
  items={navigationItems}
  orientation="horizontal"
  variant="default"
  showBreadcrumbs={true}
  showSearch={true}
  showNotifications={true}
  showUserMenu={true}
  collapsed={false}
  onItemClick={(item) => console.log('Item clicked:', item)}
  onSearch={(query) => console.log('Search:', query)}
/>
```

**Props:**
- `items`: Array of navigation items to display
- `orientation`: 'horizontal' | 'vertical' (default: 'horizontal')
- `variant`: 'default' | 'minimal' | 'admin' (default: 'default')
- `showBreadcrumbs`: Show breadcrumb navigation (default: true)
- `showSearch`: Show search functionality (default: false)
- `showNotifications`: Show notifications menu (default: true)
- `showUserMenu`: Show user dropdown menu (default: true)
- `collapsed`: Start in collapsed state (default: false)

### ProtectedNavigation
Wraps navigation with authentication and permission checks.

```tsx
import { ProtectedNavigation } from '@/components/navigation';

<ProtectedNavigation
  config={{
    items: adminItems,
    requiredRole: 'admin',
    fallbackRedirect: '/dashboard'
  }}
  showLoginPrompt={true}
  showAccessDenied={true}
  customErrorMessage="You don't have access to this area."
>
  <AdminDashboard />
</ProtectedNavigation>
```

**Config Options:**
- `items`: Navigation items to protect
- `requiredRole`: Minimum role required (optional)
- `requiredTier`: Minimum membership tier required (optional)
- `requiredPermissions`: Array of required permissions (optional)
- `fallbackRedirect`: Where to redirect if access denied (default: '/dashboard')
- `showError`: Show access denied message (default: true)

### RoleBasedMenu
A menu component with role-based filtering and accessible dropdown behavior.

```tsx
import { RoleBasedMenu } from '@/components/navigation';

<RoleBasedMenu
  items={navigationItems}
  orientation="horizontal"
  collapsed={false}
  showBadges={true}
  showTooltips={true}
  onItemClick={(item) => console.log('Menu item clicked:', item)}
/>
```

### Breadcrumbs
Hierarchical navigation breadcrumbs with automatic generation.

```tsx
import { Breadcrumbs } from '@/components/navigation';

<Breadcrumbs
  items={breadcrumbItems}
  navigationItems={navigationItems}
  homeLabel="Home"
  showHome={true}
  maxItems={5}
  separator={<ChevronRight />}
/>
```

**Features:**
- Automatic breadcrumb generation from current path
- Support for custom breadcrumb items
- Maximum item limits with ellipsis
- Clickable breadcrumbs (except current page)
- Screen reader compatible

### MobileMenu
Dedicated mobile navigation with drawer behavior.

```tsx
import { MobileMenu } from '@/components/navigation';

<MobileMenu
  items={navigationItems}
  isOpen={mobileMenuOpen}
  onClose={() => setMobileMenuOpen(false)}
  orientation="vertical"
  onItemClick={(item) => setMobileMenuOpen(false)}
/>
```

## Navigation Helpers

### NavigationHelpers Class

Utility functions for navigation management:

```tsx
import { NavigationHelpers } from '@/components/navigation';

// Filter navigation items by permissions
const filteredItems = NavigationHelpers.filterByPermissions(
  items,
  user.role,
  user.tier,
  hasPermission
);

// Generate breadcrumbs from path
const breadcrumbs = NavigationHelpers.generateBreadcrumbs(
  currentPath,
  navigationItems,
  'Home'
);

// Check if item is active
const isActive = NavigationHelpers.isItemActive(item, currentPath);

// Sort navigation items
const sortedItems = NavigationHelpers.sortItems(items);
```

### NavigationItem Interface

```tsx
interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  children?: NavigationItem[];
  roles?: UserRole[];
  tiers?: MembershipTier[];
  permissions?: string[];
  description?: string;
  isExternal?: boolean;
  isNew?: boolean;
  order?: number;
}
```

## Hooks

### useNavigationState

Manage navigation state in your components:

```tsx
import { useNavigationState } from '@/components/navigation';

const {
  activePath,
  expandedItems,
  collapsed,
  mobileMenuOpen,
  toggleExpanded,
  setActivePath,
  toggleCollapsed,
  toggleMobileMenu
} = useNavigationState({
  activePath: '/dashboard',
  collapsed: false
});
```

### useResponsiveNavigation

Detect screen size for responsive behavior:

```tsx
import { useResponsiveNavigation } from '@/components/navigation';

const { isMobile, isTablet, isDesktop } = useResponsiveNavigation();

return (
  <div>
    {isMobile ? <MobileMenu /> : <DesktopMenu />}
  </div>
);
```

## Usage Examples

### Basic Implementation

```tsx
import React from 'react';
import { Navigation } from '@/components/navigation';

const App: React.FC = () => {
  return (
    <div>
      <Navigation />
      <main>
        {/* Your content */}
      </main>
    </div>
  );
};
```

### Protected Admin Section

```tsx
import React from 'react';
import { ProtectedNavigation } from '@/components/navigation';

const AdminSection: React.FC = () => {
  const adminItems = [
    {
      id: 'users',
      label: 'User Management',
      path: '/admin/users',
      roles: ['admin']
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/admin/settings',
      roles: ['admin']
    }
  ];

  return (
    <ProtectedNavigation
      config={{
        items: adminItems,
        requiredRole: 'admin',
        showError: true
      }}
    >
      <AdminDashboard />
    </ProtectedNavigation>
  );
};
```

### Custom Navigation with Breadcrumbs

```tsx
import React from 'react';
import { Navigation, Breadcrumbs } from '@/components/navigation';

const CustomLayout: React.FC = () => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: Home
    },
    {
      id: 'events',
      label: 'Events',
      path: '/events',
      icon: Calendar,
      children: [
        {
          id: 'events-list',
          label: 'All Events',
          path: '/events'
        },
        {
          id: 'events-register',
          label: 'My Events',
          path: '/events/my'
        }
      ]
    }
  ];

  return (
    <div>
      <Navigation 
        items={navigationItems}
        showBreadcrumbs={false}
      />
      
      <div className="container mx-auto">
        <Breadcrumbs
          navigationItems={navigationItems}
          maxItems={4}
        />
        
        {/* Page content */}
      </div>
    </div>
  );
};
```

## Accessibility

All navigation components are built with accessibility in mind:

- **Keyboard Navigation**: Full keyboard support with Tab, Enter, Space, and arrow keys
- **Screen Readers**: Proper ARIA labels, roles, and descriptions
- **Focus Management**: Clear focus indicators and logical tab order
- **High Contrast**: Compatible with high contrast themes
- **Color Blind**: Icons and text provide redundant information

## Customization

### Styling

Navigation components use Tailwind CSS classes. You can customize by:

1. **Override classes** in component props:
```tsx
<Navigation className="custom-navigation" />
```

2. **Extend theme** in your Tailwind config:
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'nav-primary': '#your-color',
      }
    }
  }
}
```

3. **Custom CSS** for complex styling:
```css
.navigation {
  @apply shadow-lg;
}

.menu-item:hover {
  @apply scale-105;
}
```

### Custom Icons

```tsx
import { YourIcon } from 'your-icon-library';

const navigationItems = [
  {
    id: 'custom',
    label: 'Custom Page',
    path: '/custom',
    icon: YourIcon
  }
];
```

## Best Practices

1. **Keep navigation items concise** - use short, clear labels
2. **Use meaningful IDs** - make them descriptive and unique
3. **Implement proper permissions** - check user access at multiple levels
4. **Test keyboard navigation** - ensure all features work without a mouse
5. **Validate accessibility** - use tools like axe-core to test WCAG compliance

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Components use React.memo for optimization
- Navigation items are memoized based on user permissions
- Lazy loading for complex navigation trees
- Minimal re-renders with proper dependency arrays

## Testing

Test navigation components with:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '@/components/navigation';

test('navigation renders correctly', () => {
  render(<Navigation />);
  expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
});

test('menu expands on click', () => {
  render(<Navigation />);
  const menuButton = screen.getByRole('button', { name: /menu/i });
  fireEvent.click(menuButton);
  // Test mobile menu opens
});
```

## Contributing

When adding new navigation features:

1. Maintain accessibility standards (WCAG AA)
2. Include keyboard navigation support
3. Add proper TypeScript types
4. Write comprehensive tests
5. Document new props and features
6. Follow existing code patterns

## Related Files

- `@/store/authStore.ts` - Authentication state management
- `@/store/permissionStore.ts` - Permission checking utilities
- `@/layouts/` - Layout components that use navigation
- `@/components/ui/Button.tsx` - Button component for actions
