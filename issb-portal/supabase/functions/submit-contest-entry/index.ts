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
    const { contest_id, submission_title, content } = await req.json();

    if (!contest_id || !submission_title) {
      throw new Error('Contest ID and submission title are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
    });
    const userData = await userResponse.json();

    // Check if already submitted
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/contest_submissions?contest_id=eq.${contest_id}&user_id=eq.${userData.id}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    const existing = await checkResponse.json();
    if (existing && existing.length > 0) {
      throw new Error('Already submitted to this contest');
    }

    const submissionData = {
      contest_id,
      user_id: userData.id,
      submission_title,
      content: content || '',
      media_urls: []
    };

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/contest_submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(submissionData)
    });

    if (!createResponse.ok) {
      throw new Error('Failed to submit entry');
    }

    const submission = await createResponse.json();

    return new Response(JSON.stringify({ data: { submission: submission[0] } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
