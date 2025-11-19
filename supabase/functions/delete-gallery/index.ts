// Delete Gallery Edge Function
// Purpose: Delete a gallery (soft delete or hard delete)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteGalleryRequest {
  gallery_id: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is admin or board member
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'board'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins and board members can delete galleries' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: DeleteGalleryRequest = await req.json();

    if (!body.gallery_id) {
      return new Response(
        JSON.stringify({ error: 'gallery_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get gallery to check if it exists
    const { data: gallery, error: getError } = await supabaseClient
      .from('galleries')
      .select('id, title, gallery_type')
      .eq('id', body.gallery_id)
      .single();

    if (getError || !gallery) {
      return new Response(
        JSON.stringify({ error: 'Gallery not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete the gallery
    // Note: This only deletes the metadata link, not the external gallery
    const { error: deleteError } = await supabaseClient
      .from('galleries')
      .delete()
      .eq('id', body.gallery_id);

    if (deleteError) {
      console.error('Error deleting gallery:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete gallery' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Gallery "${gallery.title}" deleted successfully`,
        deleted_id: body.gallery_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
