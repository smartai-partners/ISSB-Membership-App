Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Get environment variables
        const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get Stripe signature from headers
        const signature = req.headers.get('stripe-signature');
        const body = await req.text();

        console.log('Webhook received, signature present:', !!signature);

        // Verify webhook signature if secret is configured
        if (stripeWebhookSecret && signature) {
            // Parse signature header
            const sigElements = signature.split(',');
            const sigData = {};
            for (const element of sigElements) {
                const [key, value] = element.split('=');
                sigData[key] = value;
            }

            const timestamp = sigData['t'];
            const v1Signature = sigData['v1'];

            if (!timestamp || !v1Signature) {
                console.error('Invalid signature format');
                throw new Error('Invalid signature format');
            }

            // Create signed payload
            const signedPayload = `${timestamp}.${body}`;

            // Compute expected signature using Web Crypto API
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(stripeWebhookSecret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );

            const signatureBuffer = await crypto.subtle.sign(
                'HMAC',
                key,
                encoder.encode(signedPayload)
            );

            // Convert to hex
            const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            // Compare signatures
            if (expectedSignature !== v1Signature) {
                console.error('Signature verification failed');
                throw new Error('Invalid signature');
            }

            console.log('Webhook signature verified successfully');

            // Check timestamp to prevent replay attacks (allow 5 minutes tolerance)
            const currentTime = Math.floor(Date.now() / 1000);
            const timestampAge = currentTime - parseInt(timestamp);
            if (timestampAge > 300) {
                console.error('Webhook timestamp too old:', timestampAge, 'seconds');
                throw new Error('Webhook timestamp too old');
            }
        } else if (stripeWebhookSecret) {
            console.warn('Webhook secret configured but no signature provided');
        } else {
            console.warn('Webhook secret not configured - skipping signature verification (NOT RECOMMENDED FOR PRODUCTION)');
        }

        // Parse event
        const event = JSON.parse(body);
        console.log('Processing webhook event:', event.type, 'ID:', event.id);

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('Payment succeeded:', paymentIntent.id);

                // Update donation status
                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/donations?stripe_payment_intent_id=eq.${paymentIntent.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            payment_status: 'completed',
                            stripe_customer_id: paymentIntent.customer || null,
                            transaction_id: paymentIntent.id,
                            updated_at: new Date().toISOString()
                        })
                    }
                );

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    console.error('Failed to update donation status:', errorText);
                    throw new Error(`Failed to update donation: ${errorText}`);
                }

                const updatedDonation = await updateResponse.json();
                console.log('Donation updated successfully:', updatedDonation);

                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                console.log('Payment failed:', paymentIntent.id);

                // Update donation status to failed
                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/donations?stripe_payment_intent_id=eq.${paymentIntent.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            payment_status: 'failed',
                            notes: paymentIntent.last_payment_error?.message || 'Payment failed',
                            updated_at: new Date().toISOString()
                        })
                    }
                );

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    console.error('Failed to update donation status:', errorText);
                }

                break;
            }

            case 'payment_intent.canceled': {
                const paymentIntent = event.data.object;
                console.log('Payment canceled:', paymentIntent.id);

                // Update donation status to failed/canceled
                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/donations?stripe_payment_intent_id=eq.${paymentIntent.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            payment_status: 'failed',
                            notes: 'Payment was canceled',
                            updated_at: new Date().toISOString()
                        })
                    }
                );

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    console.error('Failed to update donation status:', errorText);
                }

                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object;
                console.log('Charge refunded:', charge.id);

                // Find donation by payment intent and update status
                if (charge.payment_intent) {
                    const updateResponse = await fetch(
                        `${supabaseUrl}/rest/v1/donations?stripe_payment_intent_id=eq.${charge.payment_intent}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                payment_status: 'refunded',
                                notes: `Refunded: ${charge.amount_refunded / 100} ${charge.currency}`,
                                updated_at: new Date().toISOString()
                            })
                        }
                    );

                    if (!updateResponse.ok) {
                        const errorText = await updateResponse.text();
                        console.error('Failed to update donation status:', errorText);
                    }
                }

                break;
            }

            default:
                console.log('Unhandled event type:', event.type);
        }

        // Log webhook event for audit trail
        console.log('Webhook processed successfully:', event.type, event.id);

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook processing error:', error);

        const errorResponse = {
            error: {
                code: 'WEBHOOK_PROCESSING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
