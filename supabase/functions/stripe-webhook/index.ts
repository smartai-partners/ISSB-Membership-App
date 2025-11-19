// Stripe Webhook Handler
// Purpose: Process Stripe webhook events for payments and subscriptions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getStripeClient } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature
    const stripeClient = getStripeClient();
    let event;

    try {
      event = stripeClient.verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook event received:', event.type, event.id);

    // Initialize Supabase service client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different event types
    switch (event.type) {
      // Payment Intent Events
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabase);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object, supabase);
        break;

      // Subscription Events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;

      // Invoice Events (for subscriptions)
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, supabase);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, supabase);
        break;

      // Refund Events
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object, supabase);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// PAYMENT INTENT HANDLERS
// ============================================================================

async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: any) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    // Extract payment method details
    const paymentMethod = paymentIntent.payment_method
      ? await getStripeClient().getPaymentMethod(paymentIntent.payment_method)
      : null;

    // Update payment record
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        paid_at: new Date(paymentIntent.created * 1000).toISOString(),
        payment_method_type: paymentMethod?.type || null,
        card_brand: paymentMethod?.card?.brand || null,
        card_last4: paymentMethod?.card?.last4 || null,
        stripe_fee: paymentIntent.charges?.data[0]?.balance_transaction?.fee || 0,
        net_amount: paymentIntent.amount - (paymentIntent.charges?.data[0]?.balance_transaction?.fee || 0),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating payment:', error);
    } else {
      console.log('Payment record updated successfully');
    }

    // Update campaign total if this is a donation
    if (paymentIntent.metadata?.campaignId) {
      await supabase.rpc('update_campaign_total', {
        campaign_id_param: paymentIntent.metadata.campaignId,
      });
    }

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any, supabase: any) {
  console.log('Payment failed:', paymentIntent.id);

  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating failed payment:', error);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: any, supabase: any) {
  console.log('Payment canceled:', paymentIntent.id);

  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating canceled payment:', error);
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

// ============================================================================
// SUBSCRIPTION HANDLERS
// ============================================================================

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('Subscription updated:', subscription.id);

  try {
    // Get user ID from customer metadata
    const stripeClient = getStripeClient();
    const customer = await stripeClient.getRawClient().customers.retrieve(subscription.customer);
    const userId = (customer as any).metadata?.userId;

    if (!userId) {
      console.error('No user ID found in customer metadata');
      return;
    }

    // Upsert subscription
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        stripe_price_id: subscription.items.data[0]?.price.id,
        stripe_product_id: subscription.items.data[0]?.price.product,
        user_id: userId,
        status: subscription.status,
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        currency: subscription.currency,
        interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
        interval_count: subscription.items.data[0]?.price.recurring?.interval_count || 1,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_start: subscription.trial_start
          ? new Date(subscription.trial_start * 1000).toISOString()
          : null,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        cancelled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'stripe_subscription_id',
      });

    if (error) {
      console.error('Error upserting subscription:', error);
    } else {
      console.log('Subscription record updated successfully');
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log('Subscription deleted:', subscription.id);

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating deleted subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// ============================================================================
// INVOICE HANDLERS (for subscription payments)
// ============================================================================

async function handleInvoicePaymentSucceeded(invoice: any, supabase: any) {
  console.log('Invoice payment succeeded:', invoice.id);

  try {
    // Update subscription status if needed
    if (invoice.subscription) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription);

      if (error) {
        console.error('Error updating subscription after invoice payment:', error);
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: any, supabase: any) {
  console.log('Invoice payment failed:', invoice.id);

  try {
    // Update subscription status
    if (invoice.subscription) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription);

      if (error) {
        console.error('Error updating subscription after invoice failure:', error);
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
  }
}

// ============================================================================
// REFUND HANDLERS
// ============================================================================

async function handleChargeRefunded(charge: any, supabase: any) {
  console.log('Charge refunded:', charge.id);

  try {
    const paymentIntentId = charge.payment_intent;
    const refundAmount = charge.amount_refunded;
    const fullyRefunded = charge.refunded;

    // Update payment status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: fullyRefunded ? 'refunded' : 'partially_refunded',
        amount_refunded: refundAmount,
        refunded_at: fullyRefunded ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (paymentError) {
      console.error('Error updating payment for refund:', paymentError);
    }

    // Create refund records for each refund
    for (const refund of charge.refunds.data) {
      const { error: refundError } = await supabase
        .from('refunds')
        .insert({
          stripe_refund_id: refund.id,
          payment_id: (await supabase
            .from('payments')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single()).data?.id,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason || 'other',
          status: refund.status,
          processed_at: new Date(refund.created * 1000).toISOString(),
        });

      if (refundError) {
        console.error('Error creating refund record:', refundError);
      }
    }
  } catch (error) {
    console.error('Error handling charge refund:', error);
  }
}
