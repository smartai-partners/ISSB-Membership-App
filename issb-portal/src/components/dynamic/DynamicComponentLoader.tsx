/**
 * DynamicComponentLoader Component
 * Dynamically renders components based on the component registry and mappings
 *
 * Usage:
 * // Direct component loading by ID
 * <DynamicComponentLoader componentId="PremiumMembershipWidget" {...props} />
 *
 * // Loading via logical mapping (uses componentMappings from config)
 * <DynamicComponentLoader mapping="MembershipStatusWidget" {...props} />
 *
 * // With fallback
 * <DynamicComponentLoader
 *   componentId="CustomWidget"
 *   fallback={<DefaultWidget />}
 *   {...props}
 * />
 */

import React, { Suspense } from 'react';
import { useConfigStore } from '@/stores/useConfigStore';
import { Loader2 } from 'lucide-react';

interface DynamicComponentLoaderProps {
  /**
   * Direct component ID from the component registry
   */
  componentId?: string;

  /**
   * Logical component name that maps to an actual component via componentMappings
   * Takes precedence over componentId if both are provided
   */
  mapping?: string;

  /**
   * Fallback component to render if the component is not found
   */
  fallback?: React.ReactNode;

  /**
   * Loading component to show while lazy loading (if using Suspense)
   */
  loading?: React.ReactNode;

  /**
   * Props to pass to the dynamically loaded component
   */
  [key: string]: any;
}

const DefaultLoading: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
  </div>
);

const DefaultFallback: React.FC<{ name?: string }> = ({ name }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
    <p className="font-medium">Component not found</p>
    {name && <p className="text-xs mt-1">Looking for: {name}</p>}
  </div>
);

export const DynamicComponentLoader: React.FC<DynamicComponentLoaderProps> = ({
  componentId,
  mapping,
  fallback,
  loading = <DefaultLoading />,
  ...props
}) => {
  const componentRegistry = useConfigStore((state) => state.componentRegistry);
  const componentMappings = useConfigStore((state) => state.componentMappings);
  const getComponentForMapping = useConfigStore((state) => state.getComponentForMapping);

  // Determine which component to render
  let Component: React.ComponentType<any> | undefined;
  let componentName: string | undefined;

  if (mapping) {
    // Use mapping first (higher priority)
    Component = getComponentForMapping(mapping);
    componentName = mapping;
  } else if (componentId) {
    // Fallback to direct component ID
    Component = componentRegistry[componentId];
    componentName = componentId;
  }

  // If component not found, render fallback or default fallback
  if (!Component) {
    return <>{fallback || <DefaultFallback name={componentName} />}</>;
  }

  // Render the component with Suspense for lazy-loaded components
  return (
    <Suspense fallback={loading}>
      <Component {...props} />
    </Suspense>
  );
};

/**
 * DynamicComponentSwitch Component
 * Renders different components based on a condition or feature flag
 *
 * Usage:
 * <DynamicComponentSwitch
 *   condition={isPremium}
 *   trueComponent="PremiumWidget"
 *   falseComponent="StandardWidget"
 *   {...props}
 * />
 */

interface DynamicComponentSwitchProps {
  /**
   * Condition to evaluate
   */
  condition: boolean;

  /**
   * Component ID to render when condition is true
   */
  trueComponent: string;

  /**
   * Component ID to render when condition is false
   */
  falseComponent: string;

  /**
   * Props to pass to the rendered component
   */
  [key: string]: any;
}

export const DynamicComponentSwitch: React.FC<DynamicComponentSwitchProps> = ({
  condition,
  trueComponent,
  falseComponent,
  ...props
}) => {
  const componentId = condition ? trueComponent : falseComponent;

  return <DynamicComponentLoader componentId={componentId} {...props} />;
};

/**
 * ConditionalComponentLoader Component
 * Loads component based on feature flag
 *
 * Usage:
 * <ConditionalComponentLoader
 *   feature="showPremiumFeatures"
 *   enabledComponent="PremiumWidget"
 *   disabledComponent="StandardWidget"
 *   {...props}
 * />
 */

interface ConditionalComponentLoaderProps {
  /**
   * Feature flag to check
   */
  feature: string;

  /**
   * Component ID when feature is enabled
   */
  enabledComponent: string;

  /**
   * Component ID when feature is disabled
   */
  disabledComponent: string;

  /**
   * Props to pass to the rendered component
   */
  [key: string]: any;
}

export const ConditionalComponentLoader: React.FC<ConditionalComponentLoaderProps> = ({
  feature,
  enabledComponent,
  disabledComponent,
  ...props
}) => {
  const isFeatureEnabled = useConfigStore((state) => state.isFeatureEnabled);
  const enabled = isFeatureEnabled(feature);

  const componentId = enabled ? enabledComponent : disabledComponent;

  return <DynamicComponentLoader componentId={componentId} {...props} />;
};
