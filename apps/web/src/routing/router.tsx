/**
 * Main router configuration
 */

import React, { Suspense, lazy } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';

import { routeConfig, getRouteByPath, getNavigationItems } from './route-config';
import { 
  ProtectedRoute, 
  RoleRoute, 
  PermissionRoute,
  CompositeRouteGuard 
} from './route-guards';
import { 
  RouterConfig, 
  RouteDefinition, 
  RouteMatch, 
  BreadcrumbItem,
  UserRole,
  DEFAULT_ROUTES 
} from './routing-types';

// Layout components
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { BoardLayout } from '../layouts/BoardLayout';
import { MemberLayout } from '../layouts/MemberLayout';
import { Layout } from '../components/layout/Layout';

// UI Components
import { ErrorFallback } from '../components/ui/ErrorFallback';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Error component
const ErrorPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-red-600">Oops!</h1>
      <p className="text-xl text-gray-600 mt-4">Something went wrong.</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reload Page
      </button>
    </div>
  </div>
);

// Page transition wrapper
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Layout wrapper component
interface LayoutWrapperProps {
  children: React.ReactNode;
  layout?: string;
  userRole?: UserRole;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ 
  children, 
  layout, 
  userRole 
}) => {
  const getLayoutComponent = () => {
    switch (layout) {
      case 'auth':
        return AuthLayout;
      case 'admin':
        return AdminLayout;
      case 'board':
        return BoardLayout;
      case 'member':
        return MemberLayout;
      case 'public':
      default:
        return Layout;
    }
  };

  const LayoutComponent = getLayoutComponent();
  
  return (
    <LayoutComponent>
      <PageTransition>
        {children}
      </PageTransition>
    </LayoutComponent>
  );
};

// Route renderer component
interface RouteRendererProps {
  route: RouteDefinition;
  userRole?: UserRole;
}

const RouteRenderer: React.FC<RouteRendererProps> = ({ route, userRole }) => {
  const Component = lazy(route.component);
  const metadata = route.metadata;

  const guardProps = {
    requireAuth: metadata?.requiresAuth || false,
    requireRole: metadata?.allowedRoles,
    requirePermissions: metadata?.requiredPermissions,
    fallback: metadata?.errorComponent ? 
      lazy(() => import(`../components/${metadata.errorComponent}`)) : 
      <ErrorPage />,
    loadingFallback: metadata?.loadingComponent ? 
      lazy(() => import(`../components/${metadata.loadingComponent}`)) : 
      <LoadingSpinner />,
  };

  const routeContent = (
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  );

  // Apply appropriate guards based on metadata
  if (metadata?.requiresAuth && metadata?.allowedRoles) {
    return (
      <RoleRoute allowedRoles={metadata.allowedRoles} {...guardProps}>
        <LayoutWrapper 
          layout={metadata.layout} 
          userRole={userRole}
        >
          {routeContent}
        </LayoutWrapper>
      </RoleRoute>
    );
  }

  if (metadata?.requiresAuth) {
    return (
      <ProtectedRoute {...guardProps}>
        <LayoutWrapper 
          layout={metadata.layout} 
          userRole={userRole}
        >
          {routeContent}
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <LayoutWrapper 
      layout={metadata?.layout} 
      userRole={userRole}
    >
      {routeContent}
    </LayoutWrapper>
  );
};

// Recursive route builder
interface RouteBuilderProps {
  routes: RouteDefinition[];
  userRole?: UserRole;
  parentPath?: string;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({ 
  routes, 
  userRole, 
  parentPath = '' 
}) => {
  return (
    <Routes>
      {routes.map((route, index) => {
        const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path;
        const hasChildren = route.children && route.children.length > 0;

        return (
          <React.Fragment key={`${fullPath}-${index}`}>
            <Route
              path={route.path}
              element={
                <RouteRenderer route={route} userRole={userRole} />
              }
              errorElement={<ErrorPage />}
            />
            
            {/* Nested routes */}
            {hasChildren && (
              <RouteBuilder 
                routes={route.children!} 
                userRole={userRole}
                parentPath={fullPath}
              />
            )}
          </React.Fragment>
        );
      })}
      
      {/* Catch all route for 404 */}
      <Route
        path="*"
        element={
          <LayoutWrapper layout="public">
            <ErrorPage />
          </LayoutWrapper>
        }
      />
    </Routes>
  );
};

// Main router component
interface AppRouterProps {
  config?: RouterConfig;
}

export const AppRouter: React.FC<AppRouterProps> = ({ config = {} }) => {
  const {
    basePath = '',
    notFoundPath = DEFAULT_ROUTES.NOT_FOUND,
    defaultRedirect = DEFAULT_ROUTES.DASHBOARD,
    enableLogging = process.env.NODE_ENV === 'development',
    scrollToTop = true,
  } = config;

  const handleLocationChange = React.useCallback((location: any) => {
    if (enableLogging) {
      console.log('Route changed:', location.pathname, location.state);
    }
    
    if (scrollToTop) {
      window.scrollTo(0, 0);
    }
  }, [enableLogging, scrollToTop]);

  React.useEffect(() => {
    // Listen for route changes
    const handlePopState = () => {
      handleLocationChange(window.location);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleLocationChange]);

  return (
    <BrowserRouter basename={basePath}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          if (enableLogging) {
            console.error('Router Error:', error, errorInfo);
          }
        }}
      >
        <AnimatePresence mode="wait">
          <Routes>
            {/* Default redirect */}
            <Route 
              path={DEFAULT_ROUTES.ROOT}
              element={<Navigate to={defaultRedirect} replace />}
            />
            
            {/* Build all routes */}
            <RouteBuilder routes={routeConfig} />
          </Routes>
        </AnimatePresence>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

// Router context for navigation
export const useRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = React.useCallback((path: string, options?: any) => {
    navigate(path, options);
  }, [navigate]);

  const goBack = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goForward = React.useCallback(() => {
    navigate(1);
  }, [navigate]);

  const getCurrentRoute = React.useCallback((): RouteMatch | null => {
    const route = getRouteByPath(location.pathname);
    if (!route) return null;

    return {
      route,
      params: {}, // Would be populated by route parameters
      query: Object.fromEntries(new URLSearchParams(location.search)),
      isActive: true,
      isExactMatch: location.pathname === route.path,
    };
  }, [location.pathname, location.search]);

  const getBreadcrumbs = React.useCallback((): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const route = getRouteByPath(currentPath);
      
      if (route?.metadata?.breadcrumb) {
        breadcrumbs.push({
          label: route.metadata.breadcrumb,
          path: index === pathSegments.length - 1 ? undefined : currentPath,
          icon: route.metadata.icon,
        });
      }
    });

    return breadcrumbs;
  }, [location.pathname]);

  const isActiveRoute = React.useCallback((path: string): boolean => {
    return location.pathname === path;
  }, [location.pathname]);

  const isSubRouteActive = React.useCallback((path: string): boolean => {
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  return {
    navigate: goTo,
    location,
    goBack,
    goForward,
    getCurrentRoute,
    getBreadcrumbs,
    isActiveRoute,
    isSubRouteActive,
    history: {
      length: window.history.length,
      state: window.history.state,
    },
  };
};

// Higher-order component for route-aware components
export const withRouter = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => {
    const router = useRouter();
    return <Component {...props} router={router} />;
  };

  WrappedComponent.displayName = `withRouter(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Route configuration utilities
export const getRouteConfiguration = () => ({
  routes: routeConfig,
  getRouteByPath,
  getNavigationItems,
  getRouteMetadata: (path: string) => getRouteByPath(path)?.metadata,
});

// Default export
export default AppRouter;

// Export types for external use
export type { AppRouterProps, RouteRendererProps, LayoutWrapperProps };