Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
    });
    const userData = await userResponse.json();

    const memberBadgesResponse = await fetch(
      `${supabaseUrl}/rest/v1/member_badges?member_id=eq.${userData.id}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    const memberBadges = await memberBadgesResponse.json();

    const badgesWithDetails = await Promise.all(
      memberBadges.map(async (mb: any) => {
        const badgeResponse = await fetch(
          `${supabaseUrl}/rest/v1/badges?id=eq.${mb.badge_id}&select=*`,
          {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            }
          }
        );

        const badges = await badgeResponse.json();
        return { ...mb, badge: badges[0] };
      })
    );

    return new Response(JSON.stringify({ data: { member_badges: badgesWithDetails } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
