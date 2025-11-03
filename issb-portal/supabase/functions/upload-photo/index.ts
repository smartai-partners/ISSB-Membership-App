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
    const { gallery_id, image_data, caption } = await req.json();

    if (!gallery_id || !image_data) {
      throw new Error('Gallery ID and image data are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
    });
    const userData = await userResponse.json();

    // Extract base64 data
    const base64Data = image_data.split(',')[1];
    const mimeType = image_data.split(';')[0].split(':')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const timestamp = Date.now();
    const fileName = `${timestamp}.${mimeType.split('/')[1]}`;
    const storagePath = `${gallery_id}/${fileName}`;

    // Upload to storage
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/event-images/${storagePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': mimeType,
          'x-upsert': 'true'
        },
        body: binaryData
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image');
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/event-images/${storagePath}`;

    // Save metadata
    const photoData = {
      gallery_id,
      image_url: publicUrl,
      caption: caption || '',
      uploaded_by: userData.id
    };

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(photoData)
    });

    if (!createResponse.ok) {
      throw new Error('Failed to save photo metadata');
    }

    const photo = await createResponse.json();

    return new Response(JSON.stringify({ data: { photo: photo[0] } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
