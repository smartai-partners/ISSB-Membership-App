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

        // Get total subscriptions by tier
        const subsResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?status=eq.active&select=price_id`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const subscriptions = await subsResponse.json();

        // Count by tier
        const tierCounts = {
            student: 0,
            individual: 0,
            family: 0
        };

        let totalRevenue = 0;

        subscriptions.forEach((sub: any) => {
            if (sub.price_id === 'student_free') {
                tierCounts.student += 1;
            } else if (sub.price_id.includes('individual')) {
                tierCounts.individual += 1;
                totalRevenue += 50; // $50/month
            } else if (sub.price_id.includes('family')) {
                tierCounts.family += 1;
                totalRevenue += 150; // $150/month
            }
        });

        // Get total family members
        const membersResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscription_members?select=id`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const members = await membersResponse.json();
        const totalFamilyMembers = members.length;

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
        const mrr = totalRevenue;
        const annualRecurringRevenue = mrr * 12;

        return new Response(JSON.stringify({
            data: {
                summary: {
                    totalSubscriptions: subscriptions.length,
                    tierCounts,
                    totalFamilyMembers,
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
