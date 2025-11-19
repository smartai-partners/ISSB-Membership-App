/**
 * useAppConfig Hook
 * Custom hook to initialize and manage application configuration
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConfigStore } from '@/stores/useConfigStore';
import { fetchUserConfig } from '@/services/configService';
import { useAuth } from '@/contexts/AuthContext';

// Import widget components to register them
import { DefaultMembershipStatusWidget } from '@/components/dashboard/widgets/DefaultMembershipStatusWidget';
import { PremiumMembershipStatusWidget } from '@/components/dashboard/widgets/PremiumMembershipStatusWidget';

export const useAppConfig = () => {
  const { user } = useAuth();
  const initializeConfig = useConfigStore((state) => state.initializeConfig);
  const registerComponent = useConfigStore((state) => state.registerComponent);
  const initialized = useConfigStore((state) => state.initialized);

  // Fetch configuration using React Query
  const {
    data: configData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userConfig', user?.id],
    queryFn: fetchUserConfig,
    enabled: !!user && !initialized, // Only fetch if user is authenticated and config not initialized
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
  });

  // Initialize config and register components when data is loaded
  useEffect(() => {
    if (configData && !initialized) {
      // Register all available components
      registerComponent('DefaultMembershipStatusWidget', DefaultMembershipStatusWidget);
      registerComponent('PremiumMembershipStatusWidget', PremiumMembershipStatusWidget);

      // Add more component registrations here as you create them
      // registerComponent('EnhancedVolunteerWidget', EnhancedVolunteerWidget);
      // registerComponent('AdminDashboardHeader', AdminDashboardHeader);

      // Initialize the configuration store
      initializeConfig({
        currentThemeId: configData.currentThemeId,
        themeVariables: configData.themeVariables,
        featureFlags: configData.featureFlags,
        componentMappings: configData.componentMappings,
        brandingAssets: configData.brandingAssets,
      });

      console.log('✅ App configuration initialized', {
        theme: configData.currentThemeId,
        flags: Object.keys(configData.featureFlags).length,
        components: Object.keys(configData.componentMappings).length,
      });
    }
  }, [configData, initialized, initializeConfig, registerComponent]);

  return {
    isLoading,
    isError,
    error,
    initialized,
    refetch,
  };
};
