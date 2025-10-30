/**
 * Route error boundaries and error handling components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  RouteDefinition, 
  RouteMatch, 
  BreadcrumbItem,
  DEFAULT_ROUTES 
} from '../routing-types';
import { generateBreadcrumbs } from './breadcrumb-utils';
import { analytics } from './analytics';

// Error boundary configuration
export interface ErrorBoundaryConfig {
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo, context?: any) => void;
  resetOnPropsChange?: boolean;
  resetOnRouteChange?: boolean;
  logErrors?: boolean;
  retryAttempts?: number;
  enableAnalytics?: boolean;
}

// Error information interface
export interface RouteErrorInfo {
  route: string;
  previousRoute?: string;
  userRole?: string;
  breadcrumbs: BreadcrumbItem[];
  timestamp: number;
  userAgent: string;
  url: string;
  errorId: string;
}

// Error types
export type RouteErrorType = 
  | 'navigation_error'
  | 'component_error'
  | 'route_guard_error'
  | 'permission_denied'
  | 'network_error'
  | 'unknown_error';

// Route error class
export class RouteError extends Error {
  public readonly type: RouteErrorType;
  public readonly route: string;
  public readonly previousRoute?: string;
  public readonly userRole?: string;
  public readonly errorInfo: RouteErrorInfo;
  public readonly isRecoverable: boolean;

  constructor(
    message: string,
    type: RouteErrorType,
    route: string,
    context?: Partial<RouteErrorInfo>
  ) {
    super(message);
    this.name = 'RouteError';
    this.type = type;
    this.route = route;
    this.previousRoute = context?.previousRoute;
    this.userRole = context?.userRole;
    
    this.errorInfo = {
      route,
      previousRoute: context?.previousRoute,
      userRole: context?.userRole,
      breadcrumbs: context?.breadcrumbs || [],
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...context,
    };

    this.isRecoverable = this.determineRecoverability();
  }

  private determineRecoverability(): boolean {
    return ![
      'permission_denied',
      'route_guard_error',
    ].includes(this.type);
  }
}

// Error boundary props
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  context?: Record<string, any>;
}

// Error fallback props
export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  errorInfo?: ErrorInfo;
  errorId?: string;
  breadcrumbs?: BreadcrumbItem[];
  onGoHome?: () => void;
  onGoBack?: () => void;
  onReport?: (error: RouteError) => void;
}

// Default error fallback component
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  errorInfo,
  breadcrumbs = [],
  onGoHome,
  onGoBack,
  onReport,
}) => {
  const isRouteError = error instanceof RouteError;
  const errorType = isRouteError ? (error as RouteError).type : 'unknown_error';

  const handleReport = () => {
    if (isRouteError && onReport) {
      onReport(error as RouteError);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {getErrorTitle(errorType)}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(errorType, error.message)}
          </p>

          {/* Breadcrumbs if available */}
          {breadcrumbs.length > 0 && (
            <nav className="mt-4 flex justify-center" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {breadcrumbs.map((item, index) => (
                  <li key={index} className="inline-flex items-center">
                    {index > 0 && (
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span className="text-gray-500 text-sm">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto">
                <p className="text-red-600">{error.message}</p>
                {error.stack && (
                  <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
                )}
                {errorInfo?.componentStack && (
                  <pre className="mt-2 whitespace-pre-wrap text-blue-600">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            
            <button
              onClick={onGoBack}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
            
            <button
              onClick={onGoHome}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </button>
          </div>

          {/* Report button for route errors */}
          {isRouteError && onReport && (
            <button
              onClick={handleReport}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Report this error
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Get error title based on type
const getErrorTitle = (type: RouteErrorType): string => {
  switch (type) {
    case 'navigation_error':
      return 'Navigation Error';
    case 'component_error':
      return 'Component Error';
    case 'route_guard_error':
      return 'Access Denied';
    case 'permission_denied':
      return 'Permission Denied';
    case 'network_error':
      return 'Network Error';
    default:
      return 'Something Went Wrong';
  }
};

// Get error message based on type
const getErrorMessage = (type: RouteErrorType, originalMessage: string): string => {
  switch (type) {
    case 'navigation_error':
      return 'There was a problem navigating to this page. Please try again.';
    case 'component_error':
      return 'This page encountered an error while loading.';
    case 'route_guard_error':
      return 'You do not have permission to access this page.';
    case 'permission_denied':
      return 'You do not have the required permissions to access this resource.';
    case 'network_error':
      return 'There was a network error while loading this page.';
    default:
      return originalMessage || 'An unexpected error occurred. Please try again.';
  }
};

// Generic route error boundary component
export class RouteErrorBoundary extends Component<ErrorBoundaryProps, { 
  hasError: boolean; 
  error: Error | null; 
  errorInfo: ErrorInfo | null;
}> {
  private retryCount = 0;
  private maxRetries: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    
    this.maxRetries = props.context?.retryAttempts || 3;
  }

  static getDerivedStateFromError(error: Error): Partial<{
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
  }> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { 
      onError, 
      enableLogging = process.env.NODE_ENV === 'development',
      enableAnalytics = true,
      context = {}
    } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Log error
    if (enableLogging) {
      console.error('Route Error Boundary caught an error:', error, errorInfo);
    }

    // Track analytics
    if (enableAnalytics) {
      const routeError = new RouteError(
        error.message,
        'component_error',
        window.location.pathname,
        {
          breadcrumbs: generateBreadcrumbs(window.location),
          ...context,
        }
      );

      analytics.trackRouteError(
        routeError,
        window.location.pathname,
        context.userRole,
        {
          component_stack: errorInfo.componentStack,
          retry_count: this.retryCount,
        }
      );
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { hasError, error } = this.state;
    const { resetOnPropsChange = true } = this.props;

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.reset();
    }
  }

  reset = (): void => {
    this.retryCount++;
    
    if (this.retryCount <= this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    } else {
      // Max retries exceeded, redirect to safe route
      if (typeof window !== 'undefined') {
        window.location.href = DEFAULT_ROUTES.DASHBOARD;
      }
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { 
      children, 
      fallback: Fallback = DefaultErrorFallback,
      context = {}
    } = this.props;

    if (hasError && error) {
      const breadcrumbs = generateBreadcrumbs(window.location);
      
      return (
        <Fallback
          error={error}
          errorInfo={errorInfo}
          resetErrorBoundary={this.reset}
          breadcrumbs={breadcrumbs}
          onGoHome={() => window.location.href = DEFAULT_ROUTES.ROOT}
          onGoBack={() => window.history.back()}
          onReport={(routeError: RouteError) => {
            analytics.trackUserInteraction(
              'error_report',
              window.location.pathname,
              context.userRole,
              {
                error_id: routeError.errorInfo.errorId,
                error_type: routeError.type,
              }
            );
          }}
        />
      );
    }

    return children;
  }
}

// Specialized error boundaries
export class NavigationErrorBoundary extends Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const routeError = new RouteError(
      error.message,
      'navigation_error',
      window.location.pathname
    );

    analytics.trackRouteError(
      routeError,
      window.location.pathname,
      this.props.context?.userRole
    );
  }

  render() {
    return (
      <RouteErrorBoundary
        {...this.props}
        fallback={(props) => (
          <DefaultErrorFallback
            {...props}
            errorId={`nav_${Date.now()}`}
          />
        )}
      />
    );
  }
}

export class ComponentErrorBoundary extends Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const routeError = new RouteError(
      error.message,
      'component_error',
      window.location.pathname,
      {
        component_stack: errorInfo.componentStack,
      }
    );

    analytics.trackRouteError(
      routeError,
      window.location.pathname,
      this.props.context?.userRole
    );
  }

  render() {
    return (
      <RouteErrorBoundary
        {...this.props}
        fallback={(props) => (
          <DefaultErrorFallback
            {...props}
            errorId={`comp_${Date.now()}`}
          />
        )}
      />
    );
  }
}

// Route guard error boundary
export class GuardErrorBoundary extends Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const routeError = new RouteError(
      error.message,
      'route_guard_error',
      window.location.pathname
    );

    analytics.trackRouteError(
      routeError,
      window.location.pathname,
      this.props.context?.userRole
    );
  }

  render() {
    return (
      <RouteErrorBoundary
        {...this.props}
        fallback={(props) => (
          <DefaultErrorFallback
            {...props}
            errorId={`guard_${Date.now()}`}
          />
        )}
      />
    );
  }
}

// Permission error boundary
export class PermissionErrorBoundary extends Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const routeError = new RouteError(
      error.message,
      'permission_denied',
      window.location.pathname
    );

    analytics.trackRouteError(
      routeError,
      window.location.pathname,
      this.props.context?.userRole
    );
  }

  render() {
    return (
      <RouteErrorBoundary
        {...this.props}
        fallback={(props) => (
          <DefaultErrorFallback
            {...props}
            errorId={`perm_${Date.now()}`}
          />
        )}
      />
    );
  }
}

// Network error boundary
export class NetworkErrorBoundary extends Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const routeError = new RouteError(
      error.message,
      'network_error',
      window.location.pathname
    );

    analytics.trackRouteError(
      routeError,
      window.location.pathname,
      this.props.context?.userRole
    );
  }

  render() {
    return (
      <RouteErrorBoundary
        {...this.props}
        fallback={(props) => (
          <DefaultErrorFallback
            {...props}
            errorId={`net_${Date.now()}`}
          />
        )}
      />
    );
  }
}

// Error boundary provider for context
export interface ErrorBoundaryContextType {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  reset: () => void;
  reportError: (error: RouteError) => void;
}

export const ErrorBoundaryContext = React.createContext<ErrorBoundaryContextType | null>(null);

export const ErrorBoundaryProvider: React.FC<{
  children: ReactNode;
  config?: ErrorBoundaryConfig;
}> = ({ children, config = {} }) => {
  const [state, setState] = React.useState<{
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
  }>({
    hasError: false,
    error: null,
    errorInfo: null,
  });

  const reset = React.useCallback(() => {
    setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  }, []);

  const reportError = React.useCallback((routeError: RouteError) => {
    analytics.trackUserInteraction(
      'error_report',
      routeError.route,
      routeError.userRole,
      {
        error_id: routeError.errorInfo.errorId,
        error_type: routeError.type,
      }
    );
  }, []);

  const value = React.useMemo(() => ({
    ...state,
    reset,
    reportError,
  }), [state, reset, reportError]);

  return (
    <ErrorBoundaryContext.Provider value={value}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
};

// Hook to use error boundary context
export const useErrorBoundary = () => {
  const context = React.useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useErrorBoundary must be used within an ErrorBoundaryProvider');
  }
  return context;
};

// Utility functions
export const createRouteError = (
  message: string,
  type: RouteErrorType,
  route: string,
  context?: Partial<RouteErrorInfo>
): RouteError => {
  return new RouteError(message, type, route, context);
};

export const isRecoverableError = (error: Error): boolean => {
  if (error instanceof RouteError) {
    return error.isRecoverable;
  }
  return true; // Most component errors are recoverable
};

export const getErrorTypeFromError = (error: Error): RouteErrorType => {
  if (error instanceof RouteError) {
    return error.type;
  }
  return 'unknown_error';
};

// HOC for automatic error boundary wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Partial<ErrorBoundaryConfig>
) => {
  const WrappedComponent = (props: P) => (
    <RouteErrorBoundary
      fallback={errorBoundaryConfig?.fallbackComponent}
      enableAnalytics={errorBoundaryConfig?.enableAnalytics}
    >
      <Component {...props} />
    </RouteErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Export types
export type { 
  ErrorBoundaryConfig, 
  RouteErrorInfo, 
  RouteErrorType,
  ErrorBoundaryProps,
  ErrorFallbackProps 
};
