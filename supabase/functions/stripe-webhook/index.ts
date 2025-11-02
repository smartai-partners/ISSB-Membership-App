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
        // Only handle 2 essential event types
        switch (event.type) {
            case 'customer.subscription.updated':
                await handleSubscription(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            
            case 'invoice.payment_succeeded':
                await handlePayment(event.data.object, supabaseUrl, serviceRoleKey);
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
    const plans_table = 'plans'
    
    // Use the helper function to get subscription ID safely
    const subscriptionId = getSubscriptionId(invoice);

    if (!isCanceling) {
        console.log(`Subscription ${invoice.id} is not canceling, skipping.`);
        return;
    }
    await fetch(`${supabaseUrl}/rest/v1/${subscriptions_table}`, {
        method: 'POST', // upsert
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
    // Reset usage for new subscriptions and recurring payments (new billing cycle)
    if (!['subscription_cycle', 'subscription_create'].includes(invoice.billing_reason)) return;

    const customerId = invoice.customer;
    const subscriptions_table = 'subscriptions'
    const plans_table = 'plans'
    
    // Use helper functions to get data safely
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

    // 通过Stripe API查询customer信息获取user_id
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
            updated_at: new Date().toISOString()
        })
    });
    const rawText = await response.text();
    console.log("upsert data resp:", JSON.stringify(rawText));
    console.log(`Payment processed - stripe_subscription_id: ${subscriptionId} Customer: ${customerId}, Plan: ${planType}, Usage reset`);
}
        