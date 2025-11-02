Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

        if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
            throw new Error('Missing configuration');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        const { action } = await req.json();

        // Get current subscription
        const subsResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&status=eq.active&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const subscriptions = await subsResponse.json();
        const currentSubscription = subscriptions[0];

        if (!currentSubscription) {
            throw new Error('No active subscription found');
        }

        // Only cancel action is supported in single-tier model
        if (action === 'cancel') {
            const subscriptionId = currentSubscription.stripe_subscription_id;

            // Only cancel Stripe subscriptions (not volunteer-activated ones)
            if (subscriptionId && currentSubscription.activation_method === 'payment') {
                const cancelResponse = await fetch(
                    `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${stripeSecretKey}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: 'cancel_at_period_end=true'
                    }
                );

                if (!cancelResponse.ok) {
                    const errorText = await cancelResponse.text();
                    throw new Error(`Failed to cancel subscription: ${errorText}`);
                }
            } else if (currentSubscription.activation_method === 'volunteer') {
                // For volunteer-activated subscriptions, mark as cancelled directly
                await fetch(
                    `${supabaseUrl}/rest/v1/subscriptions?id=eq.${currentSubscription.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            status: 'cancelled',
                            updated_at: new Date().toISOString()
                        })
                    }
                );
            }

            // Log to history
            await fetch(`${supabaseUrl}/rest/v1/subscription_history`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    subscription_id: subscriptionId || `volunteer_${currentSubscription.id}`,
                    action: 'cancel',
                    from_tier: currentSubscription.price_id || 'volunteer_membership'
                })
            });

            const message = currentSubscription.activation_method === 'payment' 
                ? 'Subscription will be cancelled at the end of the billing period'
                : 'Membership has been cancelled';

            return new Response(JSON.stringify({
                data: { message }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('Invalid action. Only "cancel" is supported in single-tier model');
        }

    } catch (error: any) {
        console.error('Manage subscription error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'SUBSCRIPTION_MANAGEMENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
