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

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase configuration');
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
        const userEmail = userData.email;

        // Check if user already has an active subscription
        const existingSubsResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&status=eq.active`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const existingSubs = await existingSubsResponse.json();
        if (existingSubs && existingSubs.length > 0) {
            throw new Error('You already have an active subscription');
        }

        // Create a student tier "subscription" record (no Stripe)
        const subscriptionId = `student_${userId}_${Date.now()}`;

        const insertResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: userId,
                    stripe_subscription_id: subscriptionId,
                    stripe_customer_id: `student_${userId}`,
                    price_id: 'student_free',
                    status: 'active'
                })
            }
        );

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Failed to create student subscription: ${errorText}`);
        }

        const newSubscription = await insertResponse.json();

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
                subscription_id: subscriptionId,
                action: 'created',
                to_tier: 'student',
                amount: 0
            })
        });

        return new Response(JSON.stringify({
            data: {
                subscription: newSubscription[0],
                message: 'Student tier activated successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Create student subscription error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'STUDENT_SUBSCRIPTION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
