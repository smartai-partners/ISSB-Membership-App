// Enhanced Create Gallery Edge Function
// Purpose: Create galleries with Pixieset and Google Drive integration

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getPixiesetClient, PixiesetClient } from '../_shared/pixieset.ts';
import { getGoogleDriveClient, GoogleDriveClient } from '../_shared/googleDrive.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateGalleryRequest {
  event_id?: string;
  title: string;
  description?: string;
  gallery_type: 'pixieset' | 'google_drive' | 'internal';
  external_id?: string; // Required for pixieset and google_drive
  external_url?: string; // Optional, will be auto-generated if not provided
  is_published: boolean;
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
        JSON.stringify({ error: 'Forbidden: Only admins and board members can create galleries' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: CreateGalleryRequest = await req.json();

    // Validate required fields
    if (!body.title || !body.gallery_type) {
      return new Response(
        JSON.stringify({ error: 'title and gallery_type are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate gallery_type
    if (!['pixieset', 'google_drive', 'internal'].includes(body.gallery_type)) {
      return new Response(
        JSON.stringify({ error: 'gallery_type must be pixieset, google_drive, or internal' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For external galleries, external_id is required
    if ((body.gallery_type === 'pixieset' || body.gallery_type === 'google_drive') && !body.external_id) {
      return new Response(
        JSON.stringify({ error: 'external_id is required for external galleries' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let externalUrl = body.external_url;
    let thumbnailUrl: string | undefined;
    let validatedExternalId = body.external_id;

    // Validate and fetch metadata for external galleries
    if (body.gallery_type === 'pixieset' && body.external_id) {
      const pixiesetClient = getPixiesetClient();

      // Extract collection ID if a URL was provided
      const extractedId = PixiesetClient.extractCollectionId(body.external_id);
      if (extractedId) {
        validatedExternalId = extractedId;
      }

      // Validate collection
      const validation = await pixiesetClient.validateCollectionId(validatedExternalId!);

      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            error: `Invalid Pixieset collection: ${validation.error}`,
            hint: 'Make sure the collection exists and is publicly accessible'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Use validated data
      if (validation.collection) {
        externalUrl = validation.collection.client_gallery_url;
        thumbnailUrl = validation.collection.thumbnail_url;
      }
    } else if (body.gallery_type === 'google_drive' && body.external_id) {
      const driveClient = getGoogleDriveClient();

      // Extract folder ID if a URL was provided
      const extractedId = GoogleDriveClient.extractFolderId(body.external_id);
      if (extractedId) {
        validatedExternalId = extractedId;
      }

      // Validate folder
      const validation = await driveClient.validateFolderId(validatedExternalId!);

      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            error: `Invalid Google Drive folder: ${validation.error}`,
            hint: 'Make sure the folder exists and has public sharing enabled'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Use validated data
      if (validation.folder) {
        externalUrl = validation.folder.webViewLink;
        thumbnailUrl = validation.folder.thumbnailLink;
      }
    }

    // Create gallery in database
    const { data: gallery, error: insertError } = await supabaseClient
      .from('galleries')
      .insert({
        event_id: body.event_id || null,
        title: body.title,
        description: body.description || null,
        gallery_type: body.gallery_type,
        external_id: validatedExternalId || null,
        external_url: externalUrl || null,
        thumbnail_url: thumbnailUrl || null,
        is_published: body.is_published,
        created_by: user.id,
      })
      .select(`
        *,
        events:event_id (
          title,
          event_date
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating gallery:', insertError);

      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'This external gallery is already linked' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to create gallery' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Gallery created successfully',
        gallery,
      }),
      {
        status: 201,
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
