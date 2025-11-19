/**
 * FeatureToggle Component
 * Conditionally renders children based on feature flags from the config store
 *
 * Usage:
 * <FeatureToggle feature="showPremiumFeatures">
 *   <PremiumContent />
 * </FeatureToggle>
 *
 * <FeatureToggle feature="showAdminPanel" fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </FeatureToggle>
 */

import React from 'react';
import { useConfigStore } from '@/stores/useConfigStore';

interface FeatureToggleProps {
  /**
   * The feature flag key to check
   */
  feature: string;

  /**
   * Content to render when feature is enabled
   */
  children: React.ReactNode;

  /**
   * Optional content to render when feature is disabled
   */
  fallback?: React.ReactNode;

  /**
   * If true, inverts the logic (renders children when feature is disabled)
   */
  invert?: boolean;

  /**
   * Optional loading state while config is initializing
   */
  loading?: React.ReactNode;
}

export const FeatureToggle: React.FC<FeatureToggleProps> = ({
  feature,
  children,
  fallback = null,
  invert = false,
  loading = null,
}) => {
  const initialized = useConfigStore((state) => state.initialized);
  const isFeatureEnabled = useConfigStore((state) => state.isFeatureEnabled);

  // Show loading state if config is not initialized yet
  if (!initialized && loading) {
    return <>{loading}</>;
  }

  const enabled = isFeatureEnabled(feature);
  const shouldRender = invert ? !enabled : enabled;

  if (shouldRender) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * FeatureValue Component
 * Renders different content based on the specific value of a feature flag
 *
 * Usage:
 * <FeatureValue feature="userTier">
 *   {(value) => {
 *     if (value === 'premium') return <PremiumBadge />;
 *     if (value === 'gold') return <GoldBadge />;
 *     return <StandardBadge />;
 *   }}
 * </FeatureValue>
 */

interface FeatureValueProps {
  /**
   * The feature flag key to check
   */
  feature: string;

  /**
   * Render function that receives the feature value
   */
  children: (value: boolean | string | number | undefined) => React.ReactNode;
}

export const FeatureValue: React.FC<FeatureValueProps> = ({ feature, children }) => {
  const getFeatureValue = useConfigStore((state) => state.getFeatureValue);
  const value = getFeatureValue(feature);

  return <>{children(value)}</>;
};

/**
 * MultiFeatureToggle Component
 * Renders children only if ALL specified features are enabled
 *
 * Usage:
 * <MultiFeatureToggle features={['isPremium', 'hasAccess', 'isVerified']}>
 *   <ExclusiveContent />
 * </MultiFeatureToggle>
 */

interface MultiFeatureToggleProps {
  /**
   * Array of feature flag keys - all must be enabled
   */
  features: string[];

  /**
   * Content to render when all features are enabled
   */
  children: React.ReactNode;

  /**
   * Optional content to render when any feature is disabled
   */
  fallback?: React.ReactNode;

  /**
   * If true, renders children if ANY feature is enabled (OR logic instead of AND)
   */
  any?: boolean;
}

export const MultiFeatureToggle: React.FC<MultiFeatureToggleProps> = ({
  features,
  children,
  fallback = null,
  any = false,
}) => {
  const isFeatureEnabled = useConfigStore((state) => state.isFeatureEnabled);

  const shouldRender = any
    ? features.some((feature) => isFeatureEnabled(feature))
    : features.every((feature) => isFeatureEnabled(feature));

  if (shouldRender) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
