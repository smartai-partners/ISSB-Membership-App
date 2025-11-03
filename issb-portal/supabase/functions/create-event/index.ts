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
    const { title, description, event_type, status, start_date, end_date, location, capacity, is_published } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
    });
    const userData = await userResponse.json();

    const eventData = {
      title,
      description: description || '',
      event_type: event_type || 'general',
      status: status || 'upcoming',
      start_date,
      end_date: end_date || start_date,
      location: location || '',
      capacity: capacity || null,
      is_published: is_published !== undefined ? is_published : false,
      created_by: userData.id,
      current_registrations: 0
    };

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(eventData)
    });

    const event = await createResponse.json();

    return new Response(JSON.stringify({ data: { event: event[0] } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
