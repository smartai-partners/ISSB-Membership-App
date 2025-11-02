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

        // Get user's subscription status
        const subscriptionResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const subscriptions = await subscriptionResponse.json();
        const activeSubscription = subscriptions.find((s: any) => s.status === 'active' || s.status === 'pending');

        // Get volunteer hours for membership
        const volunteerHoursResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?user_id=eq.${userId}&counts_toward_waiver=eq.true&select=*&order=created_at.desc`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const volunteerHours = await volunteerHoursResponse.json();

        // Calculate totals
        const approvedHours = volunteerHours.filter((h: any) => h.status === 'approved');
        const pendingHours = volunteerHours.filter((h: any) => h.status === 'pending');
        const totalApprovedHours = approvedHours.reduce((sum: number, h: any) => sum + parseFloat(h.hours), 0);
        const totalPendingHours = pendingHours.reduce((sum: number, h: any) => sum + parseFloat(h.hours), 0);

        return new Response(JSON.stringify({
            data: {
                subscription: activeSubscription || null,
                volunteerHours: volunteerHours,
                summary: {
                    totalApprovedHours: totalApprovedHours,
                    totalPendingHours: totalPendingHours,
                    hoursNeeded: Math.max(0, 30 - totalApprovedHours),
                    percentageComplete: Math.min(100, (totalApprovedHours / 30) * 100),
                    membershipActivated: totalApprovedHours >= 30
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Get volunteer progress error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'VOLUNTEER_PROGRESS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
