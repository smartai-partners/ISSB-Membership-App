Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch all volunteer opportunities
        const opportunitiesResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!opportunitiesResponse.ok) {
            throw new Error('Failed to fetch opportunities');
        }

        const opportunities = await opportunitiesResponse.json();

        // Fetch all volunteer signups
        const signupsResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_signups?select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!signupsResponse.ok) {
            throw new Error('Failed to fetch signups');
        }

        const signups = await signupsResponse.json();

        // Fetch all volunteer hours
        const hoursResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!hoursResponse.ok) {
            throw new Error('Failed to fetch volunteer hours');
        }

        const hours = await hoursResponse.json();

        // Calculate analytics
        const totalOpportunities = opportunities.length;
        const activeOpportunities = opportunities.filter(o => 
            o.status === 'ACTIVE' || o.status === 'open'
        ).length;

        const totalSignups = signups.length;
        const confirmedSignups = signups.filter(s => s.status === 'CONFIRMED').length;
        const completedSignups = signups.filter(s => s.status === 'COMPLETED').length;
        const cancelledSignups = signups.filter(s => s.status === 'CANCELLED').length;

        const totalHoursLogged = hours.reduce((sum, h) => sum + parseFloat(h.hours || 0), 0);
        const approvedHours = hours.filter(h => h.status === 'APPROVED');
        const totalApprovedHours = approvedHours.reduce((sum, h) => sum + parseFloat(h.hours || 0), 0);
        const pendingHours = hours.filter(h => h.status === 'PENDING').length;

        // Unique volunteers
        const uniqueVolunteers = new Set(hours.map(h => h.user_id)).size;

        // Waiver eligibility
        const volunteerHoursByMember = {};
        approvedHours.forEach(h => {
            if (!volunteerHoursByMember[h.user_id]) {
                volunteerHoursByMember[h.user_id] = 0;
            }
            volunteerHoursByMember[h.user_id] += parseFloat(h.hours || 0);
        });

        const waiverEligibleMembers = Object.values(volunteerHoursByMember)
            .filter(total => total >= 30).length;

        // Capacity utilization
        const opportunitiesWithCapacity = opportunities.filter(o => 
            (o.capacity || o.max_volunteers) > 0
        );
        
        const avgCapacityUtilization = opportunitiesWithCapacity.length > 0
            ? opportunitiesWithCapacity.reduce((sum, o) => {
                const maxVol = o.capacity || o.max_volunteers || 1;
                const currentVol = o.current_volunteers || 0;
                return sum + (currentVol / maxVol * 100);
            }, 0) / opportunitiesWithCapacity.length
            : 0;

        // Top opportunities by sign-ups
        const signupsByOpportunity = {};
        signups.forEach(s => {
            if (!signupsByOpportunity[s.opportunity_id]) {
                signupsByOpportunity[s.opportunity_id] = 0;
            }
            signupsByOpportunity[s.opportunity_id]++;
        });

        const topOpportunities = opportunities
            .map(o => ({
                id: o.id,
                title: o.title,
                signups: signupsByOpportunity[o.id] || 0,
                currentVolunteers: o.current_volunteers || 0,
                capacity: o.capacity || o.max_volunteers || 0
            }))
            .sort((a, b) => b.signups - a.signups)
            .slice(0, 5);

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentSignups = signups.filter(s => 
            new Date(s.signed_up_at) > sevenDaysAgo
        ).length;

        const recentHoursLogged = hours.filter(h => 
            new Date(h.created_at) > sevenDaysAgo
        ).length;

        return new Response(JSON.stringify({
            data: {
                overview: {
                    totalOpportunities,
                    activeOpportunities,
                    totalSignups,
                    confirmedSignups,
                    completedSignups,
                    cancelledSignups,
                    uniqueVolunteers,
                    waiverEligibleMembers
                },
                hours: {
                    totalHoursLogged,
                    totalApprovedHours,
                    pendingApprovals: pendingHours,
                    avgHoursPerVolunteer: uniqueVolunteers > 0 
                        ? (totalApprovedHours / uniqueVolunteers).toFixed(2) 
                        : 0
                },
                capacity: {
                    avgUtilization: avgCapacityUtilization.toFixed(2),
                    opportunitiesWithCapacity: opportunitiesWithCapacity.length
                },
                topOpportunities,
                recentActivity: {
                    last7DaysSignups: recentSignups,
                    last7DaysHoursLogged: recentHoursLogged
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics error:', error);

        const errorResponse = {
            error: {
                code: 'ANALYTICS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
