// Register for Event Edge Function
// Purpose: Handle event registration with capacity management and waitlist support

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cors} from '../_shared/cors.ts';
import { getEmailService } from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationRequest {
  event_id: string;
  notes?: string;
  guest_count?: number;
  dietary_restrictions?: string;
  emergency_contact?: string;
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
    const body: RegistrationRequest = await req.json();

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

    // Check if user can register using helper function
    const { data: canRegisterData, error: canRegisterError } = await supabaseClient
      .rpc('can_register_for_event', {
        p_event_id: body.event_id,
        p_user_id: user.id,
      });

    if (canRegisterError) {
      console.error('Error checking registration eligibility:', canRegisterError);
      return new Response(
        JSON.stringify({ error: 'Failed to check registration eligibility' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If user cannot register, return the reason
    if (!canRegisterData.can_register) {
      return new Response(
        JSON.stringify({
          error: canRegisterData.message,
          reason: canRegisterData.reason,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determine registration status (registered or waitlisted)
    const registrationStatus = canRegisterData.will_be_waitlisted ? 'waitlisted' : 'registered';

    // Create registration
    const { data: registration, error: insertError } = await supabaseClient
      .from('event_registrations')
      .insert({
        event_id: body.event_id,
        user_id: user.id,
        registration_status: registrationStatus,
        notes: body.notes || null,
        guest_count: body.guest_count || 0,
        dietary_restrictions: body.dietary_restrictions || null,
        emergency_contact: body.emergency_contact || null,
      })
      .select(`
        *,
        events:event_id (
          title,
          event_date,
          location,
          capacity,
          current_registrations
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating registration:', insertError);

      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'You are already registered for this event' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to create registration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get updated event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', body.event_id)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
    }

    // Send confirmation email
    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (profile?.email && event) {
        const emailService = getEmailService();
        const eventDate = event.event_date
          ? new Date(event.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })
          : 'Date TBD';

        const template = emailService.eventRegistrationEmail(
          profile.full_name || 'Member',
          event.title,
          eventDate,
          event.location || 'Location TBD'
        );

        await emailService.sendEmail({
          to: profile.email,
          subject: template.subject,
          html: template.html,
        });

        console.log('Registration confirmation email sent to:', profile.email);
      }
    } catch (emailError) {
      console.error('Error sending registration confirmation email:', emailError);
      // Don't fail the registration if email fails
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: registrationStatus === 'waitlisted'
          ? 'Successfully added to waitlist'
          : 'Successfully registered for event',
        registration: registration,
        event: event,
        status: registrationStatus,
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
