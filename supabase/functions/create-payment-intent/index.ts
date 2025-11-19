// Create Payment Intent Edge Function
// Purpose: Create a Stripe payment intent for one-time payments
// Supports: Event registrations, Memberships, Donations, and other payment types

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getStripeClient } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency?: string;
  payment_type: 'event_registration' | 'membership' | 'donation' | 'other';
  event_id?: string;
  membership_id?: string;
  campaign_id?: string;
  description: string;
  metadata?: Record<string, string>;

  // Legacy donation fields (for backward compatibility)
  donorEmail?: string;
  donorName?: string;
  isAnonymous?: boolean;
  message?: string;
  dedicationType?: string;
  dedicationName?: string;
  notificationEmail?: string;
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
    const body: CreatePaymentIntentRequest = await req.json();

    // Handle legacy donation API format
    let amount = body.amount;
    let payment_type = body.payment_type;
    let description = body.description;

    if (body.donorEmail && !body.payment_type) {
      // Legacy donation format - convert amount from dollars to cents
      amount = Math.round(body.amount * 100);
      payment_type = 'donation';
      description = body.message || 'Donation to ISSB';
    }

    // Validate request
    if (!amount || amount < 50) {
      return new Response(
        JSON.stringify({ error: 'Amount must be at least $0.50 (50 cents)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!payment_type) {
      return new Response(
        JSON.stringify({ error: 'payment_type is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!description) {
      return new Response(
        JSON.stringify({ error: 'description is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Additional validation based on payment type
    if (payment_type === 'event_registration' && !body.event_id) {
      return new Response(
        JSON.stringify({ error: 'event_id is required for event registration payments' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user profile for email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const userEmail = profile?.email || body.donorEmail;
    const userName = profile?.full_name || body.donorName;

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User profile not found or email missing' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Stripe client
    const stripeClient = getStripeClient();

    // Get or create Stripe customer
    const customer = await stripeClient.getOrCreateCustomer({
      email: userEmail,
      name: userName,
      metadata: {
        userId: user.id,
      },
    });

    // Build metadata
    const metadata: Record<string, string> = {
      userId: user.id,
      paymentType: payment_type,
      ...(body.event_id && { referenceId: body.event_id }),
      ...(body.membership_id && { membershipId: body.membership_id }),
      ...(body.campaign_id && { campaignId: body.campaign_id }),
      ...(body.isAnonymous !== undefined && { isAnonymous: body.isAnonymous.toString() }),
      ...(body.message && { message: body.message }),
      ...(body.dedicationType && { dedicationType: body.dedicationType }),
      ...(body.dedicationName && { dedicationName: body.dedicationName }),
      ...(body.metadata || {}),
    };

    // Create payment intent
    const paymentIntent = await stripeClient.createPaymentIntent({
      amount,
      currency: body.currency || 'usd',
      customerId: customer.id,
      customerEmail: userEmail,
      metadata,
      description,
    });

    // Create payment record in database using service role
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: payment, error: paymentError } = await supabaseServiceClient
      .from('payments')
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customer.id,
        user_id: user.id,
        amount,
        currency: body.currency || 'usd',
        status: 'pending',
        payment_type,
        event_id: body.event_id || null,
        membership_id: body.membership_id || null,
        description,
        receipt_email: userEmail,
        metadata,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the request, but log the error
      // The webhook will create/update the payment record later
    }

    // Return response in both new and legacy formats for backward compatibility
    return new Response(
      JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        payment_id: payment?.id,
        amount,
        currency: body.currency || 'usd',
        // Legacy format fields
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          donationId: payment?.id,
          amount: body.donorEmail ? amount / 100 : amount, // Convert back to dollars for legacy API
          currency: body.currency || 'usd',
          status: 'pending',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'PAYMENT_INTENT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
