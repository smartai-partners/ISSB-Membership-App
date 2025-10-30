/**
 * Admin Navigation Component
 * Navigation menu specifically for admin routes with permission checking
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
// Simple icon components to replace Heroicons
const HomeIcon = ({ className }: { className?: string }) => <span className={className}>🏠</span>;
const UsersIcon = ({ className }: { className?: string }) => <span className={className}>👥</span>;
const UserGroupIcon = ({ className }: { className?: string }) => <span className={className}>👤</span>;
const CalendarIcon = ({ className }: { className?: string }) => <span className={className}>📅</span>;
const DocumentTextIcon = ({ className }: { className?: string }) => <span className={className}>📄</span>;
const CogIcon = ({ className }: { className?: string }) => <span className={className}>⚙️</span>;
const ChartBarIcon = ({ className }: { className?: string }) => <span className={className}>📊</span>;
const BellIcon = ({ className }: { className?: string }) => <span className={className}>🔔</span>;
const HeartIcon = ({ className }: { className?: string }) => <span className={className}>❤️</span>;
const ShieldCheckIcon = ({ className }: { className?: string }) => <span className={className}>🛡️</span>;
import { useAdminAccess } from './guards';

interface AdminNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
  description: string;
  children?: AdminNavItem[];
}

const AdminNavigation: React.FC = () => {
  const location = useLocation();
  const { hasPermission } = useAdminAccess();

  const navigationItems: AdminNavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: HomeIcon,
      requiredPermission: 'user:read',
      description: 'Admin overview and statistics',
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: UsersIcon,
      requiredPermission: 'user:read',
      description: 'Manage user accounts and permissions',
      children: [
        {
          name: 'All Users',
          href: '/admin/users',
          icon: UsersIcon,
          requiredPermission: 'user:read',
          description: 'View all users',
        },
        {
          name: 'Create User',
          href: '/admin/users/create',
          icon: UsersIcon,
          requiredPermission: 'user:write',
          description: 'Create new user account',
        },
      ],
    },
    {
      name: 'Membership',
      href: '/admin/membership',
      icon: UserGroupIcon,
      requiredPermission: 'membership:read',
      description: 'Manage membership tiers and relationships',
      children: [
        {
          name: 'Tiers',
          href: '/admin/membership/tiers',
          icon: UserGroupIcon,
          requiredPermission: 'membership:read',
          description: 'Manage membership tiers',
        },
      ],
    },
    {
      name: 'Events',
      href: '/admin/events',
      icon: CalendarIcon,
      requiredPermission: 'event:read',
      description: 'Manage events and scheduling',
      children: [
        {
          name: 'All Events',
          href: '/admin/events',
          icon: CalendarIcon,
          requiredPermission: 'event:read',
          description: 'View all events',
        },
        {
          name: 'Create Event',
          href: '/admin/events/create',
          icon: CalendarIcon,
          requiredPermission: 'event:write',
          description: 'Create new event',
        },
      ],
    },
    {
      name: 'Applications',
      href: '/admin/applications',
      icon: DocumentTextIcon,
      requiredPermission: 'application:read',
      description: 'Review and process applications',
      children: [
        {
          name: 'Pending',
          href: '/admin/applications',
          icon: DocumentTextIcon,
          requiredPermission: 'application:read',
          description: 'View pending applications',
        },
      ],
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: ChartBarIcon,
      requiredPermission: 'report:read',
      description: 'View system reports and analytics',
    },
    {
      name: 'Volunteer',
      href: '/admin/volunteer',
      icon: HeartIcon,
      requiredPermission: 'volunteer:read',
      description: 'Manage volunteer opportunities',
      children: [
        {
          name: 'Opportunities',
          href: '/admin/volunteer',
          icon: HeartIcon,
          requiredPermission: 'volunteer:read',
          description: 'View volunteer opportunities',
        },
      ],
    },
    {
      name: 'Notifications',
      href: '/admin/notifications',
      icon: BellIcon,
      requiredPermission: 'notification:read',
      description: 'Manage system notifications',
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: CogIcon,
      requiredPermission: 'settings:read',
      description: 'System configuration and settings',
      children: [
        {
          name: 'General',
          href: '/admin/settings',
          icon: CogIcon,
          requiredPermission: 'settings:read',
          description: 'General system settings',
        },
        {
          name: 'Logs',
          href: '/admin/settings/logs',
          icon: DocumentTextIcon,
          requiredPermission: 'system:manage',
          description: 'View system logs',
        },
        {
          name: 'Backup',
          href: '/admin/settings/backup',
          icon: ShieldCheckIcon,
          requiredPermission: 'system:manage',
          description: 'Manage system backups',
        },
        {
          name: 'Audit Trail',
          href: '/admin/settings/audit',
          icon: ShieldCheckIcon,
          requiredPermission: 'system:manage',
          description: 'View audit trail',
        },
      ],
    },
  ];

  const filteredItems = navigationItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item: AdminNavItem, level: number = 0) => {
    const hasAccess = !item.requiredPermission || hasPermission(item.requiredPermission);
    if (!hasAccess) return null;

    const active = isActive(item.href);
    const paddingLeft = level * 16 + 16;

    return (
      <div key={item.name}>
        <NavLink
          to={item.href}
          className={`
            group flex items-center px-3 py-2 text-sm font-medium rounded-md
            ${active 
              ? 'bg-blue-100 text-blue-900' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }
            ${level > 0 ? 'pl-6' : ''}
          `}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <item.icon
            className={`
              mr-3 flex-shrink-0 h-5 w-5
              ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
            `}
          />
          <div className="flex-1">
            <div className="font-medium">{item.name}</div>
            {level === 0 && (
              <div className="text-xs text-gray-500 mt-0.5">
                {item.description}
              </div>
            )}
          </div>
        </NavLink>
        
        {item.children && item.children.length > 0 && (
          <div className="mt-1">
            {item.children.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="space-y-1">
      {filteredItems.map(item => renderNavItem(item))}
    </nav>
  );
};

export default AdminNavigation;
