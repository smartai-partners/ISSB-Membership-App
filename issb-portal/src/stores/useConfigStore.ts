/**
 * Configuration Store (Zustand)
 * Manages global application configuration including:
 * - Feature flags
 * - Theme variables
 * - Component mappings for dynamic component swapping
 * - Branding assets
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface FeatureFlags {
  [key: string]: boolean | string | number;
}

export interface ThemeVariables {
  [key: string]: string;
}

export interface ComponentMap {
  [key: string]: React.ComponentType<any>;
}

export interface ComponentMappings {
  [logicalName: string]: string; // Maps logical component names to actual component IDs
}

export interface BrandingAssets {
  logoUrl?: string;
  primaryColor?: string;
  sponsorLogoUrl?: string;
  customCtaText?: string;
}

interface ConfigState {
  // Configuration data
  currentThemeId: string;
  themeVariables: ThemeVariables;
  featureFlags: FeatureFlags;
  componentMappings: ComponentMappings;
  componentRegistry: ComponentMap; // Actual React components
  brandingAssets: BrandingAssets;
  initialized: boolean;

  // Actions
  initializeConfig: (config: Partial<Omit<ConfigState, 'initialized' | 'componentRegistry'>>) => void;
  setTheme: (themeId: string, variables?: ThemeVariables) => void;
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => void;
  updateFeatureFlag: (key: string, value: boolean | string | number) => void;
  registerComponent: (id: string, component: React.ComponentType<any>) => void;
  unregisterComponent: (id: string) => void;
  getComponentForMapping: (logicalName: string) => React.ComponentType<any> | undefined;
  isFeatureEnabled: (featureKey: string) => boolean;
  getFeatureValue: (featureKey: string) => boolean | string | number | undefined;
  updateBrandingAssets: (assets: Partial<BrandingAssets>) => void;
  reset: () => void;
}

const initialState = {
  currentThemeId: 'default',
  themeVariables: {},
  featureFlags: {},
  componentMappings: {},
  componentRegistry: {},
  brandingAssets: {},
  initialized: false,
};

export const useConfigStore = create<ConfigState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initializeConfig: (config) => {
        set({
          ...config,
          initialized: true,
        });

        // Apply theme variables to CSS
        const { themeVariables } = config;
        if (themeVariables) {
          Object.entries(themeVariables).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
          });
        }
      },

      setTheme: (themeId, variables) => {
        set((state) => ({
          currentThemeId: themeId,
          themeVariables: variables || state.themeVariables,
        }));

        // Apply new theme variables
        if (variables) {
          Object.entries(variables).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
          });
        }
      },

      updateFeatureFlags: (flags) => {
        set((state) => ({
          featureFlags: { ...state.featureFlags, ...flags },
        }));
      },

      updateFeatureFlag: (key, value) => {
        set((state) => ({
          featureFlags: { ...state.featureFlags, [key]: value },
        }));
      },

      registerComponent: (id, component) => {
        set((state) => ({
          componentRegistry: { ...state.componentRegistry, [id]: component },
        }));
      },

      unregisterComponent: (id) => {
        set((state) => {
          const newRegistry = { ...state.componentRegistry };
          delete newRegistry[id];
          return { componentRegistry: newRegistry };
        });
      },

      getComponentForMapping: (logicalName) => {
        const state = get();
        const componentId = state.componentMappings[logicalName];
        return componentId ? state.componentRegistry[componentId] : undefined;
      },

      isFeatureEnabled: (featureKey) => {
        const value = get().featureFlags[featureKey];
        return value === true || value === 'true' || value === 1;
      },

      getFeatureValue: (featureKey) => {
        return get().featureFlags[featureKey];
      },

      updateBrandingAssets: (assets) => {
        set((state) => ({
          brandingAssets: { ...state.brandingAssets, ...assets },
        }));
      },

      reset: () => {
        set(initialState);

        // Clear CSS variables
        const root = document.documentElement;
        root.style.cssText = '';
      },
    }),
    { name: 'ConfigStore' }
  )
);

// Selectors for common use cases
export const selectFeatureFlags = (state: ConfigState) => state.featureFlags;
export const selectThemeVariables = (state: ConfigState) => state.themeVariables;
export const selectBrandingAssets = (state: ConfigState) => state.brandingAssets;
export const selectIsInitialized = (state: ConfigState) => state.initialized;
