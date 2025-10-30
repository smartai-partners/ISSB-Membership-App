# Routing Infrastructure

A comprehensive routing system for React applications with role-based access control, lazy loading, and route protection patterns.

## Features

- 🎯 **Role-based Access Control**: Restrict routes based on user roles
- 🛡️ **Route Protection**: Multiple layers of route guards and authentication checks
- 🚀 **Lazy Loading**: Automatic code splitting for optimal performance
- 📱 **Responsive Layouts**: Support for different layout types (auth, admin, board, member, public)
- 🎨 **Page Transitions**: Smooth animations with Framer Motion
- 🔍 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 📊 **Navigation Management**: Breadcrumbs, active route detection, and navigation utilities
- ⚡ **Error Boundaries**: Graceful error handling and fallbacks

## Quick Start

### 1. Install Required Dependencies

```bash
npm install react-router-dom framer-motion react-error-boundary
```

### 2. Set Up the Router

Update your `main.tsx` file:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './routing';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
```

### 3. Configure Authentication

Make sure your auth store provides the required context:

```tsx
// store/authStore.ts
import { create } from 'zustand';
import { UserRole } from '../routing/types';

interface AuthState {
  user: any | null;
  userRole: UserRole | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  // ... other auth methods
}

export const useAuth = create<AuthState>((set) => ({
  // Auth implementation
}));
```

## Usage Examples

### Basic Route Protection

```tsx
import { ProtectedRoute } from '../routing';

function PrivateComponent() {
  return <div>This requires authentication</div>;
}

// Wrap component with protection
<ProtectedRoute>
  <PrivateComponent />
</ProtectedRoute>
```

### Role-based Access

```tsx
import { RoleRoute } from '../routing';

function AdminPanel() {
  return <div>Admin only content</div>;
}

// Only admins can access
<RoleRoute allowedRoles={['admin']}>
  <AdminPanel />
</RoleRoute>
```

### Permission-based Access

```tsx
import { PermissionRoute } from '../routing';

function UserManagement() {
  return <div>User management interface</div>;
}

// Only users with 'manage:users' permission
<PermissionRoute 
  requiredPermissions={[{ action: 'manage', resource: 'users' }]}
>
  <UserManagement />
</PermissionRoute>
```

### Composite Route Guards

```tsx
import { CompositeRouteGuard } from '../routing';

function PremiumFeature() {
  return <div>Premium feature content</div>;
}

// Multiple conditions
<CompositeRouteGuard
  requireAuth={true}
  requireRole={['member', 'admin']}
  requirePermissions={[{ action: 'read', resource: 'premium' }]}
  requireSubscription={['premium', 'enterprise']}
  minimumAge={18}
>
  <PremiumFeature />
</CompositeRouteGuard>
```

### Using the Router Hook

```tsx
import { useRouter } from '../routing';

function MyComponent() {
  const { 
    navigate, 
    goBack, 
    getBreadcrumbs, 
    isActiveRoute 
  } = useRouter();

  return (
    <div>
      <button onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </button>
      
      <button onClick={goBack}>
        Go Back
      </button>
      
      <nav>
        {getBreadcrumbs().map((crumb, index) => (
          <a key={index} href={crumb.path}>
            {crumb.label}
          </a>
        ))}
      </nav>
      
      {isActiveRoute('/dashboard') && <p>On dashboard</p>}
    </div>
  );
}
```

### Route Configuration

Routes are defined in `route-config.ts`:

```tsx
{
  path: '/admin/users',
  component: () => import('../features/admin/UserManagement'),
  metadata: {
    title: 'User Management',
    description: 'Manage system users',
    icon: 'users',
    breadcrumb: 'Users',
    requiresAuth: true,
    allowedRoles: ['admin'],
    layout: 'admin',
  },
}
```

## Available Layouts

- **AuthLayout**: For login/register pages
- **AdminLayout**: For administrative interfaces
- **BoardLayout**: For board member pages
- **MemberLayout**: For member pages
- **Layout**: Default public layout

## Route Metadata Options

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Page title for SEO and navigation |
| `description` | `string` | Page description |
| `icon` | `string` | Icon identifier for navigation |
| `breadcrumb` | `string` | Breadcrumb label |
| `requiresAuth` | `boolean` | Requires authentication |
| `allowedRoles` | `UserRole[]` | Allowed user roles |
| `requiredPermissions` | `RoutePermission[]` | Required permissions |
| `hideInNavigation` | `boolean` | Hide from navigation menu |
| `exactMatch` | `boolean` | Exact path matching |
| `loadingComponent` | `string` | Custom loading component |
| `errorComponent` | `string` | Custom error component |
| `layout` | `LayoutType` | Layout component to use |

## User Roles

- `prospective_member`: Users who haven't been approved yet
- `volunteer`: Users with volunteer access
- `member`: Regular members
- `board`: Board members with elevated privileges
- `admin`: System administrators

## Permission System

Permissions follow the format `{ action: string; resource: string }`:

```tsx
// Example permissions
{ action: 'manage', resource: 'users' }
{ action: 'read', resource: 'events' }
{ action: 'approve', resource: 'applications' }
```

## Error Handling

The router includes error boundaries and fallbacks:

- **404 Pages**: Automatic 404 handling for unknown routes
- **Authentication Errors**: Redirects to login for protected routes
- **Authorization Errors**: Shows 403 page for insufficient permissions
- **Loading States**: Loading spinners during authentication checks
- **Error Boundaries**: Catches and displays errors gracefully

## Performance Features

- **Lazy Loading**: All route components are lazy-loaded
- **Code Splitting**: Automatic chunking by route
- **Route Caching**: Cached component instances
- **Optimized Navigation**: Efficient route matching

## Navigation

The routing system provides:

- **Breadcrumbs**: Automatic breadcrumb generation
- **Active Route Detection**: Highlight current navigation items
- **Back/Forward Support**: Browser history integration
- **Deep Linking**: Direct access to specific routes

## Customization

### Custom Route Guards

```tsx
export const CustomRouteGuard: React.FC<CustomRouteProps> = ({
  children,
  customCondition,
}) => {
  const { user } = useAuth();
  
  if (!customCondition(user)) {
    return <CustomUnauthorized />;
  }
  
  return <>{children}</>;
};
```

### Custom Layouts

```tsx
// layouts/CustomLayout.tsx
import React from 'react';

export const CustomLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="custom-layout">
      <header>Custom Header</header>
      <main>{children}</main>
      <footer>Custom Footer</footer>
    </div>
  );
};
```

## Testing

```tsx
// Example test for protected routes
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../routing';
import { useAuth } from '../features/auth/hooks';

// Mock auth hook
jest.mock('../features/auth/hooks');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

test('renders children when authenticated', () => {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    user: { id: '1' },
  });

  render(
    <ProtectedRoute>
      <div>Protected Content</div>
    </ProtectedRoute>
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

## Best Practices

1. **Always wrap protected content** with appropriate route guards
2. **Use specific roles** instead of broad permissions when possible
3. **Define metadata** for all routes for better navigation
4. **Handle loading states** gracefully in user interface
5. **Test route guards** thoroughly for security
6. **Use lazy loading** for better performance
7. **Implement proper error boundaries** for graceful failures

## Troubleshooting

### Route Not Working
- Check if the path matches exactly (including trailing slashes)
- Verify authentication state
- Ensure user has required roles/permissions

### Performance Issues
- Enable route-level code splitting
- Use React.memo for route components
- Implement proper loading states

### Navigation Problems
- Check browser history configuration
- Verify base path settings
- Ensure proper route ordering (more specific routes first)

## API Reference

### Components
- `AppRouter`: Main router component
- `ProtectedRoute`: Authentication guard
- `RoleRoute`: Role-based access guard
- `PermissionRoute`: Permission-based access guard
- `CompositeRouteGuard`: Multiple condition guard

### Hooks
- `useRouter`: Router navigation and state
- `useRouteGuard`: Current route guard context

### Utilities
- `withRouter`: HOC for router-aware components
- `withRouteGuard`: HOC for guard-aware components
- `getRouteConfiguration`: Get route setup information