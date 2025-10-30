Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!stripeSecretKey || !stripeWebhookSecret) {
            throw new Error('Stripe configuration missing');
        }

        const signature = req.headers.get('stripe-signature');
        if (!signature) {
            throw new Error('Missing Stripe signature');
        }

        const body = await req.text();

        // Verify webhook signature
        const encoder = new TextEncoder();
        const data = encoder.encode(body);
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(stripeWebhookSecret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );
        
        // Parse the event
        const event = JSON.parse(body);
        console.log('Webhook received:', event.type);

        // Handle payment_intent.succeeded event
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            console.log('Payment succeeded:', paymentIntentId);

            // Update donation status in database
            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/donations?stripe_payment_intent_id=eq.${paymentIntentId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        payment_status: 'paid',
                        updated_at: new Date().toISOString()
                    })
                }
            );

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('Failed to update donation status:', errorText);
                throw new Error('Failed to update donation status');
            }

            console.log('Donation status updated to paid');
        }

        // Handle payment_intent.payment_failed event
        if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            console.log('Payment failed:', paymentIntentId);

            // Update donation status to failed
            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/donations?stripe_payment_intent_id=eq.${paymentIntentId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        payment_status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                }
            );

            if (!updateResponse.ok) {
                console.error('Failed to update donation status');
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
