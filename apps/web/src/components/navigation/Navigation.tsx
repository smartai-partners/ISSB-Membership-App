import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  User, 
  Settings, 
  Bell, 
  Search,
  ChevronDown,
  LogOut,
  Shield
} from 'lucide-react';
import { NavigationItem, NavigationHelpers } from './NavigationHelpers';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { Button } from '../ui/Button';
import { RoleBasedMenu } from './RoleBasedMenu';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileMenu } from './RoleBasedMenu';

/**
 * Navigation component props
 */
export interface NavigationProps {
  items?: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'minimal' | 'admin';
  showBreadcrumbs?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showMobileToggle?: boolean;
  collapsed?: boolean;
  onItemClick?: (item: NavigationItem) => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: (action: string) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * User menu component
 */
const UserMenu: React.FC<{
  user: any;
  isOpen: boolean;
  onToggle: () => void;
  onMenuAction: (action: string) => void;
  className?: string;
}> = ({ user, isOpen, onToggle, onMenuAction, className = '' }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { logout } = useAuthStore();

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onToggle]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onToggle();
    }
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      action: 'profile' as const,
      description: 'View and edit your profile'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: 'settings' as const,
      description: 'Manage your account settings'
    },
    {
      id: 'role',
      label: `Role: ${user?.role}`,
      icon: Shield,
      action: 'role' as const,
      description: `You have ${user?.role} privileges`
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: LogOut,
      action: 'logout' as const,
      description: 'Sign out of your account',
      variant: 'destructive' as const
    }
  ];

  return (
    <div className={`user-menu relative ${className}`} ref={menuRef}>
      {/* User menu trigger */}
      <button
        type="button"
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`User menu for ${user?.firstName} ${user?.lastName}`}
      >
        {/* User avatar */}
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt="" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span>
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </span>
          )}
        </div>
        
        {/* User name (desktop) */}
        <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
          {user?.firstName} {user?.lastName}
        </span>
        
        {/* Dropdown arrow */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`w-full flex items-center px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 ${
                  item.variant === 'destructive' 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => onMenuAction(item.action)}
                role="menuitem"
              >
                <item.icon className="w-4 h-4 mr-3" aria-hidden="true" />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Search component
 */
const SearchComponent: React.FC<{
  onSearch: (query: string) => void;
  className?: string;
}> = ({ onSearch, className = '' }) => {
  const [query, setQuery] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`search-form ${className}`}>
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search navigation..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          aria-label="Search navigation"
        />
      </div>
    </form>
  );
};

/**
 * Notifications component
 */
const NotificationsMenu: React.FC<{
  notifications: Array<{ id: string; title: string; message: string; read: boolean }>;
  onNotificationClick: () => void;
  onMarkAllRead: () => void;
  className?: string;
}> = ({ notifications, onNotificationClick, onMarkAllRead, className = '' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`notifications-menu relative ${className}`} ref={menuRef}>
      <button
        type="button"
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => {
          setIsOpen(!isOpen);
          onNotificationClick();
        }}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/notifications"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main navigation component
 */
export const Navigation: React.FC<NavigationProps> = ({
  items,
  orientation = 'horizontal',
  variant = 'default',
  showBreadcrumbs = true,
  showSearch = false,
  showNotifications = true,
  showUserMenu = true,
  showMobileToggle = true,
  collapsed = false,
  onItemClick,
  onSearch,
  onNotificationClick,
  onUserMenuClick,
  className = '',
  'aria-label': ariaLabel = 'Main navigation',
  ...props
}) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  // State management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [notifications] = React.useState([
    // Mock notifications - in real app, these would come from a store
    {
      id: '1',
      title: 'New Event Registration',
      message: 'You have been registered for the upcoming workshop',
      read: false
    },
    {
      id: '2',
      title: 'Application Status',
      message: 'Your membership application has been approved',
      read: false
    }
  ]);

  // Get navigation items based on user role
  const navigationItems = React.useMemo(() => {
    if (!user || !isAuthenticated) {
      return [];
    }

    if (items) {
      return NavigationHelpers.filterByPermissions(
        items,
        user.role,
        user.tier,
        hasPermission
      );
    }

    return NavigationHelpers.getNavigationByRole(user.role, user.tier);
  }, [items, user, isAuthenticated, hasPermission]);

  // Handle mobile menu toggle
  const handleMobileMenuToggle = React.useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  // Handle user menu actions
  const handleUserMenuAction = React.useCallback((action: string) => {
    setIsUserMenuOpen(false);
    
    switch (action) {
      case 'profile':
        window.location.href = '/profile';
        break;
      case 'settings':
        window.location.href = '/settings';
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }

    if (onUserMenuClick) {
      onUserMenuClick(action);
    }
  }, [logout, onUserMenuClick]);

  // Handle navigation item click
  const handleItemClick = React.useCallback((item: NavigationItem) => {
    // Close mobile menu when item is clicked
    setIsMobileMenuOpen(false);
    
    if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  // Handle search
  const handleSearch = React.useCallback((query: string) => {
    if (onSearch) {
      onSearch(query);
    }
    // In a real app, you might navigate to a search results page
    console.log('Searching for:', query);
  }, [onSearch]);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Navigation classes
  const navigationClasses = `
    navigation
    ${orientation === 'horizontal' ? 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700' : ''}
    ${variant === 'admin' ? 'bg-gray-900 text-white' : ''}
    ${className}
  `;

  return (
    <>
      <nav className={navigationClasses} aria-label={ariaLabel} {...props}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and mobile menu toggle */}
            <div className="flex items-center">
              {showMobileToggle && (
                <button
                  type="button"
                  className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleMobileMenuToggle}
                  aria-label="Toggle mobile menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" aria-hidden="true" />
                  ) : (
                    <Menu className="w-6 h-6" aria-hidden="true" />
                  )}
                </button>
              )}
              
              <Link 
                to="/dashboard" 
                className="flex items-center ml-2 md:ml-0 text-xl font-bold text-gray-900 dark:text-gray-100"
              >
                <Home className="w-6 h-6 mr-2" aria-hidden="true" />
                <span>ISSB</span>
              </Link>
            </div>

            {/* Desktop navigation menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {navigationItems.length > 0 && (
                <RoleBasedMenu
                  items={navigationItems}
                  orientation="horizontal"
                  onItemClick={handleItemClick}
                  showBadges={true}
                  showTooltips={true}
                />
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              {showSearch && onSearch && (
                <div className="hidden lg:block">
                  <SearchComponent onSearch={handleSearch} />
                </div>
              )}

              {/* Notifications */}
              {showNotifications && (
                <NotificationsMenu
                  notifications={notifications}
                  onNotificationClick={onNotificationClick || (() => {})}
                  onMarkAllRead={() => console.log('Mark all as read')}
                />
              )}

              {/* User menu */}
              {showUserMenu && (
                <UserMenu
                  user={user}
                  isOpen={isUserMenuOpen}
                  onToggle={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onMenuAction={handleUserMenuAction}
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {showMobileToggle && (
        <MobileMenu
          items={navigationItems}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          orientation="vertical"
          onItemClick={handleItemClick}
          showBadges={true}
          showTooltips={false}
        />
      )}

      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumbs
              navigationItems={navigationItems}
              homeLabel="Home"
              maxItems={4}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
