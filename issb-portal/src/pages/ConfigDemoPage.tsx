/**
 * Config Demo Page
 * Demonstrates the modular frontend architecture features:
 * - Feature toggles
 * - Dynamic component loading
 * - Component swapping
 * - Theme variables
 */

import React, { useState } from 'react';
import { useConfigStore } from '@/stores/useConfigStore';
import { FeatureToggle, MultiFeatureToggle, FeatureValue } from '@/components/dynamic/FeatureToggle';
import { DynamicComponentLoader } from '@/components/dynamic/DynamicComponentLoader';
import { Settings, Eye, EyeOff, Sparkles, RefreshCw } from 'lucide-react';

export function ConfigDemoPage() {
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const featureFlags = useConfigStore((state) => state.featureFlags);
  const themeVariables = useConfigStore((state) => state.themeVariables);
  const componentMappings = useConfigStore((state) => state.componentMappings);
  const brandingAssets = useConfigStore((state) => state.brandingAssets);
  const updateFeatureFlag = useConfigStore((state) => state.updateFeatureFlag);

  const mockMembershipStatus = {
    status: 'active' as const,
    start_date: '2024-01-01',
    end_date: '2025-01-01',
    balance_due: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Modular Architecture Demo</h1>
        </div>
        <p className="text-purple-100">
          Showcasing feature toggles, dynamic component loading, and personalization
        </p>
      </div>

      {/* Debug Panel Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {showDebugPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
        </button>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="bg-gray-900 text-gray-100 rounded-lg p-6 font-mono text-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration State
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature Flags */}
            <div>
              <h4 className="text-green-400 font-semibold mb-2">Feature Flags</h4>
              <div className="bg-gray-800 rounded p-3 max-h-60 overflow-y-auto">
                <pre className="text-xs">{JSON.stringify(featureFlags, null, 2)}</pre>
              </div>
            </div>

            {/* Component Mappings */}
            <div>
              <h4 className="text-blue-400 font-semibold mb-2">Component Mappings</h4>
              <div className="bg-gray-800 rounded p-3 max-h-60 overflow-y-auto">
                <pre className="text-xs">{JSON.stringify(componentMappings, null, 2)}</pre>
              </div>
            </div>

            {/* Theme Variables */}
            <div>
              <h4 className="text-purple-400 font-semibold mb-2">Theme Variables</h4>
              <div className="bg-gray-800 rounded p-3 max-h-60 overflow-y-auto">
                <pre className="text-xs">{JSON.stringify(themeVariables, null, 2)}</pre>
              </div>
            </div>

            {/* Branding Assets */}
            <div>
              <h4 className="text-amber-400 font-semibold mb-2">Branding Assets</h4>
              <div className="bg-gray-800 rounded p-3 max-h-60 overflow-y-auto">
                <pre className="text-xs">{JSON.stringify(brandingAssets, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Toggle Demos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Toggle Examples</h2>

        {/* Example 1: Simple Feature Toggle */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">1. Simple Feature Toggle</h3>
          <p className="text-sm text-gray-600 mb-3">
            Shows content only when "showPremiumFeatures" flag is enabled
          </p>
          <FeatureToggle
            feature="showPremiumFeatures"
            fallback={
              <div className="bg-gray-100 border border-gray-300 rounded p-3 text-gray-600">
                Premium features are not available for your account
              </div>
            }
          >
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded p-3">
              <p className="text-amber-900 font-medium">🎉 Premium Features Unlocked!</p>
              <p className="text-sm text-amber-700">
                You have access to exclusive premium content.
              </p>
            </div>
          </FeatureToggle>
        </div>

        {/* Example 2: Multi-Feature Toggle */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">2. Multi-Feature Toggle (AND Logic)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Requires ALL of: showAdminPanel, canManageUsers, canViewAnalytics
          </p>
          <MultiFeatureToggle
            features={['showAdminPanel', 'canManageUsers', 'canViewAnalytics']}
            fallback={
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">
                You don't have sufficient permissions to access this section
              </div>
            }
          >
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-green-900 font-medium">✅ Full Admin Access Granted</p>
              <p className="text-sm text-green-700">You can manage users and view analytics.</p>
            </div>
          </MultiFeatureToggle>
        </div>

        {/* Example 3: Feature Value */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">3. Feature Value Rendering</h3>
          <p className="text-sm text-gray-600 mb-3">Renders different content based on flag value</p>
          <FeatureValue feature="hasPremiumFeatures">
            {(value) => (
              <div
                className={`rounded p-3 ${
                  value
                    ? 'bg-purple-50 border border-purple-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <p className={`font-medium ${value ? 'text-purple-900' : 'text-gray-700'}`}>
                  Premium Status: {value ? '👑 Active' : '📋 Standard'}
                </p>
              </div>
            )}
          </FeatureValue>
        </div>
      </div>

      {/* Dynamic Component Loading Demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dynamic Component Loading</h2>

        <div className="space-y-6">
          {/* Example 1: Component Mapping */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              1. Component Swapping via Mapping
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Shows different MembershipStatusWidget based on user's membership status
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Current mapping:{' '}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                {componentMappings.MembershipStatusWidget || 'Not mapped'}
              </span>
            </p>
            <DynamicComponentLoader
              mapping="MembershipStatusWidget"
              membershipStatus={mockMembershipStatus}
              className="max-w-md"
            />
          </div>

          {/* Example 2: Direct Component ID */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">2. Direct Component Loading</h3>
            <p className="text-sm text-gray-600 mb-3">Loads component by specific ID</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-2 font-medium">Default Widget:</p>
                <DynamicComponentLoader
                  componentId="DefaultMembershipStatusWidget"
                  membershipStatus={mockMembershipStatus}
                />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2 font-medium">Premium Widget:</p>
                <DynamicComponentLoader
                  componentId="PremiumMembershipStatusWidget"
                  membershipStatus={mockMembershipStatus}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Feature Flag Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-6 h-6" />
          Interactive Controls
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Toggle feature flags to see changes in real-time
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(featureFlags)
            .filter(([_, value]) => typeof value === 'boolean')
            .slice(0, 8)
            .map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{key}</p>
                  <p className="text-xs text-gray-500">
                    Current: {value ? '✅ Enabled' : '❌ Disabled'}
                  </p>
                </div>
                <button
                  onClick={() => updateFeatureFlag(key, !value)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    value
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Toggle
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
