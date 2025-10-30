/**
 * Route analytics and tracking utilities
 */

import { Location } from 'react-router-dom';
import { 
  RouteDefinition, 
  RouteMatch, 
  BreadcrumbItem,
  UserRole,
  RoutePermission 
} from '../routing-types';
import { getRouteByPath, getNavigationItems } from '../route-config';
import { generateBreadcrumbs } from './breadcrumb-utils';

// Analytics configuration
export interface AnalyticsConfig {
  enableTracking?: boolean;
  trackPageViews?: boolean;
  trackRouteChanges?: boolean;
  trackUserInteractions?: boolean;
  batchSize?: number;
  flushInterval?: number;
  retryAttempts?: number;
  customDimensions?: Record<string, any>;
  excludedRoutes?: string[];
  sampleRate?: number; // 0-100
}

// Route analytics event types
export type AnalyticsEventType = 
  | 'page_view'
  | 'route_change'
  | 'navigation_click'
  | 'breadcrumb_click'
  | 'route_error'
  | 'route_guard_triggered'
  | 'performance_metric'
  | 'user_interaction';

// Analytics event data
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  route?: string;
  previousRoute?: string;
  userRole?: UserRole;
  sessionId: string;
  userId?: string;
  data?: Record<string, any>;
  metadata?: {
    performance?: PerformanceMetrics;
    error?: Error;
    guardInfo?: GuardInfo;
  };
}

// Performance metrics
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  transitionDuration?: number;
  timeToFirstByte?: number;
  domContentLoaded?: number;
  pageLoaded?: number;
}

// Route guard information
export interface GuardInfo {
  guardType: 'auth' | 'role' | 'permission' | 'custom';
  result: 'allowed' | 'denied' | 'redirected';
  reason?: string;
  requiredRole?: UserRole;
  requiredPermissions?: RoutePermission[];
}

// Analytics provider interface
export interface AnalyticsProvider {
  trackEvent(event: AnalyticsEvent): Promise<void>;
  trackPageView(route: string, data?: Record<string, any>): Promise<void>;
  trackError(error: Error, context?: Record<string, any>): Promise<void>;
  flush(): Promise<void>;
  configure(config: AnalyticsConfig): void;
}

// Google Analytics 4 provider
class GoogleAnalyticsProvider implements AnalyticsProvider {
  private config: AnalyticsConfig = {};
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(measurementId?: string) {
    if (measurementId && typeof window !== 'undefined') {
      this.initializeGtag(measurementId);
    }
  }

  private initializeGtag(measurementId: string) {
    // Initialize gtag
    if (!window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', measurementId);
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.shouldTrackEvent(event)) return;

    try {
      if (window.gtag && this.config.enableTracking) {
        window.gtag('event', event.type, {
          event_category: 'routing',
          event_label: event.route,
          value: 1,
          custom_parameters: {
            session_id: event.sessionId,
            user_role: event.userRole,
            ...event.data,
          },
        });
      }
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  async trackPageView(route: string, data?: Record<string, any>): Promise<void> {
    if (this.isExcludedRoute(route)) return;

    const event: AnalyticsEvent = {
      type: 'page_view',
      timestamp: Date.now(),
      route,
      sessionId: this.getSessionId(),
      data,
    };

    this.eventQueue.push(event);
    await this.processEvent(event);
  }

  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    const event: AnalyticsEvent = {
      type: 'route_error',
      timestamp: Date.now(),
      route: context?.route,
      sessionId: this.getSessionId(),
      data: {
        error_message: error.message,
        error_stack: error.stack,
        ...context,
      },
      metadata: {
        error,
      },
    };

    this.eventQueue.push(event);
    await this.processEvent(event);
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Process events in batch
    for (const event of events) {
      await this.processEvent(event);
    }
  }

  configure(config: AnalyticsConfig): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.flushInterval) {
      this.startFlushTimer();
    }
  }

  private async processEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.shouldTrackEvent(event)) return;

    try {
      if (window.gtag && this.config.enableTracking) {
        switch (event.type) {
          case 'page_view':
            window.gtag('config', 'GA_MEASUREMENT_ID', {
              page_path: event.route,
              page_title: event.data?.title,
            });
            break;
          
          case 'route_error':
            window.gtag('event', 'exception', {
              description: event.metadata?.error?.message,
              fatal: false,
            });
            break;

          default:
            window.gtag('event', event.type, event.data);
        }
      }
    } catch (error) {
      console.warn('Failed to process analytics event:', error);
    }
  }

  private shouldTrackEvent(event: AnalyticsEvent): boolean {
    if (!this.config.enableTracking) return false;
    if (this.isExcludedRoute(event.route || '')) return false;
    if (this.config.sampleRate && Math.random() * 100 > this.config.sampleRate) return false;
    
    return true;
  }

  private isExcludedRoute(route: string): boolean {
    return this.config.excludedRoutes?.includes(route) || false;
  }

  private getSessionId(): string {
    return sessionStorage.getItem('analytics_session_id') || this.createSessionId();
  }

  private createSessionId(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
    return sessionId;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }
}

// Console analytics provider for development
class ConsoleAnalyticsProvider implements AnalyticsProvider {
  private config: AnalyticsConfig = {};

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Event]', event);
    }
  }

  async trackPageView(route: string, data?: Record<string, any>): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Page View]', { route, data });
    }
  }

  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    console.error('[Route Error]', { error, context });
  }

  async flush(): Promise<void> {
    // No-op for console provider
  }

  configure(config: AnalyticsConfig): void {
    this.config = config;
  }
}

// Analytics service
class AnalyticsService {
  private provider: AnalyticsProvider;
  private config: AnalyticsConfig = {
    enableTracking: process.env.NODE_ENV === 'production',
    trackPageViews: true,
    trackRouteChanges: true,
    trackUserInteractions: true,
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    retryAttempts: 3,
    sampleRate: 100,
  };

  private sessionId: string;
  private routeHistory: string[] = [];

  constructor(provider?: AnalyticsProvider) {
    this.provider = provider || new ConsoleAnalyticsProvider();
    this.sessionId = this.generateSessionId();
    this.provider.configure(this.config);
  }

  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    this.provider.configure(this.config);
  }

  async trackRouteChange(
    from: string,
    to: string,
    userRole?: UserRole,
    additionalData?: Record<string, any>
  ): Promise<void> {
    if (!this.config.trackRouteChanges) return;

    const event: AnalyticsEvent = {
      type: 'route_change',
      timestamp: Date.now(),
      route: to,
      previousRoute: from,
      userRole,
      sessionId: this.sessionId,
      data: {
        transition_type: this.getTransitionType(from, to),
        ...additionalData,
      },
    };

    await this.provider.trackEvent(event);
    
    // Update route history
    this.routeHistory.push(to);
    if (this.routeHistory.length > 50) {
      this.routeHistory.shift();
    }
  }

  async trackPageView(
    location: Location,
    routeMatch?: RouteMatch,
    userRole?: UserRole,
    userId?: string
  ): Promise<void> {
    if (!this.config.trackPageViews) return;

    const breadcrumbs = generateBreadcrumbs(location);
    
    const event: AnalyticsEvent = {
      type: 'page_view',
      timestamp: Date.now(),
      route: location.pathname,
      userRole,
      userId,
      sessionId: this.sessionId,
      data: {
        breadcrumbs,
        query: Object.fromEntries(new URLSearchParams(location.search)),
        route_metadata: routeMatch?.route?.metadata,
        referrer: document.referrer,
      },
    };

    await this.provider.trackEvent(event);
  }

  async trackNavigationClick(
    targetRoute: string,
    sourceRoute: string,
    userRole?: UserRole,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      type: 'navigation_click',
      timestamp: Date.now(),
      route: targetRoute,
      previousRoute: sourceRoute,
      userRole,
      sessionId: this.sessionId,
      data: metadata,
    };

    await this.provider.trackEvent(event);
  }

  async trackBreadcrumbClick(
    breadcrumb: BreadcrumbItem,
    userRole?: UserRole,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      type: 'breadcrumb_click',
      timestamp: Date.now(),
      route: breadcrumb.path,
      sessionId: this.sessionId,
      userRole,
      data: {
        breadcrumb_label: breadcrumb.label,
        ...metadata,
      },
    };

    await this.provider.trackEvent(event);
  }

  async trackRouteError(
    error: Error,
    route: string,
    userRole?: UserRole,
    context?: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      type: 'route_error',
      timestamp: Date.now(),
      route,
      userRole,
      sessionId: this.sessionId,
      data: context,
      metadata: { error },
    };

    await this.provider.trackError(error, { route, ...context });
    await this.provider.trackEvent(event);
  }

  async trackRouteGuard(
    guardType: 'auth' | 'role' | 'permission' | 'custom',
    result: 'allowed' | 'denied' | 'redirected',
    route: string,
    userRole?: UserRole,
    guardInfo?: Partial<GuardInfo>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      type: 'route_guard_triggered',
      timestamp: Date.now(),
      route,
      userRole,
      sessionId: this.sessionId,
      data: {
        guard_type: guardType,
        result,
        ...guardInfo,
      },
      metadata: {
        guardInfo: {
          guardType,
          result,
          ...guardInfo,
        } as GuardInfo,
      },
    };

    await this.provider.trackEvent(event);
  }

  async trackPerformance(
    route: string,
    metrics: PerformanceMetrics,
    userRole?: UserRole
  ): Promise<void> {
    const event: AnalyticsEvent = {
      type: 'performance_metric',
      timestamp: Date.now(),
      route,
      userRole,
      sessionId: this.sessionId,
      data: metrics,
      metadata: { performance: metrics },
    };

    await this.provider.trackEvent(event);
  }

  async trackUserInteraction(
    interaction: string,
    route: string,
    userRole?: UserRole,
    data?: Record<string, any>
  ): Promise<void> {
    if (!this.config.trackUserInteractions) return;

    const event: AnalyticsEvent = {
      type: 'user_interaction',
      timestamp: Date.now(),
      route,
      userRole,
      sessionId: this.sessionId,
      data: {
        interaction_type: interaction,
        ...data,
      },
    };

    await this.provider.trackEvent(event);
  }

  // Utility methods
  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTransitionType(from: string, to: string): string {
    if (from === to) return 'refresh';
    if (to.startsWith(from)) return 'deep_link';
    if (from.startsWith(to)) return 'navigate_up';
    return 'navigate';
  }

  // Public utility methods
  getRouteHistory(): string[] {
    return [...this.routeHistory];
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async flush(): Promise<void> {
    await this.provider.flush();
  }
}

// Create global analytics service instance
export const analytics = new AnalyticsService();

// React hooks for analytics
export const useAnalytics = () => {
  return {
    trackRouteChange: analytics.trackRouteChange.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackNavigationClick: analytics.trackNavigationClick.bind(analytics),
    trackBreadcrumbClick: analytics.trackBreadcrumbClick.bind(analytics),
    trackRouteError: analytics.trackRouteError.bind(analytics),
    trackRouteGuard: analytics.trackRouteGuard.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackUserInteraction: analytics.trackUserInteraction.bind(analytics),
    flush: analytics.flush.bind(analytics),
  };
};

// Higher-order component for automatic analytics tracking
export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    trackPageView?: boolean;
    trackInteractions?: boolean;
    customTracker?: (props: P) => void;
  } = {}
) => {
  const WrappedComponent = (props: P) => {
    const analyticsInstance = useAnalytics();

    React.useEffect(() => {
      if (options.trackPageView) {
        analyticsInstance.trackPageView(window.location);
      }
    }, []);

    React.useEffect(() => {
      if (options.customTracker) {
        options.customTracker(props);
      }
    }, [props]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Route performance tracker
export class RoutePerformanceTracker {
  private startTime: number = 0;
  private routeStartTimes: Map<string, number> = new Map();

  startTracking(route: string): void {
    this.routeStartTimes.set(route, performance.now());
  }

  endTracking(route: string, analyticsInstance?: AnalyticsService): PerformanceMetrics | null {
    const startTime = this.routeStartTimes.get(route);
    if (!startTime) return null;

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    const metrics: PerformanceMetrics = {
      loadTime,
      renderTime: loadTime,
    };

    if (analyticsInstance) {
      analyticsInstance.trackPerformance(route, metrics);
    }

    this.routeStartTimes.delete(route);
    return metrics;
  }

  measureNavigation(from: string, to: string): PerformanceMetrics {
    const navigationStart = performance.now();
    
    return {
      loadTime: 0,
      renderTime: 0,
      transitionDuration: 0,
    };
  }
}

// Export analytics provider factory
export const createAnalyticsProvider = (
  type: 'google' | 'console' | 'custom',
  config?: any
): AnalyticsProvider => {
  switch (type) {
    case 'google':
      return new GoogleAnalyticsProvider(config?.measurementId);
    case 'console':
      return new ConsoleAnalyticsProvider();
    case 'custom':
      return config?.provider;
    default:
      return new ConsoleAnalyticsProvider();
  }
};

// Configure analytics with environment variables
export const configureAnalytics = (config: Partial<AnalyticsConfig> = {}) => {
  const envConfig: Partial<AnalyticsConfig> = {
    enableTracking: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
    sampleRate: parseInt(process.env.REACT_APP_ANALYTICS_SAMPLE_RATE || '100'),
    excludedRoutes: process.env.REACT_APP_ANALYTICS_EXCLUDED_ROUTES?.split(',') || [],
  };

  analytics.configure({ ...envConfig, ...config });
};

// Initialize analytics on app start
if (typeof window !== 'undefined') {
  configureAnalytics();
}

// Export types
export type { 
  AnalyticsConfig, 
  AnalyticsEvent, 
  AnalyticsEventType, 
  PerformanceMetrics,
  GuardInfo,
  AnalyticsProvider 
};
