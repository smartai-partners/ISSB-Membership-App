# Migration Guide: Old to New Routing Infrastructure

This guide helps you migrate from the existing routing system to the new comprehensive routing infrastructure.

## Overview of Changes

### Old System
- Manual route definitions in `App.tsx`
- Basic protected routes with role checking
- Separate layout components wrapped manually
- Hard-coded navigation logic

### New System
- Centralized route configuration in `route-config.ts`
- Advanced route guards with multiple access levels
- Automatic layout management
- Lazy loading and code splitting
- Type-safe route definitions
- Navigation utilities and breadcrumbs

## Migration Steps

### Step 1: Install Dependencies

```bash
npm install react-router-dom framer-motion react-error-boundary
```

### Step 2: Update main.tsx

Replace your existing `main.tsx` setup:

**Old approach:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

**New approach:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### Step 3: Update Auth Store

Ensure your auth store provides the required interface:

**Old store:**
```tsx
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  // ... other properties
}
```

**Required interface:**
```tsx
interface AuthState {
  user: any | null;
  userRole?: UserRole; // 'admin' | 'board' | 'member' | 'volunteer' | 'prospective_member'
  isAuthenticated: boolean;
  isLoading: boolean;
  // ... other properties and methods
}
```

### Step 4: Update Route Definitions

**Old approach (in App.tsx):**
```tsx
<Route
  path="/admin/users"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <UserManagementPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

**New approach (in route-config.ts):**
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

### Step 5: Update Page Components

Ensure your page components follow the lazy loading pattern:

**Old approach:**
```tsx
import UserManagementPage from '../pages/admin/UserManagementPage';
```

**New approach:**
```tsx
// Components are auto-lazy loaded by the router
// Just ensure components are properly exported:
export default UserManagement;
```

### Step 6: Update Navigation Components

**Old navigation:**
```tsx
<Link to="/dashboard">Dashboard</Link>
```

**New navigation with router hook:**
```tsx
import { useRouter } from '../routing';

function Navigation() {
  const { navigate, isActiveRoute } = useRouter();
  
  return (
    <nav>
      <button 
        className={isActiveRoute('/dashboard') ? 'active' : ''}
        onClick={() => navigate('/dashboard')}
      >
        Dashboard
      </button>
    </nav>
  );
}
```

## Route Protection Migration

### Basic Authentication

**Old:**
```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

**New:**
```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```
*(No change needed - ProtectedRoute is compatible)*

### Role-based Access

**Old:**
```tsx
<ProtectedRoute allowedRoles={['admin']}>
  <AdminPanel />
</ProtectedRoute>
```

**New:**
```tsx
<RoleRoute allowedRoles={['admin']}>
  <AdminPanel />
</RoleRoute>
```

### Permission-based Access

**Old:** (Not available in old system)

**New:**
```tsx
<PermissionRoute 
  requiredPermissions={[{ action: 'manage', resource: 'users' }]}
>
  <UserManagement />
</PermissionRoute>
```

### Multiple Conditions

**Old:** (Complex manual logic)

**New:**
```tsx
<CompositeRouteGuard
  requireAuth={true}
  requireRole={['board', 'admin']}
  requirePermissions={[{ action: 'approve', resource: 'applications' }]}
  requireSubscription={['premium']}
  minimumAge={18}
>
  <AdvancedFeature />
</CompositeRouteGuard>
```

## Layout System Migration

### Old Layout System
```tsx
const Layout = getLayout(); // Function that returns layout component
<Route element={<Layout><Page /></Layout>} />
```

### New Layout System
```tsx
// Define in route metadata
metadata: {
  layout: 'admin', // 'auth' | 'admin' | 'board' | 'member' | 'public'
}

// Automatic layout wrapping
```

## Component Migration Examples

### Dashboard Component

**Old:**
```tsx
const Dashboard: React.FC = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
};
```

**New:**
```tsx
const Dashboard: React.FC = () => {
  const { getBreadcrumbs } = useRouter();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <nav>
        {getBreadcrumbs().map((crumb, index) => (
          <span key={index}>{crumb.label}</span>
        ))}
      </nav>
      {/* Dashboard content */}
    </div>
  );
};
```

### Navigation Component

**Old:**
```tsx
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav>
      <Link className={location.pathname === '/dashboard' ? 'active' : ''}>
        Dashboard
      </Link>
    </nav>
  );
};
```

**New:**
```tsx
import { useRouter, getNavigationItems } from '../routing';

const Navigation = () => {
  const { navigate, isActiveRoute } = useRouter();
  const navigationItems = getNavigationItems(userRole);
  
  return (
    <nav>
      {navigationItems.map((item) => (
        <button 
          key={item.path}
          className={isActiveRoute(item.path) ? 'active' : ''}
          onClick={() => navigate(item.path)}
        >
          {item.icon && <i className={`icon-${item.icon}`} />}
          {item.label}
        </button>
      ))}
    </nav>
  );
};
```

## Rollback Plan

If you need to rollback:

1. Restore the backup:
```bash
cp App.tsx.backup App.tsx
```

2. Remove new routing files:
```bash
rm -rf src/routing/
```

3. Reinstall old dependencies:
```bash
npm uninstall react-router-dom framer-motion react-error-boundary
```

## Testing Migration

### Test Authentication
```tsx
// Test that protected routes redirect to login
const { getByText } = render(<App />);
// Navigate to protected route
// Should redirect to login
```

### Test Role-based Access
```tsx
// Test that role-restricted routes show unauthorized page
const { getByText } = render(<App />);
// Login as member
// Try to access admin route
// Should show 403 page
```

### Test Navigation
```tsx
// Test breadcrumbs and active states
const { getByText } = render(<App />);
// Navigate through app
// Check breadcrumbs update
// Check active navigation states
```

## Common Issues and Solutions

### Issue: "Cannot find module" errors
**Solution:** Check that your page components follow the lazy import pattern and are properly exported.

### Issue: Layout not showing
**Solution:** Ensure your route metadata includes the correct `layout` property.

### Issue: Authentication not working
**Solution:** Verify your auth store implements the required interface with `userRole` and `isLoading` properties.

### Issue: Routes not matching
**Solution:** Check that paths in `route-config.ts` match exactly with navigation links.

## Performance Considerations

### Old System
- All components loaded upfront
- Manual code splitting

### New System
- Automatic lazy loading
- Route-based code splitting
- Optimized bundle sizes

Monitor your bundle sizes before and after migration to ensure performance improvements.

## Next Steps

After migration:

1. **Remove old routing code** from App.tsx
2. **Update tests** to work with new routing system
3. **Add route analytics** if needed
4. **Implement custom route guards** for specific business logic
5. **Add breadcrumbs** to all pages
6. **Implement deep linking** features
7. **Add route preloading** for critical routes

## Support

For issues during migration:

1. Check the [routing README](./README.md) for detailed documentation
2. Review the route guard components for specific use cases
3. Check TypeScript errors for type mismatches
4. Ensure all dependencies are properly installed

## Migration Checklist

- [ ] Install required dependencies
- [ ] Update auth store interface
- [ ] Migrate route definitions
- [ ] Update page components
- [ ] Test authentication flows
- [ ] Test role-based access
- [ ] Test navigation breadcrumbs
- [ ] Verify lazy loading works
- [ ] Check performance improvements
- [ ] Update tests
- [ ] Remove old routing code
- [ ] Update documentation