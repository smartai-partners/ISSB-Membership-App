// Send Email Edge Function
// Purpose: Send transactional emails

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getEmailService, EmailOptions } from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  to: string | string[];
  template?: 'welcome' | 'event_registration' | 'payment_success' | 'report_ready' | 'volunteer_hours_approved';
  templateData?: Record<string, any>;
  subject?: string;
  html?: string;
}

serve(async (req) => {
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

    // Get authenticated user (for non-service calls)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    // Parse request
    const body: SendEmailRequest = await req.json();

    if (!body.to) {
      return new Response(
        JSON.stringify({ error: 'Recipient email(s) required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailService = getEmailService();
    let emailOptions: EmailOptions;

    // If using template
    if (body.template && body.templateData) {
      let template;

      switch (body.template) {
        case 'welcome':
          template = emailService.welcomeEmail(
            body.templateData.userName,
            body.templateData.userEmail
          );
          break;

        case 'event_registration':
          template = emailService.eventRegistrationEmail(
            body.templateData.userName,
            body.templateData.eventTitle,
            body.templateData.eventDate,
            body.templateData.eventLocation
          );
          break;

        case 'payment_success':
          template = emailService.paymentSuccessEmail(
            body.templateData.userName,
            body.templateData.amount,
            body.templateData.currency,
            body.templateData.description,
            body.templateData.receiptUrl
          );
          break;

        case 'report_ready':
          template = emailService.reportReadyEmail(
            body.templateData.userName,
            body.templateData.reportType,
            body.templateData.downloadUrl
          );
          break;

        case 'volunteer_hours_approved':
          template = emailService.volunteerHoursApprovedEmail(
            body.templateData.userName,
            body.templateData.hours,
            body.templateData.description
          );
          break;

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid template' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
      }

      emailOptions = {
        to: body.to,
        subject: template.subject,
        html: template.html,
      };
    } else if (body.subject && body.html) {
      // Custom email
      emailOptions = {
        to: body.to,
        subject: body.subject,
        html: body.html,
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Either template or subject+html required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send email
    const result = await emailService.sendEmail(emailOptions);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
