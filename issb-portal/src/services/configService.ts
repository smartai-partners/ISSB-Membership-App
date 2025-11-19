/**
 * Configuration Service
 * Handles fetching and caching of user-specific application configuration
 */

import { supabase } from '@/lib/supabase';
import type { FeatureFlags, ThemeVariables, ComponentMappings, BrandingAssets } from '@/stores/useConfigStore';

export interface UserConfigResponse {
  currentThemeId: string;
  themeVariables: ThemeVariables;
  featureFlags: FeatureFlags;
  componentMappings: ComponentMappings;
  brandingAssets: BrandingAssets;
}

export interface UserConfigMetadata {
  userId: string;
  role: string;
  membershipStatus: string;
  generatedAt: string;
}

export interface ConfigServiceResponse {
  success: boolean;
  data: UserConfigResponse;
  metadata: UserConfigMetadata;
}

/**
 * Fetches user-specific configuration from the backend
 */
export const fetchUserConfig = async (): Promise<UserConfigResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke<ConfigServiceResponse>('get-user-config');

    if (error) {
      console.error('Error fetching user config:', error);
      throw new Error(`Failed to fetch configuration: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error('Invalid configuration response from server');
    }

    return data.data;
  } catch (error: any) {
    console.error('Configuration service error:', error);
    // Return default configuration on error
    return {
      currentThemeId: 'default',
      themeVariables: {
        '--primary-color': '#16a34a',
        '--secondary-color': '#059669',
      },
      featureFlags: {
        // Safe defaults - most features enabled
        showDonationPortal: true,
        showVolunteerPortal: true,
        showEventsPortal: true,
        showRecommendations: true,
        showAIAssistant: true,
      },
      componentMappings: {
        MembershipStatusWidget: 'DefaultMembershipStatusWidget',
      },
      brandingAssets: {
        logoUrl: '/images/issb-logo.png',
        primaryColor: '#16a34a',
      },
    };
  }
};

/**
 * Refreshes the configuration (useful when user role or membership changes)
 */
export const refreshUserConfig = async (): Promise<UserConfigResponse> => {
  // Add cache-busting parameter
  const timestamp = new Date().getTime();
  const { data, error } = await supabase.functions.invoke<ConfigServiceResponse>(
    `get-user-config?t=${timestamp}`
  );

  if (error || !data || !data.success) {
    throw new Error('Failed to refresh configuration');
  }

  return data.data;
};
