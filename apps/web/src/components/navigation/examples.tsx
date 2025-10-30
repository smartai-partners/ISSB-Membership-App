/**
 * Navigation Components Usage Examples
 * 
 * This file demonstrates various ways to use the navigation components
 * in different scenarios throughout the application.
 */

import React from 'react';
import { 
  Navigation, 
  RoleBasedMenu, 
  Breadcrumbs, 
  ProtectedNavigation,
  NavigationHelpers 
} from './index';
import { UserRole, MembershipTier } from '@issb/types';

// Example 1: Basic Navigation Implementation
export const BasicNavigationExample: React.FC = () => {
  return (
    <Navigation 
      showBreadcrumbs={true}
      showSearch={true}
      showNotifications={true}
      showUserMenu={true}
      showMobileToggle={true}
      onSearch={(query) => console.log('Searching for:', query)}
      onNotificationClick={() => console.log('Notifications clicked')}
      onUserMenuClick={(action) => console.log('User menu action:', action)}
    />
  );
};

// Example 2: Admin Navigation with Role Protection
export const AdminNavigationExample: React.FC = () => {
  const adminItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: () => <span>📊</span>,
      roles: [UserRole.ADMIN],
      order: 0
    },
    {
      id: 'users',
      label: 'User Management',
      path: '/admin/users',
      icon: () => <span>👥</span>,
      roles: [UserRole.ADMIN],
      order: 1,
      children: [
        {
          id: 'users-list',
          label: 'All Users',
          path: '/admin/users'
        },
        {
          id: 'users-create',
          label: 'Create User',
          path: '/admin/users/create'
        }
      ]
    },
    {
      id: 'settings',
      label: 'System Settings',
      path: '/admin/settings',
      icon: () => <span>⚙️</span>,
      roles: [UserRole.ADMIN],
      order: 2
    }
  ];

  return (
    <ProtectedNavigation
      config={{
        items: adminItems,
        requiredRole: UserRole.ADMIN,
        fallbackRedirect: '/dashboard'
      }}
      showError={true}
    >
      <Navigation 
        items={adminItems}
        variant="admin"
        showBreadcrumbs={true}
      />
      
      <div className="p-6">
        <h1>Admin Dashboard</h1>
        {/* Admin content */}
      </div>
    </ProtectedNavigation>
  );
};

// Example 3: Board Member Navigation
export const BoardNavigationExample: React.FC = () => {
  const boardItems = NavigationHelpers.getNavigationByRole(
    UserRole.BOARD, 
    MembershipTier.BOARD
  );

  return (
    <div className="board-layout">
      <Navigation 
        items={boardItems}
        variant="default"
        showBreadcrumbs={true}
        showNotifications={true}
        showUserMenu={true}
      />
      
      <main className="board-content">
        {/* Board-specific content */}
      </main>
    </div>
  );
};

// Example 4: Custom Navigation with Submenus
export const CustomNavigationExample: React.FC = () => {
  const customItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: () => <span>🏠</span>,
      order: 0
    },
    {
      id: 'events',
      label: 'Events',
      path: '/events',
      icon: () => <span>📅</span>,
      order: 1,
      children: [
        {
          id: 'events-upcoming',
          label: 'Upcoming Events',
          path: '/events/upcoming'
        },
        {
          id: 'events-past',
          label: 'Past Events',
          path: '/events/past'
        },
        {
          id: 'events-create',
          label: 'Create Event',
          path: '/events/create'
        }
      ]
    },
    {
      id: 'volunteer',
      label: 'Volunteer',
      path: '/volunteer',
      icon: () => <span>🤝</span>,
      order: 2,
      badge: '5',
      children: [
        {
          id: 'volunteer-opportunities',
          label: 'Opportunities',
          path: '/volunteer/opportunities'
        },
        {
          id: 'volunteer-applications',
          label: 'My Applications',
          path: '/volunteer/applications'
        }
      ]
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: () => <span>👤</span>,
      order: 3
    }
  ];

  const handleItemClick = (item: any) => {
    console.log('Navigation item clicked:', item);
    // You could use this for analytics tracking
    if (window.gtag) {
      window.gtag('event', 'navigation_click', {
        item_id: item.id,
        item_label: item.label
      });
    }
  };

  return (
    <Navigation 
      items={customItems}
      orientation="horizontal"
      showBreadcrumbs={true}
      onItemClick={handleItemClick}
    />
  );
};

// Example 5: Vertical Navigation for Sidebar
export const VerticalNavigationExample: React.FC = () => {
  const sidebarItems = [
    {
      id: 'overview',
      label: 'Overview',
      path: '/dashboard',
      icon: () => <span>📊</span>
    },
    {
      id: 'events',
      label: 'My Events',
      path: '/dashboard/events',
      icon: () => <span>📅</span>,
      badge: '3'
    },
    {
      id: 'volunteer',
      label: 'Volunteering',
      path: '/dashboard/volunteer',
      icon: () => <span>🤝</span>
    },
    {
      id: 'applications',
      label: 'Applications',
      path: '/dashboard/applications',
      icon: () => <span>📋</span>,
      children: [
        {
          id: 'applications-pending',
          label: 'Pending',
          path: '/dashboard/applications/pending'
        },
        {
          id: 'applications-history',
          label: 'History',
          path: '/dashboard/applications/history'
        }
      ]
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      path: '/dashboard/profile',
      icon: () => <span>⚙️</span>
    }
  ];

  return (
    <aside className="sidebar w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <RoleBasedMenu 
          items={sidebarItems}
          orientation="vertical"
          showBadges={true}
          showTooltips={true}
        />
      </div>
    </aside>
  );
};

// Example 6: Mobile-Only Navigation
export const MobileNavigationExample: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const mobileItems = NavigationHelpers.getNavigationByRole(
    UserRole.MEMBER,
    MembershipTier.REGULAR
  );

  return (
    <div className="mobile-layout">
      {/* Mobile header with toggle */}
      <header className="mobile-header md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900"
        >
          <span className="sr-only">Open menu</span>
          ☰
        </button>
      </header>

      {/* Mobile menu overlay */}
      <Navigation.MobileMenu
        items={mobileItems}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        orientation="vertical"
        onItemClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Desktop navigation */}
      <div className="hidden md:block">
        <Navigation 
          items={mobileItems}
          showMobileToggle={false}
          showBreadcrumbs={true}
        />
      </div>
    </div>
  );
};

// Example 7: Navigation with Custom Breadcrumbs
export const BreadcrumbsExample: React.FC = () => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      id: 'events',
      label: 'Events',
      path: '/events'
    },
    {
      id: 'event-detail',
      label: 'Event Details',
      path: '/events/workshop-2024'
    }
  ];

  const customBreadcrumbs = [
    {
      label: 'Home',
      path: '/'
    },
    {
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      label: 'Events',
      path: '/events'
    },
    {
      label: 'Workshop 2024',
      path: '/events/workshop-2024',
      isActive: true
    }
  ];

  return (
    <div className="page-container">
      <Navigation 
        items={navigationItems}
        showBreadcrumbs={false}
      />
      
      <div className="page-content">
        {/* Custom breadcrumbs */}
        <Breadcrumbs
          items={customBreadcrumbs}
          homeLabel="Home"
          showHome={true}
          maxItems={5}
          onItemClick={(item) => console.log('Breadcrumb clicked:', item)}
        />
        
        {/* Page content */}
        <div className="content-body">
          <h1>Workshop 2024 Details</h1>
          {/* Event details */}
        </div>
      </div>
    </div>
  );
};

// Example 8: Permission-Based Navigation
export const PermissionBasedExample: React.FC = () => {
  const handleAccessGranted = () => {
    console.log('User has access to protected content');
  };

  const handleAccessDenied = () => {
    console.log('User lacks permissions');
    // Could show a toast notification
    // toast.error('You don\'t have permission to access this area');
  };

  const protectedItems = [
    {
      id: 'admin-panel',
      label: 'Admin Panel',
      path: '/admin',
      permissions: ['admin:manage']
    },
    {
      id: 'user-management',
      label: 'User Management',
      path: '/admin/users',
      permissions: ['user:manage']
    }
  ];

  return (
    <ProtectedNavigation
      config={{
        items: protectedItems,
        requiredPermissions: ['admin:manage'],
        showError: true
      }}
      onAccessGranted={handleAccessGranted}
      onAccessDenied={handleAccessDenied}
    >
      <div className="admin-content">
        <Navigation 
          items={protectedItems}
          variant="admin"
          showBreadcrumbs={true}
        />
        
        <div className="admin-panel">
          <h1>Admin Panel</h1>
          {/* Admin functionality */}
        </div>
      </div>
    </ProtectedNavigation>
  );
};

// Example 9: Navigation with Search
export const SearchNavigationExample: React.FC = () => {
  const [searchResults, setSearchResults] = React.useState([]);
  
  const handleSearch = async (query: string) => {
    console.log('Searching for:', query);
    
    // Simulate search API call
    // const results = await api.get(`/search?q=${query}`);
    // setSearchResults(results.data);
    
    // Navigate to search results page
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  const navigationItems = NavigationHelpers.getNavigationByRole(
    UserRole.MEMBER,
    MembershipTier.REGULAR
  );

  return (
    <Navigation 
      items={navigationItems}
      showSearch={true}
      onSearch={handleSearch}
      showBreadcrumbs={true}
    />
  );
};

// Example 10: Complete Application Layout
export const ApplicationLayoutExample: React.FC = () => {
  const navigationItems = NavigationHelpers.getNavigationByRole(
    UserRole.MEMBER,
    MembershipTier.REGULAR
  );

  return (
    <div className="app-layout min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <Navigation 
        items={navigationItems}
        showBreadcrumbs={true}
        showSearch={true}
        showNotifications={true}
        showUserMenu={true}
      />

      {/* Main Content Area */}
      <main className="app-main">
        <div className="container mx-auto px-4 py-6">
          {/* Page-specific content goes here */}
          <h1>Welcome to the ISSB Membership Portal</h1>
          <p>Your membership dashboard and tools are available through the navigation above.</p>
        </div>
      </main>

      {/* Optional: Footer */}
      <footer className="app-footer bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 ISSB Membership Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default {
  BasicNavigationExample,
  AdminNavigationExample,
  BoardNavigationExample,
  CustomNavigationExample,
  VerticalNavigationExample,
  MobileNavigationExample,
  BreadcrumbsExample,
  PermissionBasedExample,
  SearchNavigationExample,
  ApplicationLayoutExample
};
