Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400'
    };

    if (req.method === 'OPTIONS') { 
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Missing environment variables');
        }

        const event = await req.json();
        console.log('Webhook event:', JSON.stringify(event));
        
        // Handle subscription, payment, and donation events
        switch (event.type) {
            case 'customer.subscription.updated':
                await handleSubscription(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            
            case 'invoice.payment_succeeded':
                await handlePayment(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            
            case 'payment_intent.succeeded':
                await handleDonationPayment(event.data.object, supabaseUrl, serviceRoleKey);
                break;
                
            default:
                console.log('Event ignored:', event.type);
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

function getSubscriptionId(invoice: any): string | undefined {
    return invoice?.subscription;
}

function getPriceId(invoice: any): string | undefined {
    return invoice?.lines?.data?.[0]?.price?.id;
}

// Handle cancel subscription changes
async function handleSubscription(invoice: any, supabaseUrl: string, serviceRoleKey: string) {
    const isCanceling = invoice.cancel_at_period_end === true || invoice.status === 'canceled';
    const subscriptions_table = 'subscriptions'
    
    const subscriptionId = getSubscriptionId(invoice);

    if (!isCanceling) {
        console.log(`Subscription ${invoice.id} is not canceling, skipping.`);
        return;
    }
    await fetch(`${supabaseUrl}/rest/v1/${subscriptions_table}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
            stripe_subscription_id: subscriptionId,
            status: "canceled",
            updated_at: new Date().toISOString()
        })
    });

    console.log(`Subscription cancellation processed: ${invoice.id}, status: ${invoice.status}`);
}

// Handle successful payments - upsert subscription with plan info
async function handlePayment(invoice: any, supabaseUrl: string, serviceRoleKey: string) {
    if (!['subscription_cycle', 'subscription_create'].includes(invoice.billing_reason)) return;

    const customerId = invoice.customer;
    const subscriptions_table = 'subscriptions'
    
    const subscriptionId = getSubscriptionId(invoice);
    const priceId = getPriceId(invoice);
    
    if (!priceId) {
        console.log('No price_id found in subscription');
        return;
    }

    // Query plans table to get plan_type by price_id
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/plans?price_id=eq.${priceId}&select=plan_type,monthly_limit`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    let planType = 'free';
    let monthlyLimit = 3;
    
    if (planResponse.ok) {
        const planData = await planResponse.json();
        if (planData?.length > 0) {
            planType = planData[0].plan_type;
            monthlyLimit = planData[0].monthly_limit;
        }
    }

    // Get user_id from Stripe customer
    let userId = null;
    try {
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (stripeSecretKey) {
            const customerResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${stripeSecretKey}`
                }
            });
            
            if (customerResponse.ok) {
                const customerData = await customerResponse.json();
                userId = customerData.metadata?.user_id || null;
                console.log(`Retrieved user_id: ${userId} for customer: ${customerId}`);
            }
        }
    } catch (error) {
        console.error('Failed to retrieve user_id from Stripe customer:', error);
    }

    // Upsert subscription record
    const response = await fetch(`${supabaseUrl}/rest/v1/${subscriptions_table}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            price_id: priceId,
            status: 'active',
            activation_method: 'payment',
            updated_at: new Date().toISOString()
        })
    });
    const rawText = await response.text();
    console.log("upsert data resp:", JSON.stringify(rawText));
    console.log(`Payment processed - stripe_subscription_id: ${subscriptionId} Customer: ${customerId}, Plan: ${planType}`);
}

// Handle donation payment completion and membership activation
async function handleDonationPayment(paymentIntent: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Processing donation payment:', paymentIntent.id);

    // Check if this payment should apply to membership
    const applyToMembership = paymentIntent.metadata?.apply_to_membership === 'true';
    
    if (!applyToMembership) {
        console.log('Payment intent does not apply to membership, skipping');
        return;
    }

    const userId = paymentIntent.metadata?.user_id;
    const membershipAmount = parseFloat(paymentIntent.metadata?.membership_amount || '0');
    
    if (!userId || userId === 'anonymous' || membershipAmount < 360) {
        console.log('Invalid user or insufficient membership amount');
        return;
    }

    try {
        // Update donation record status
        await fetch(`${supabaseUrl}/rest/v1/donations?stripe_payment_intent_id=eq.${paymentIntent.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payment_status: 'completed',
                updated_at: new Date().toISOString()
            })
        });

        // Check if user already has active membership
        const existingSubResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&status=eq.active&select=id`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (existingSubResponse.ok) {
            const existingSubs = await existingSubResponse.json();
            if (existingSubs.length > 0) {
                console.log('User already has active membership, skipping activation');
                return;
            }
        }

        // Get the individual_annual plan price_id
        const planResponse = await fetch(
            `${supabaseUrl}/rest/v1/plans?plan_type=eq.individual_annual&select=price_id`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        let priceId = null;
        if (planResponse.ok) {
            const plans = await planResponse.json();
            if (plans.length > 0) {
                priceId = plans[0].price_id;
            }
        }

        // Create active membership subscription
        const subscriptionData = {
            user_id: userId,
            price_id: priceId,
            status: 'active',
            activation_method: 'donation',
            stripe_payment_intent_id: paymentIntent.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const createSubResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(subscriptionData)
        });

        if (createSubResponse.ok) {
            const newSubscription = await createSubResponse.json();
            console.log('Membership activated via donation:', newSubscription[0].id);

            // Link donation to membership
            await fetch(`${supabaseUrl}/rest/v1/donations?stripe_payment_intent_id=eq.${paymentIntent.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    membership_id: newSubscription[0].id,
                    updated_at: new Date().toISOString()
                })
            });

            // Log to subscription history
            await fetch(`${supabaseUrl}/rest/v1/subscription_history`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    subscription_id: null,
                    action: 'membership_via_donation',
                    amount: membershipAmount,
                    created_at: new Date().toISOString()
                })
            });

            console.log('Donation-based membership activation completed successfully');
        } else {
            const errorText = await createSubResponse.text();
            console.error('Failed to create subscription:', errorText);
        }
    } catch (error) {
        console.error('Error processing donation-based membership:', error);
    }
}
