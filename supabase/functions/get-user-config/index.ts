import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeatureFlags {
  [key: string]: boolean | string | number;
}

interface ThemeVariables {
  [key: string]: string;
}

interface ComponentMapping {
  [key: string]: string;
}

interface UserConfig {
  currentThemeId: string;
  themeVariables: ThemeVariables;
  featureFlags: FeatureFlags;
  componentMappings: ComponentMapping;
  brandingAssets: {
    logoUrl?: string;
    primaryColor?: string;
    sponsorLogoUrl?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get membership status
    const { data: membershipStatus } = await supabaseClient
      .from('membership_status_view')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Build user-specific configuration
    const config: UserConfig = {
      currentThemeId: 'default',
      themeVariables: {
        '--primary-color': '#16a34a', // Green for ISSB
        '--secondary-color': '#059669',
        '--accent-color': '#10b981',
      },
      featureFlags: {},
      componentMappings: {},
      brandingAssets: {
        logoUrl: '/images/issb-logo.png',
        primaryColor: '#16a34a',
      },
    };

    // Role-based feature flags
    const isAdmin = profile.role === 'admin' || profile.role === 'board';
    const isBoardMember = profile.role === 'board';
    const isRegularMember = profile.role === 'member';

    config.featureFlags = {
      // Admin features
      showAdminPanel: isAdmin,
      canManageUsers: isAdmin,
      canManageAnnouncements: isAdmin,
      canApproveVolunteerHours: isAdmin,
      canViewAnalytics: isAdmin,

      // Board features
      canVote: isBoardMember || isAdmin,
      showBoardResources: isBoardMember || isAdmin,

      // Member features
      showDonationPortal: true,
      showVolunteerPortal: true,
      showEventsPortal: true,

      // AI Features
      showAIAssistant: true,
      showAIAnnouncements: isAdmin,
      showRecommendations: true,

      // Premium features (based on membership status)
      hasPremiumFeatures: membershipStatus?.status === 'active',
      showPremiumWidgets: membershipStatus?.status === 'active',

      // Custom dashboard
      hasCustomDashboard: isAdmin || isBoardMember,

      // Experimental features (can be toggled per user)
      enableBetaFeatures: false,
      showGamification: true,
    };

    // Component mappings based on user status
    config.componentMappings = {
      // Membership status widget - premium variant for active members
      MembershipStatusWidget: membershipStatus?.status === 'active'
        ? 'PremiumMembershipStatusWidget'
        : 'DefaultMembershipStatusWidget',

      // Volunteer widget - enhanced for members with >10 hours
      VolunteerHoursWidget: (profile.total_volunteer_hours || 0) >= 10
        ? 'EnhancedVolunteerWidget'
        : 'DefaultVolunteerWidget',

      // Dashboard header - custom for admin/board
      DashboardHeader: isAdmin || isBoardMember
        ? 'AdminDashboardHeader'
        : 'MemberDashboardHeader',
    };

    // Theme customization based on role
    if (isAdmin) {
      config.themeVariables['--admin-highlight'] = '#3b82f6'; // Blue for admin
    }

    if (isBoardMember) {
      config.themeVariables['--board-highlight'] = '#8b5cf6'; // Purple for board
    }

    // Check if user is associated with a sponsor organization
    // This would come from a database table linking users to organizations
    // For now, we'll use a placeholder
    const isSponsorMember = false; // TODO: Check against sponsors table

    if (isSponsorMember) {
      config.currentThemeId = 'sponsor-custom';
      config.brandingAssets.sponsorLogoUrl = '/images/sponsor-logo.png';
      config.brandingAssets.primaryColor = '#f59e0b'; // Example sponsor color
      config.themeVariables['--primary-color'] = '#f59e0b';
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: config,
        metadata: {
          userId: user.id,
          role: profile.role,
          membershipStatus: membershipStatus?.status || 'inactive',
          generatedAt: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating user config:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || 'Internal server error',
          code: 'CONFIG_ERROR',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
