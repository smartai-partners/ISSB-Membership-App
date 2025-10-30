import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink,
  Lock,
  Badge
} from 'lucide-react';
import { NavigationItem, NavigationHelpers, UserRole, MembershipTier } from './NavigationHelpers';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';

/**
 * Role-based menu component props
 */
export interface RoleBasedMenuProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  collapsed?: boolean;
  showBadges?: boolean;
  showTooltips?: boolean;
  onItemClick?: (item: NavigationItem) => void;
  onSubMenuToggle?: (itemId: string, isExpanded: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Menu item component props
 */
export interface MenuItemProps {
  item: NavigationItem;
  isActive: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  showBadge?: boolean;
  showTooltip?: boolean;
  orientation: 'horizontal' | 'vertical';
  onItemClick?: (item: NavigationItem) => void;
  onSubMenuToggle?: (itemId: string, isExpanded: boolean) => void;
  level?: number;
}

/**
 * Menu item with role-based access control and accessibility
 */
export const MenuItemComponent: React.FC<MenuItemProps> = ({
  item,
  isActive,
  isExpanded,
  hasChildren,
  showBadge = true,
  showTooltip = true,
  orientation,
  onItemClick,
  onSubMenuToggle,
  level = 0
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  // Check if item should be highlighted as new
  const isNew = NavigationHelpers.isNewItem(item);
  
  // Get accessible label
  const accessibleLabel = NavigationHelpers.getAccessibleLabel(item);
  
  // Handle item click
  const handleItemClick = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (hasChildren && onSubMenuToggle) {
      event.preventDefault();
      onSubMenuToggle(item.id, !isExpanded);
    }
    
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleItemClick(event);
    } else if (event.key === 'ArrowRight' && hasChildren && !isExpanded) {
      event.preventDefault();
      onSubMenuToggle?.(item.id, true);
    } else if (event.key === 'ArrowLeft' && hasChildren && isExpanded) {
      event.preventDefault();
      onSubMenuToggle?.(item.id, false);
    }
  };

  // Check if user can access this item
  const canAccess = React.useMemo(() => {
    if (!user) return false;
    return NavigationHelpers.canAccessItem(
      item,
      user.role,
      user.tier,
      hasPermission
    );
  }, [item, user, hasPermission]);

  // Don't render if user can't access
  if (!canAccess) {
    return null;
  }

  const menuItemClasses = `
    menu-item
    group relative flex items-center
    ${orientation === 'horizontal' ? 'px-3 py-2' : 'px-4 py-2.5'}
    ${orientation === 'vertical' ? 'w-full' : ''}
    text-sm font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    ${level > 0 ? 'ml-4 pl-8' : ''}
    ${isActive 
      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm' 
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
    }
  `;

  const subMenuClasses = `
    sub-menu
    ${orientation === 'horizontal' 
      ? 'absolute top-full left-0 mt-1 w-48' 
      : 'absolute right-full top-0 mr-1 w-48'
    }
    bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
    rounded-lg shadow-lg z-50
    ${isExpanded ? 'opacity-100 visible transform scale-100' : 'opacity-0 invisible transform scale-95'}
    transition-all duration-200
  `;

  return (
    <div className="menu-item-container relative">
      {/* Main menu item */}
      <div className="menu-button-wrapper">
        {hasChildren ? (
          <button
            type="button"
            className={menuItemClasses}
            onClick={handleItemClick}
            onKeyDown={handleKeyDown}
            aria-expanded={isExpanded}
            aria-haspopup={hasChildren}
            aria-describedby={showTooltip && item.description ? `${item.id}-description` : undefined}
            title={showTooltip && !item.label.includes('...') ? item.label : undefined}
          >
            {/* Icon */}
            {item.icon && (
              <span className="menu-icon mr-3 flex-shrink-0" aria-hidden="true">
                <item.icon className="w-5 h-5" />
              </span>
            )}
            
            {/* Label */}
            <span className="menu-label flex-1 text-left">
              {item.label}
            </span>
            
            {/* Badge */}
            {showBadge && item.badge && (
              <Badge
                variant={isNew ? 'default' : 'secondary'}
                className="ml-2 text-xs"
              >
                {item.badge}
              </Badge>
            )}
            
            {/* New indicator */}
            {isNew && !showBadge && (
              <Badge variant="default" className="ml-2 text-xs">
                New
              </Badge>
            )}
            
            {/* Expand/collapse icon */}
            <ChevronRight 
              className={`ml-2 w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <Link
            to={NavigationHelpers.getItemUrl(item)}
            className={menuItemClasses}
            onClick={handleItemClick}
            onKeyDown={handleKeyDown}
            target={item.isExternal ? '_blank' : undefined}
            rel={item.isExternal ? 'noopener noreferrer' : undefined}
            aria-current={isActive ? 'page' : undefined}
            aria-describedby={showTooltip && item.description ? `${item.id}-description` : undefined}
            title={showTooltip && !item.label.includes('...') ? item.label : undefined}
          >
            {/* Icon */}
            {item.icon && (
              <span className="menu-icon mr-3 flex-shrink-0" aria-hidden="true">
                <item.icon className="w-5 h-5" />
              </span>
            )}
            
            {/* Label */}
            <span className="menu-label flex-1">
              {item.label}
            </span>
            
            {/* Badge */}
            {showBadge && item.badge && (
              <Badge
                variant={isNew ? 'default' : 'secondary'}
                className="ml-2 text-xs"
              >
                {item.badge}
              </Badge>
            )}
            
            {/* New indicator */}
            {isNew && !showBadge && (
              <Badge variant="default" className="ml-2 text-xs">
                New
              </Badge>
            )}
            
            {/* External link indicator */}
            {item.isExternal && (
              <ExternalLink className="ml-2 w-4 h-4" aria-hidden="true" />
            )}
          </Link>
        )}
        
        {/* Tooltip for description */}
        {showTooltip && item.description && (
          <div
            id={`${item.id}-description`}
            role="tooltip"
            className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 pointer-events-none"
          >
            {item.description}
          </div>
        )}
      </div>

      {/* Submenu */}
      {hasChildren && item.children && item.children.length > 0 && (
        <div 
          className={subMenuClasses}
          role="menu"
          aria-labelledby={`${item.id}-button`}
        >
          <div className="py-1">
            {item.children.map((child) => (
              <MenuItemComponent
                key={child.id}
                item={child}
                isActive={NavigationHelpers.isItemActive(child, location.pathname)}
                isExpanded={false}
                hasChildren={false}
                showBadge={showBadge}
                showTooltip={showTooltip}
                orientation={orientation}
                onItemClick={onItemClick}
                onSubMenuToggle={onSubMenuToggle}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Role-based menu component
 */
export const RoleBasedMenu: React.FC<RoleBasedMenuProps> = ({
  items,
  orientation = 'horizontal',
  collapsed = false,
  showBadges = true,
  showTooltips = true,
  onItemClick,
  onSubMenuToggle,
  className = '',
  'aria-label': ariaLabel = 'Main navigation menu',
  ...props
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();
  
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Filter items based on user permissions
  const filteredItems = React.useMemo(() => {
    if (!user) return [];
    
    return NavigationHelpers.filterByPermissions(
      items,
      user.role,
      user.tier,
      hasPermission
    );
  }, [items, user, hasPermission]);

  // Sort items
  const sortedItems = React.useMemo(() => {
    return NavigationHelpers.sortItems(filteredItems);
  }, [filteredItems]);

  // Toggle submenu expansion
  const handleSubMenuToggle = React.useCallback((itemId: string, isExpanded: boolean) => {
    setExpandedItems(prev => 
      isExpanded 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
    
    if (onSubMenuToggle) {
      onSubMenuToggle(itemId, isExpanded);
    }
  }, [onSubMenuToggle]);

  // Handle item click
  const handleItemClick = React.useCallback((item: NavigationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  if (!user) {
    return null;
  }

  const menuClasses = `
    role-based-menu
    ${orientation === 'horizontal' ? 'flex items-center space-x-1' : 'flex flex-col space-y-1'}
    ${collapsed ? 'collapsed' : ''}
    ${className}
  `;

  return (
    <nav 
      className={menuClasses}
      aria-label={ariaLabel}
      role="menubar"
      {...props}
    >
      {sortedItems.map((item) => (
        <MenuItemComponent
          key={item.id}
          item={item}
          isActive={NavigationHelpers.isItemActive(item, location.pathname)}
          isExpanded={expandedItems.includes(item.id)}
          hasChildren={!!(item.children && item.children.length > 0)}
          showBadge={showBadges}
          showTooltip={showTooltips}
          orientation={orientation}
          onItemClick={handleItemClick}
          onSubMenuToggle={handleSubMenuToggle}
        />
      ))}
    </nav>
  );
};

/**
 * Specialized menu components for different contexts
 */

// Admin-only menu
export const AdminMenu: React.FC<Omit<RoleBasedMenuProps, 'items'>> = (props) => {
  const { user } = useAuthStore();
  
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  const adminItems = NavigationHelpers.getNavigationByRole(UserRole.ADMIN, user.tier);
  
  return <RoleBasedMenu items={adminItems} {...props} />;
};

// Board member menu
export const BoardMenu: React.FC<Omit<RoleBasedMenuProps, 'items'>> = (props) => {
  const { user } = useAuthStore();
  
  if (!user || (user.role !== UserRole.BOARD && user.role !== UserRole.ADMIN)) {
    return null;
  }

  const boardItems = NavigationHelpers.getNavigationByRole(user.role, user.tier);
  
  return <RoleBasedMenu items={boardItems} {...props} />;
};

// Member menu
export const MemberMenu: React.FC<Omit<RoleBasedMenuProps, 'items'>> = (props) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return null;
  }

  const memberItems = NavigationHelpers.getNavigationByRole(user.role, user.tier);
  
  return <RoleBasedMenu items={memberItems} {...props} />;
};

// Mobile menu with drawer behavior
export const MobileMenu: React.FC<RoleBasedMenuProps & {
  isOpen: boolean;
  onClose: () => void;
}> = ({
  isOpen,
  onClose,
  orientation = 'vertical',
  ...props
}) => {
  const { user } = useAuthStore();
  
  if (!isOpen || !user) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu panel */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out md:hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Navigation
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close menu"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <RoleBasedMenu 
            {...props} 
            orientation="vertical"
            showTooltips={false}
            onItemClick={() => onClose()}
          />
        </div>
      </div>
    </>
  );
};

export default RoleBasedMenu;
