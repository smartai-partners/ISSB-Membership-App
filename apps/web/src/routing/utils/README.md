# Routing Utilities

This directory contains comprehensive routing utilities and helpers for the web application. These utilities provide enhanced navigation, breadcrumb generation, analytics tracking, and error handling for React Router.

## Files Overview

### `route-helpers.ts`
Navigation helpers and utilities for programmatic routing.

**Key Features:**
- Enhanced navigation with options and error handling
- Query parameter management (build, parse, update, clear)
- Route validation and path building
- User permission and role checking
- Navigation state management
- Smart navigation with fallbacks
- Scroll position preservation

**Common Usage:**
```typescript
import { navigateTo, updateQueryParams, hasRequiredRole } from '../routing/utils';

const MyComponent = () => {
  const navigate = useNavigate();
  
  // Navigate with options
  const handleNavigation = () => {
    navigateTo(navigate, '/dashboard', { 
      replace: true,
      state: { from: 'home' }
    });
  };
  
  // Update query parameters
  const updateFilters = (filters) => {
    updateQueryParams(navigate, location, { 
      filter: filters.join(',')
    });
  };
  
  // Check user permissions
  if (hasRequiredRole(userRole, ['admin', 'board'])) {
    // Show admin content
  }
};
```

### `breadcrumb-utils.ts`
Breadcrumb generation and management utilities.

**Key Features:**
- Dynamic breadcrumb generation from routes
- Configurable breadcrumb display options
- Parameter substitution in breadcrumb labels
- Role-based breadcrumb filtering
- Breadcrumb transformations (case, truncation)
- Custom breadcrumb resolvers
- Navigation-based breadcrumb creation

**Common Usage:**
```typescript
import { generateBreadcrumbs, getBreadcrumbForRoute } from '../routing/utils';

const MyComponent = () => {
  const location = useLocation();
  
  // Generate breadcrumbs for current route
  const breadcrumbs = generateBreadcrumbs(location, {
    includeHome: true,
    includeCurrent: true,
    maxItems: 5,
  });
  
  // Get breadcrumb for specific route
  const breadcrumb = getBreadcrumbForRoute('/admin/users', {
    userId: '123'
  });
  
  return <BreadcrumbNav items={breadcrumbs} />;
};
```

### `analytics.ts`
Route analytics and tracking utilities.

**Key Features:**
- Route change tracking
- Page view analytics
- Navigation click tracking
- Performance metrics collection
- Error tracking
- Route guard analytics
- Google Analytics 4 integration
- Custom analytics provider support
- Session management

**Common Usage:**
```typescript
import { useAnalytics, withAnalytics } from '../routing/utils';

const MyComponent = () => {
  const analytics = useAnalytics();
  
  useEffect(() => {
    // Track page view
    analytics.trackPageView(location, routeMatch, userRole);
    
    // Track user interaction
    analytics.trackUserInteraction('button_click', location.pathname, userRole, {
      button_id: 'submit_form'
    });
  }, []);
  
  const handleClick = () => {
    analytics.trackNavigationClick('/next-page', location.pathname);
  };
};

// HOC for automatic analytics tracking
const TrackedComponent = withAnalytics(MyComponent, {
  trackPageView: true,
  trackInteractions: true,
});
```

### `error-boundaries.tsx`
Error boundary components and route error handling.

**Key Features:**
- Specialized error boundaries for different error types
- Route-specific error handling
- Automatic error recovery
- Error reporting and analytics
- Customizable error fallbacks
- Error context and provider
- Permission and guard error handling

**Common Usage:**
```typescript
import { 
  RouteErrorBoundary, 
  PermissionErrorBoundary,
  createRouteError 
} from '../routing/utils';

// Wrap components with error boundaries
<RouteErrorBoundary 
  fallback={CustomErrorFallback}
  enableAnalytics={true}
  onError={(error, info) => console.error(error)}
>
  <MyComponent />
</RouteErrorBoundary>

// Permission-specific error boundary
<PermissionErrorBoundary>
  <AdminPanel />
</PermissionErrorBoundary>

// Create custom route errors
const error = createRouteError(
  'User not authorized',
  'permission_denied',
  '/admin/settings',
  { userRole: 'member' }
);
```

### `index.ts`
Main export file that re-exports all utilities with proper TypeScript types.

**Key Exports:**
- All utility functions and types
- Type definitions
- Routing utilities getter
- Version information

## Configuration

### Analytics Configuration
```typescript
import { configureAnalytics } from '../routing/utils';

configureAnalytics({
  enableTracking: process.env.NODE_ENV === 'production',
  sampleRate: 100,
  excludedRoutes: ['/login', '/register'],
});
```

### Breadcrumb Configuration
```typescript
const breadcrumbConfig = {
  showHome: true,
  showCurrent: true,
  homeLabel: 'Home',
  separator: '>',
  maxLength: 50,
  enableClick: true,
  customLabels: {
    'users': 'User Management',
  },
};
```

### Error Boundary Configuration
```typescript
<RouteErrorBoundary
  fallback={MyCustomFallback}
  onError={(error, info) => {
    // Custom error handling
    console.error('Error caught:', error);
  }}
  resetOnPropsChange={true}
  enableAnalytics={true}
/>
```

## Integration Examples

### With React Router
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { analytics, configureAnalytics } from './routing/utils';

// Configure analytics on app start
configureAnalytics({
  enableTracking: true,
  trackPageViews: true,
});

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/dashboard" 
          element={
            <RouteErrorBoundary>
              <Dashboard />
            </RouteErrorBoundary>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### With Route Guards
```typescript
import { RouteErrorBoundary, createRouteError } from './routing/utils';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { userRole } = useAuth();
  
  if (!hasRequiredRole(userRole, [requiredRole])) {
    throw createRouteError(
      'Access denied',
      'permission_denied',
      window.location.pathname,
      { userRole, requiredRole }
    );
  }
  
  return (
    <RouteErrorBoundary>
      {children}
    </RouteErrorBoundary>
  );
};
```

### With Layout Components
```typescript
import { generateBreadcrumbs } from './routing/utils';

const Layout = ({ children }) => {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location, {
    includeHome: true,
  });
  
  return (
    <div>
      <BreadcrumbNav items={breadcrumbs} />
      <main>{children}</main>
    </div>
  );
};
```

## Best Practices

1. **Use appropriate error boundaries** for different error types
2. **Configure analytics** based on environment (dev/prod)
3. **Implement proper breadcrumb hierarchy** in route metadata
4. **Handle navigation errors** gracefully with fallbacks
5. **Track performance** for critical routes
6. **Use role-based filtering** for security-sensitive breadcrumbs
7. **Implement retry mechanisms** for recoverable errors
8. **Log errors** in development for debugging

## Error Types

- `navigation_error`: Issues with route transitions
- `component_error`: React component errors
- `route_guard_error`: Authentication/authorization failures
- `permission_denied`: Insufficient user permissions
- `network_error`: Network-related failures
- `unknown_error`: Unclassified errors

## Performance Considerations

1. **Lazy load** analytics providers when possible
2. **Batch analytics events** to reduce network calls
3. **Use React.memo** with tracked components
4. **Limit breadcrumb items** to prevent UI clutter
5. **Implement proper cleanup** in useEffect hooks
6. **Use debouncing** for analytics tracking

## Testing

When testing components that use these utilities:

```typescript
import { render, screen } from '@testing-library/react';
import { RouteErrorBoundary } from '../routing/utils';

test('handles errors gracefully', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  render(
    <RouteErrorBoundary>
      <ThrowError />
    </RouteErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## License

This routing utilities library is part of the main application codebase.

## Version

Current version: 1.0.0
