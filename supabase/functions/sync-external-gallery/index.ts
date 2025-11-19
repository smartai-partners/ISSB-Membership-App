// Sync External Gallery Edge Function
// Purpose: Refresh metadata from Pixieset or Google Drive

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPixiesetClient } from '../_shared/pixieset.ts';
import { getGoogleDriveClient } from '../_shared/googleDrive.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
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

    // Parse request body
    const body: SyncRequest = await req.json();

    if (!body.gallery_id) {
      return new Response(
        JSON.stringify({ error: 'gallery_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get gallery details
    const { data: gallery, error: galleryError } = await supabaseClient
      .from('galleries')
      .select('*')
      .eq('id', body.gallery_id)
      .single();

    if (galleryError || !gallery) {
      return new Response(
        JSON.stringify({ error: 'Gallery not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Only sync external galleries
    if (gallery.gallery_type === 'internal') {
      return new Response(
        JSON.stringify({ error: 'Cannot sync internal galleries' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!gallery.external_id) {
      return new Response(
        JSON.stringify({ error: 'Gallery has no external_id to sync' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let updatedData: any = {};

    // Sync from Pixieset
    if (gallery.gallery_type === 'pixieset') {
      const pixiesetClient = getPixiesetClient();
      const collection = await pixiesetClient.getCollection(gallery.external_id);

      if (!collection) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch Pixieset collection data' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      updatedData = {
        external_url: collection.client_gallery_url,
        thumbnail_url: collection.thumbnail_url,
        // Optionally update title if it changed
        // title: collection.name,
      };
    }

    // Sync from Google Drive
    if (gallery.gallery_type === 'google_drive') {
      const driveClient = getGoogleDriveClient();
      const folder = await driveClient.getFolder(gallery.external_id);

      if (!folder) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch Google Drive folder data' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      updatedData = {
        external_url: folder.webViewLink,
        thumbnail_url: folder.thumbnailLink,
        // Optionally update title if it changed
        // title: folder.name,
      };
    }

    // Update gallery with synced data
    const { data: updatedGallery, error: updateError } = await supabaseClient
      .from('galleries')
      .update({
        ...updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.gallery_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating gallery:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update gallery' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Gallery synced successfully',
        gallery: updatedGallery,
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
