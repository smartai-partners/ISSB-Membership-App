Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { member_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get all active badges
    const badgesResponse = await fetch(
      `${supabaseUrl}/rest/v1/badges?is_active=eq.true`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    const badges = await badgesResponse.json();

    // Get member's current badges
    const memberBadgesResponse = await fetch(
      `${supabaseUrl}/rest/v1/member_badges?member_id=eq.${member_id}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    const memberBadges = await memberBadgesResponse.json();
    const earnedBadgeIds = new Set(memberBadges.map((mb: any) => mb.badge_id));

    // Get member's volunteer hours
    const hoursResponse = await fetch(
      `${supabaseUrl}/rest/v1/volunteer_hours?user_id=eq.${member_id}&status=eq.approved`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    const hours = await hoursResponse.json();
    const totalHours = hours.reduce((sum: number, h: any) => sum + (h.hours || 0), 0);

    // Get member's event registrations
    const registrationsResponse = await fetch(
      `${supabaseUrl}/rest/v1/event_registrations?user_id=eq.${member_id}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    const registrations = await registrationsResponse.json();
    const eventCount = registrations.length;

    // Check each badge criteria
    const newBadges = [];
    for (const badge of badges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria;
      let shouldAward = false;

      if (criteria.type === 'volunteer_hours' && totalHours >= criteria.threshold) {
        shouldAward = true;
      } else if (criteria.type === 'event_attendance' && eventCount >= criteria.threshold) {
        shouldAward = true;
      } else if (criteria.type === 'signup') {
        shouldAward = true;
      }

      if (shouldAward) {
        const awardResponse = await fetch(
          `${supabaseUrl}/rest/v1/member_badges`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              member_id,
              badge_id: badge.id,
              evidence: {
                total_hours: totalHours,
                event_count: eventCount,
                awarded_by: 'automated_system'
              }
            })
          }
        );

        if (awardResponse.ok) {
          const awarded = await awardResponse.json();
          newBadges.push(awarded[0]);
        }
      }
    }

    return new Response(JSON.stringify({ data: { new_badges: newBadges, total_hours: totalHours, event_count: eventCount } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
