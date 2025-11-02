Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

        // Check if user is admin
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}&select=role`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const profiles = await profileResponse.json();
        const profile = profiles[0];

        if (!profile || profile.role !== 'admin') {
            throw new Error('Unauthorized: Admin access required');
        }

        // Get all active subscriptions with activation method
        const subsResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?status=eq.active&select=activation_method`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const subscriptions = await subsResponse.json();

        // Count by activation method (payment vs volunteer)
        const activationCounts = {
            payment: 0,
            volunteer: 0,
            donation: 0
        };

        subscriptions.forEach((sub: any) => {
            const method = sub.activation_method || 'payment';
            if (method === 'volunteer') {
                activationCounts.volunteer += 1;
            } else if (method === 'donation') {
                activationCounts.donation += 1;
            } else {
                activationCounts.payment += 1;
            }
        });

        // Calculate revenue: $360/year = $30/month per active member
        // Only count paid and donation-based memberships (volunteer-based generate no revenue)
        const paidMemberships = activationCounts.payment + activationCounts.donation;
        const monthlyRevenue = paidMemberships * 30; // $30/month per paid member

        // Get recent subscription activity
        const historyResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscription_history?order=created_at.desc&limit=20`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const recentActivity = await historyResponse.json();

        // Calculate monthly recurring revenue (MRR)
        const mrr = monthlyRevenue;
        const annualRecurringRevenue = mrr * 12;

        return new Response(JSON.stringify({
            data: {
                summary: {
                    totalSubscriptions: subscriptions.length,
                    activationCounts,
                    paidMemberships,
                    monthlyRecurringRevenue: mrr,
                    annualRecurringRevenue
                },
                recentActivity
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Get membership analytics error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'ANALYTICS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
