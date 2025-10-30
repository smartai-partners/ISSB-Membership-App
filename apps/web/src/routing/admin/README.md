# Admin Routing Module

Comprehensive routing system for admin-only features with role-based access control and permission checking.

## Features

- **Protected Routes**: All admin routes require admin role authentication
- **Permission-Based Access**: Fine-grained permission checking for different admin functions
- **Lazy Loading**: Components are lazy-loaded for optimal performance
- **Nested Routes**: Support for nested route structures with breadcrumbs
- **Role Guards**: Multiple levels of route protection and fallbacks
- **Navigation**: Admin-specific navigation component with permission filtering

## Directory Structure

```
routing/admin/
├── index.ts                    # Main admin routes configuration
├── permissions.ts              # Admin-specific permission utilities
├── guards.tsx                  # Route guard components
├── AdminNavigation.tsx         # Admin navigation menu component
├── router.ts                   # Complete router configuration
├── pages/
│   ├── index.ts               # Pages barrel export
│   ├── AdminDashboardPage.tsx
│   ├── UserManagementPage.tsx
│   ├── UserDetailsPage.tsx
│   ├── CreateUserPage.tsx
│   ├── EditUserPage.tsx
│   ├── MembershipManagementPage.tsx
│   ├── MembershipTierPage.tsx
│   ├── CreateMembershipTierPage.tsx
│   ├── EditMembershipTierPage.tsx
│   ├── EventManagementPage.tsx
│   ├── EventDetailsPage.tsx
│   ├── CreateEventPage.tsx
│   ├── EditEventPage.tsx
│   ├── ApplicationReviewPage.tsx
│   ├── ApplicationDetailsPage.tsx
│   ├── ReviewApplicationPage.tsx
│   ├── SystemSettingsPage.tsx
│   ├── SystemLogsPage.tsx
│   ├── BackupPage.tsx
│   └── AuditTrailPage.tsx
└── README.md                  # This file
```

## Route Structure

### Admin Routes Overview

| Path | Component | Required Permission | Description |
|------|-----------|-------------------|-------------|
| `/admin` | AdminDashboard | `user:read` | Admin dashboard with system overview |
| `/admin/users` | UserManagement | `user:read` | User management interface |
| `/admin/users/create` | CreateUser | `user:write` | Create new user form |
| `/admin/users/:userId` | UserDetails | `user:read` | User details view |
| `/admin/users/:userId/edit` | EditUser | `user:write` | Edit user form |
| `/admin/membership` | MembershipManagement | `membership:read` | Membership management |
| `/admin/membership/tiers` | MembershipTier | `membership:read` | Membership tiers |
| `/admin/membership/tiers/create` | CreateMembershipTier | `membership:write` | Create tier form |
| `/admin/membership/tiers/:tierId/edit` | EditMembershipTier | `membership:write` | Edit tier form |
| `/admin/events` | EventManagement | `event:read` | Event management |
| `/admin/events/create` | CreateEvent | `event:write` | Create event form |
| `/admin/events/:eventId` | EventDetails | `event:read` | Event details |
| `/admin/events/:eventId/edit` | EditEvent | `event:write` | Edit event form |
| `/admin/applications` | ApplicationReview | `application:read` | Application review |
| `/admin/applications/:applicationId` | ApplicationDetails | `application:read` | Application details |
| `/admin/applications/:applicationId/review` | ReviewApplication | `application:approve` | Review form |
| `/admin/settings` | SystemSettings | `settings:read` | System settings |
| `/admin/settings/logs` | SystemLogs | `system:manage` | System logs viewer |
| `/admin/settings/backup` | Backup | `system:manage` | Backup management |
| `/admin/settings/audit` | AuditTrail | `system:manage` | Audit trail viewer |

## Usage

### Basic Route Setup

```typescript
import { adminRouterConfig } from '@/routing/admin';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected admin routes */}
      <Route path="admin/*" element={<AdminLayout />}>
        {adminRouterConfig.map(route => (
          <Route key={route.path} {...route} />
        ))}
      </Route>
    </Routes>
  );
};
```

### Using Route Guards

```typescript
import { AdminRouteGuard } from '@/routing/admin/guards';

const AdminComponent: React.FC = () => {
  return (
    <AdminRouteGuard requiredPermission="user:read">
      <UserManagement />
    </AdminRouteGuard>
  );
};
```

### Conditional Rendering Based on Permissions

```typescript
import { AdminContent } from '@/routing/admin/guards';

const PageContent: React.FC = () => {
  return (
    <div>
      <AdminContent 
        requiredPermission="user:write"
        fallback={<div>Access denied</div>}
      >
        <UserCreationForm />
      </AdminContent>
    </div>
  );
};
```

### Using the Admin Navigation

```typescript
import AdminNavigation from '@/routing/admin/AdminNavigation';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-100">
        <AdminNavigation />
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
```

### Permission Checking

```typescript
import { useAdminAccess } from '@/routing/admin/guards';

const AdminComponent: React.FC = () => {
  const { hasPermission, hasAnyPermission } = useAdminAccess();
  
  const canEditUsers = hasPermission('user:write');
  const canManageEvents = hasAnyPermission(['event:read', 'event:write']);
  
  return (
    <div>
      {canEditUsers && <EditUserButton />}
      {canManageEvents && <EventManagement />}
    </div>
  );
};
```

## Permission System

### Admin Permissions

| Permission | Description | Routes |
|------------|-------------|--------|
| `user:read` | View user information | All user routes |
| `user:write` | Create/edit users | Create/Edit user routes |
| `user:delete` | Delete users | User deletion routes |
| `membership:read` | View membership data | All membership routes |
| `membership:write` | Create/edit tiers | Tier creation/editing |
| `event:read` | View events | All event routes |
| `event:write` | Create/edit events | Event creation/editing |
| `event:delete` | Delete events | Event deletion |
| `application:read` | View applications | All application routes |
| `application:approve` | Approve/reject apps | Application review |
| `settings:read` | View settings | Settings pages |
| `settings:write` | Modify settings | Settings modification |
| `system:manage` | System administration | Logs, backup, audit |
| `report:read` | View reports | Reports pages |
| `notification:read` | View notifications | Notification management |
| `notification:write` | Send notifications | Notification creation |
| `volunteer:read` | View volunteer ops | Volunteer management |
| `volunteer:write` | Create/edit volunteer ops | Volunteer operations |

### Role Hierarchy

```
Admin (highest privileges)
├── Full system access
├── All permissions granted
└── Can access all admin routes

Board (moderate privileges)
├── Limited admin access
├── Application review permissions
└── Can access some admin routes

Member (basic privileges)
├── No admin access
└── Can only access member routes
```

## Components

### Route Guards

- `AdminRouteGuard`: Main route protection component
- `AdminUserManagementGuard`: Specific guard for user management
- `AdminMembershipGuard`: Specific guard for membership management
- `AdminEventGuard`: Specific guard for event management
- `AdminApplicationGuard`: Specific guard for application review
- `AdminSystemGuard`: Specific guard for system settings
- `AdminReportGuard`: Specific guard for reports
- `AdminNotificationGuard`: Specific guard for notifications
- `AdminVolunteerGuard`: Specific guard for volunteer management

### Utility Components

- `AdminContent`: Conditional rendering based on permissions
- `AdminNavigation`: Permission-filtered navigation menu
- `AdminLoading`: Loading spinner for lazy-loaded components

### Hooks

- `useAdminAccess`: Hook for checking admin permissions and access

### Utilities

- Permission checking functions in `permissions.ts`
- Route metadata and configuration utilities in `router.ts`

## Best Practices

1. **Always use route guards** for admin functionality
2. **Check permissions** before rendering sensitive components
3. **Use lazy loading** for better performance
4. **Implement proper fallbacks** for unauthorized access
5. **Keep route configurations** centralized and organized
6. **Use the navigation component** for consistent admin UX
7. **Implement proper breadcrumbs** for deep navigation

## Error Handling

Routes include proper error handling for:
- Unauthenticated users (redirect to login)
- Unauthorized users (redirect to unauthorized page)
- Permission denied (custom fallback or unauthorized page)
- Missing resources (404 handling)

## Integration with Existing Code

The admin routing system is designed to integrate seamlessly with the existing application structure:

- Uses existing `useAuthStore` and `usePermissionStore`
- Compatible with existing `AdminLayout` component
- Follows established patterns for route protection
- Maintains consistency with other route types

## Testing

When testing admin routes:

1. Test route protection with different user roles
2. Verify permission checking works correctly
3. Test nested route navigation
4. Verify loading states for lazy-loaded components
5. Test error handling for unauthorized access
6. Test navigation menu filtering based on permissions
