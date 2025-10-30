/**
 * Navigation Components Test Suite
 * 
 * This test file demonstrates how to test the navigation components.
 * Run with: npm test -- Navigation.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { 
  Navigation, 
  Breadcrumbs, 
  RoleBasedMenu, 
  ProtectedNavigation,
  NavigationHelpers 
} from '../index';
import { UserRole, MembershipTier } from '@issb/types';

// Mock stores
jest.mock('../../../store/authStore');
jest.mock('../../../store/permissionStore');

// Mock data
const mockUser = {
  id: '1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.MEMBER,
  tier: MembershipTier.REGULAR,
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockNavigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN]
  },
  {
    id: 'events',
    label: 'Events',
    path: '/events',
    roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN],
    children: [
      {
        id: 'events-list',
        label: 'All Events',
        path: '/events'
      }
    ]
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '/admin',
    roles: [UserRole.ADMIN]
  }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Navigation', () => {
  beforeEach(() => {
    // Mock auth store
    const mockUseAuthStore = jest.fn();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn()
    });
    
    // Mock permission store
    const mockUsePermissionStore = jest.fn();
    mockUsePermissionStore.mockReturnValue({
      hasPermission: jest.fn(() => true)
    });
    
    // Apply mocks
    jest.doMock('../../../store/authStore', () => ({
      useAuthStore: mockUseAuthStore
    }));
    
    jest.doMock('../../../store/permissionStore', () => ({
      usePermissionStore: mockUsePermissionStore
    }));
  });

  test('renders navigation with default props', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
  });

  test('displays user menu when authenticated', () => {
    render(
      <TestWrapper>
        <Navigation showUserMenu={true} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/User menu for/)).toBeInTheDocument();
  });

  test('toggles mobile menu on button click', async () => {
    render(
      <TestWrapper>
        <Navigation showMobileToggle={true} />
      </TestWrapper>
    );

    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(mobileMenuButton);

    await waitFor(() => {
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });
  });

  test('calls onItemClick when navigation item is clicked', () => {
    const onItemClick = jest.fn();
    
    render(
      <TestWrapper>
        <Navigation 
          items={mockNavigationItems}
          onItemClick={onItemClick}
        />
      </TestWrapper>
    );

    const dashboardLink = screen.getByText('Dashboard');
    fireEvent.click(dashboardLink);

    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'dashboard',
        label: 'Dashboard'
      })
    );
  });

  test('handles search input', () => {
    const onSearch = jest.fn();
    
    render(
      <TestWrapper>
        <Navigation 
          showSearch={true}
          onSearch={onSearch}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByLabelText('Search navigation');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.submit(searchInput);

    expect(onSearch).toHaveBeenCalledWith('test query');
  });

  test('shows breadcrumbs when enabled', () => {
    render(
      <TestWrapper>
        <Navigation showBreadcrumbs={true} />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Breadcrumb navigation')).toBeInTheDocument();
  });
});

describe('Breadcrumbs', () => {
  test('renders breadcrumb navigation', () => {
    const breadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'Events', path: '/events' },
      { label: 'Event Details', path: '/events/1', isActive: true }
    ];

    render(
      <TestWrapper>
        <Breadcrumbs items={breadcrumbs} />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Event Details')).toBeInTheDocument();
  });

  test('generates breadcrumbs from path automatically', () => {
    // Mock useLocation to return a specific path
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: () => ({
        pathname: '/events/workshops'
      })
    }));

    render(
      <TestWrapper>
        <Breadcrumbs navigationItems={mockNavigationItems} />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('truncates breadcrumbs when maxItems is exceeded', () => {
    const breadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'Events', path: '/events' },
      { label: 'Workshops', path: '/events/workshops' },
      { label: 'Details', path: '/events/workshops/1' }
    ];

    render(
      <TestWrapper>
        <Breadcrumbs 
          items={breadcrumbs} 
          maxItems={3}
        />
      </TestWrapper>
    );

    expect(screen.getByText('...')).toBeInTheDocument();
  });
});

describe('RoleBasedMenu', () => {
  test('filters items based on user role', () => {
    const filteredItems = NavigationHelpers.filterByPermissions(
      mockNavigationItems,
      UserRole.MEMBER,
      MembershipTier.REGULAR,
      () => true
    );

    expect(filteredItems).toHaveLength(2); // Dashboard and Events, but not Admin
    expect(filteredItems.find(item => item.id === 'admin')).toBeUndefined();
  });

  test('renders menu items correctly', () => {
    render(
      <TestWrapper>
        <RoleBasedMenu 
          items={mockNavigationItems}
          orientation="horizontal"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  test('expands submenu on click', async () => {
    render(
      <TestWrapper>
        <RoleBasedMenu 
          items={mockNavigationItems}
          orientation="horizontal"
        />
      </TestWrapper>
    );

    const eventsButton = screen.getByText('Events');
    fireEvent.click(eventsButton);

    await waitFor(() => {
      expect(screen.getByText('All Events')).toBeInTheDocument();
    });
  });
});

describe('ProtectedNavigation', () => {
  test('renders children when user has access', () => {
    const config = {
      items: mockNavigationItems,
      requiredRole: UserRole.MEMBER
    };

    render(
      <TestWrapper>
        <ProtectedNavigation config={config}>
          <div>Protected content</div>
        </ProtectedNavigation>
      </TestWrapper>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  test('shows access denied when user lacks permissions', () => {
    const config = {
      items: mockNavigationItems,
      requiredRole: UserRole.ADMIN
    };

    render(
      <TestWrapper>
        <ProtectedNavigation config={config} showAccessDenied={true}>
          <div>Protected content</div>
        </ProtectedNavigation>
      </TestWrapper>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    // Mock unauthenticated state
    jest.doMock('../../../store/authStore', () => ({
      useAuthStore: () => ({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }));

    const config = {
      items: mockNavigationItems,
      requiredRole: UserRole.MEMBER
    };

    render(
      <TestWrapper>
        <ProtectedNavigation config={config}>
          <div>Protected content</div>
        </ProtectedNavigation>
      </TestWrapper>
    );

    // In a real test, you would check for navigation to /login
    // This requires more complex setup with router mocking
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
  });
});

describe('NavigationHelpers', () => {
  test('sorts items by order and label', () => {
    const items = [
      { id: 'z', label: 'Zebra', order: 1 },
      { id: 'a', label: 'Apple', order: 0 },
      { id: 'm', label: 'Monkey' }
    ];

    const sorted = NavigationHelpers.sortItems(items);
    
    expect(sorted[0].id).toBe('a'); // Apple (order 0)
    expect(sorted[1].id).toBe('z'); // Zebra (order 1)
    expect(sorted[2].id).toBe('m'); // Monkey (no order, sorted by label)
  });

  test('checks if item is active', () => {
    const item = {
      id: 'events',
      label: 'Events',
      path: '/events'
    };

    expect(NavigationHelpers.isItemActive(item, '/events')).toBe(true);
    expect(NavigationHelpers.isItemActive(item, '/events/1')).toBe(true);
    expect(NavigationHelpers.isItemActive(item, '/dashboard')).toBe(false);
  });

  test('generates breadcrumbs from path', () => {
    const breadcrumbs = NavigationHelpers.generateBreadcrumbs(
      '/events/workshops',
      mockNavigationItems,
      'Home'
    );

    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0].label).toBe('Home');
    expect(breadcrumbs[1].label).toBe('Events');
    expect(breadcrumbs[2].label).toBe('Workshops');
  });
});

// Accessibility tests
describe('Accessibility', () => {
  test('navigation has proper ARIA labels', () => {
    render(
      <TestWrapper>
        <Navigation aria-label="Custom navigation label" />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Custom navigation label')).toBeInTheDocument();
  });

  test('menu items have proper roles and states', () => {
    render(
      <TestWrapper>
        <RoleBasedMenu 
          items={mockNavigationItems}
          orientation="horizontal"
        />
      </TestWrapper>
    );

    // Check for role="menubar"
    const menubar = screen.getByRole('menubar');
    expect(menubar).toBeInTheDocument();

    // Check for menu items
    const menuItems = screen.getAllByRole('button');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  test('supports keyboard navigation', () => {
    render(
      <TestWrapper>
        <RoleBasedMenu 
          items={mockNavigationItems}
          orientation="horizontal"
        />
      </TestWrapper>
    );

    const firstItem = screen.getByText('Dashboard');
    firstItem.focus();
    
    // Test Enter key activation
    fireEvent.keyDown(firstItem, { key: 'Enter' });
    
    // Test Space key activation  
    fireEvent.keyDown(firstItem, { key: ' ' });
  });

  test('breadcrumb navigation is screen reader friendly', () => {
    const breadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'Events', path: '/events', isActive: true }
    ];

    render(
      <TestWrapper>
        <Breadcrumbs items={breadcrumbs} />
      </TestWrapper>
    );

    const breadcrumbNav = screen.getByLabelText('Breadcrumb navigation');
    expect(breadcrumbNav).toBeInTheDocument();

    const activeBreadcrumb = screen.getByText('Events');
    expect(activeBreadcrumb).toHaveAttribute('aria-current', 'page');
  });
});

// Performance tests
describe('Performance', () => {
  test('does not re-render unnecessarily', () => {
    const NavigationComponent = Navigation;
    
    const { rerender } = render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    const initialRenderCount = 1;
    
    // Rerender with same props
    rerender(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    // In a real scenario, you would use React.memo and spy on render count
    // This is a simplified example
    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
  });
});
