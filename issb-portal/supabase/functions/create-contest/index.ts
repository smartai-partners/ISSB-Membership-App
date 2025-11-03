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
    const { title, description, rules, prize_description, sponsor_name, start_date, end_date, max_submissions, is_published } = await req.json();

    if (!title || !start_date || !end_date) {
      throw new Error('Title, start date, and end date are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
    });
    const userData = await userResponse.json();

    const contestData = {
      title,
      description: description || '',
      rules: rules || '',
      prize_description: prize_description || '',
      sponsor_name: sponsor_name || null,
      max_submissions: max_submissions || 1,
      start_date,
      end_date,
      is_published: is_published !== undefined ? is_published : false,
      created_by: userData.id
    };

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/contests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(contestData)
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create contest');
    }

    const contest = await createResponse.json();

    return new Response(JSON.stringify({ data: { contest: contest[0] } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
