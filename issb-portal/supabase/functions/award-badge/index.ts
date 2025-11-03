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
    const { member_id, badge_id, evidence } = await req.json();

    if (!member_id || !badge_id) {
      throw new Error('Member ID and Badge ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Check if badge already awarded
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/member_badges?member_id=eq.${member_id}&badge_id=eq.${badge_id}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    const existing = await checkResponse.json();
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ data: { already_awarded: true } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Award badge
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
          badge_id,
          evidence: evidence || {}
        })
      }
    );

    if (!awardResponse.ok) {
      throw new Error('Failed to award badge');
    }

    const memberBadge = await awardResponse.json();

    return new Response(JSON.stringify({ data: { member_badge: memberBadge[0] } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
