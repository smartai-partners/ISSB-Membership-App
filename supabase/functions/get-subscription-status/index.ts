Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

        // Get subscription
        const subsResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&select=*,plans(*)`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const subscriptions = await subsResponse.json();
        const activeSubscription = subscriptions.find((s: any) => s.status === 'active' || s.status === 'pending');

        // Get family members if family tier
        let familyMembers = [];
        if (activeSubscription && activeSubscription.stripe_subscription_id) {
            const membersResponse = await fetch(
                `${supabaseUrl}/rest/v1/subscription_members?subscription_id=eq.${activeSubscription.stripe_subscription_id}&order=created_at.asc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    }
                }
            );
            familyMembers = await membersResponse.json();
        }

        // Get subscription history
        const historyResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscription_history?user_id=eq.${userId}&order=created_at.desc&limit=10`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );
        const history = await historyResponse.json();

        return new Response(JSON.stringify({
            data: {
                subscription: activeSubscription || null,
                familyMembers: familyMembers || [],
                history: history || []
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Get subscription status error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'SUBSCRIPTION_STATUS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
