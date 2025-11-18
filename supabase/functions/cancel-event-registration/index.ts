// Cancel Event Registration Edge Function
// Purpose: Handle event registration cancellation with waitlist promotion

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancellationRequest {
  event_id: string;
  registration_id?: string; // Optional: specific registration ID
}

serve(async (req) => {
  // Handle CORS preflight requests
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
    const body: CancellationRequest = await req.json();

    // Validate required fields
    if (!body.event_id) {
      return new Response(
        JSON.stringify({ error: 'event_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Find the registration to cancel
    let registrationId: string;
    if (body.registration_id) {
      registrationId = body.registration_id;
    } else {
      // Find active registration for this user and event
      const { data: existingRegistration, error: findError } = await supabaseClient
        .from('event_registrations')
        .select('id, registration_status')
        .eq('event_id', body.event_id)
        .eq('user_id', user.id)
        .in('registration_status', ['registered', 'waitlisted'])
        .single();

      if (findError || !existingRegistration) {
        return new Response(
          JSON.stringify({ error: 'No active registration found for this event' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      registrationId = existingRegistration.id;
    }

    // Get registration details before cancellation
    const { data: registration, error: getRegError } = await supabaseClient
      .from('event_registrations')
      .select(`
        *,
        events:event_id (
          title,
          event_date,
          location,
          capacity,
          current_registrations,
          allow_waitlist
        )
      `)
      .eq('id', registrationId)
      .single();

    if (getRegError || !registration) {
      return new Response(
        JSON.stringify({ error: 'Registration not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check authorization - user can only cancel their own registration (unless admin)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'board';

    if (registration.user_id !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'You can only cancel your own registrations' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const wasRegistered = registration.registration_status === 'registered';

    // Update registration status to 'cancelled'
    const { error: updateError } = await supabaseClient
      .from('event_registrations')
      .update({
        registration_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (updateError) {
      console.error('Error cancelling registration:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to cancel registration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let promotedUser: any = null;

    // If this was a confirmed registration (not waitlisted), promote next waitlisted user
    if (wasRegistered && registration.events.allow_waitlist) {
      // Find the oldest waitlisted registration
      const { data: waitlisted, error: waitlistError } = await supabaseClient
        .from('event_registrations')
        .select('*')
        .eq('event_id', body.event_id)
        .eq('registration_status', 'waitlisted')
        .order('registered_at', { ascending: true })
        .limit(1)
        .single();

      if (!waitlistError && waitlisted) {
        // Promote from waitlist to registered
        const { data: promoted, error: promoteError } = await supabaseClient
          .from('event_registrations')
          .update({ registration_status: 'registered' })
          .eq('id', waitlisted.id)
          .select(`
            *,
            profiles:user_id (
              first_name,
              last_name,
              email
            )
          `)
          .single();

        if (!promoteError && promoted) {
          promotedUser = promoted;
        }
      }
    }

    // Get updated event details
    const { data: updatedEvent } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', body.event_id)
      .single();

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration cancelled successfully',
        cancelled_registration_id: registrationId,
        event: updatedEvent,
        promoted_user: promotedUser ? {
          id: promotedUser.id,
          user_name: `${promotedUser.profiles.first_name} ${promotedUser.profiles.last_name}`,
          was_promoted: true,
        } : null,
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
