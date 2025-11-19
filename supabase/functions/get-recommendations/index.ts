import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recommendation {
  id: string;
  type: 'volunteer' | 'event' | 'payment' | 'member' | 'role';
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  priority: number;
  metadata?: any;
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

    const recommendations: Recommendation[] = [];

    // Get user's profile and membership status
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: membershipStatus } = await supabaseClient
      .from('membership_status_view')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 1. Volunteer Opportunity Recommendations
    // If user has less than 15 hours, recommend volunteering
    const totalHours = profile?.total_volunteer_hours || 0;
    if (totalHours < 15) {
      const { data: opportunities } = await supabaseClient
        .from('volunteer_opportunities')
        .select('*')
        .eq('status', 'active')
        .gte('capacity', 1)
        .order('created_at', { ascending: false })
        .limit(1);

      if (opportunities && opportunities.length > 0) {
        const opp = opportunities[0];
        recommendations.push({
          id: `volunteer-${opp.id}`,
          type: 'volunteer',
          title: 'Volunteer to Reduce Your Membership Fee',
          description: `You have ${totalHours} volunteer hours. Earn more to waive your $360 membership fee! Check out: ${opp.title}`,
          actionText: 'Browse Opportunities',
          actionUrl: '/volunteers',
          priority: totalHours < 5 ? 1 : 3,
          metadata: { opportunityId: opp.id, currentHours: totalHours }
        });
      }
    }

    // 2. Payment Recommendation
    // If user has a balance due, recommend payment
    if (membershipStatus && membershipStatus.balance_due > 0) {
      recommendations.push({
        id: 'payment-due',
        type: 'payment',
        title: 'Complete Your Membership Payment',
        description: `You have a balance of $${membershipStatus.balance_due.toFixed(2)}. Complete your payment to maintain active status.`,
        actionText: 'Make Payment',
        actionUrl: '/donations',
        priority: membershipStatus.status === 'expired' ? 1 : 2,
        metadata: { balanceDue: membershipStatus.balance_due }
      });
    }

    // 3. Event Recommendations
    // Get upcoming events in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: events } = await supabaseClient
      .from('events')
      .select('*')
      .gte('date', new Date().toISOString())
      .lte('date', thirtyDaysFromNow.toISOString())
      .order('date', { ascending: true })
      .limit(2);

    if (events && events.length > 0) {
      events.forEach((event, index) => {
        recommendations.push({
          id: `event-${event.id}`,
          type: 'event',
          title: `Upcoming Event: ${event.title}`,
          description: `Join us on ${new Date(event.date).toLocaleDateString()}. ${event.description?.substring(0, 100) || 'Community event'}...`,
          actionText: 'View Event',
          actionUrl: '/events',
          priority: 4 + index,
          metadata: { eventId: event.id, eventDate: event.date }
        });
      });
    }

    // 4. Member Connection Recommendations
    // Get a few recently active members (excluding self)
    const { data: activeMembers } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, role')
      .neq('id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (activeMembers && activeMembers.length > 0) {
      const member = activeMembers[0];
      recommendations.push({
        id: `member-${member.id}`,
        type: 'member',
        title: 'Connect with Active Members',
        description: `${member.first_name} ${member.last_name} and ${activeMembers.length - 1} other members are active in the community. Expand your network!`,
        actionText: 'View Directory',
        actionUrl: '/members',
        priority: 6,
        metadata: { memberCount: activeMembers.length }
      });
    }

    // 5. Role-Based Recommendations
    // If user doesn't have a leadership role, suggest getting involved
    if (!profile?.role || profile.role === 'member') {
      recommendations.push({
        id: 'role-leadership',
        type: 'role',
        title: 'Get More Involved in ISSB',
        description: 'Interested in taking on a leadership role? We welcome members who want to contribute to our community.',
        actionText: 'Contact Admin',
        actionUrl: '/contact',
        priority: 7,
        metadata: { currentRole: profile?.role || 'member' }
      });
    }

    // Sort by priority (lower number = higher priority)
    recommendations.sort((a, b) => a.priority - b.priority);

    // Return top 4 recommendations
    const topRecommendations = recommendations.slice(0, 4);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          recommendations: topRecommendations,
          total: topRecommendations.length,
          generated_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || 'Internal server error',
          code: 'RECOMMENDATION_ERROR'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
