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
    const { title, description, event_id, is_published } = await req.json();

    if (!title) {
      throw new Error('Title is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
    });
    const userData = await userResponse.json();

    const galleryData = {
      title,
      description: description || '',
      event_id: event_id || null,
      is_published: is_published !== undefined ? is_published : false,
      created_by: userData.id
    };

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/photo_galleries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(galleryData)
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create gallery');
    }

    const gallery = await createResponse.json();

    return new Response(JSON.stringify({ data: { gallery: gallery[0] } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
