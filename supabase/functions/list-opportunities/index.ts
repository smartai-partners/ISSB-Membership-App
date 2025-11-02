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
        const userId = userData.id;

        // Get user role
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const profiles = await profileResponse.json();
        const userRole = profiles[0]?.role;

        // Parse query parameters
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const category = url.searchParams.get('category');
        const includeUserAssignments = url.searchParams.get('includeUserAssignments') === 'true';

        // Build query for opportunities
        let opportunitiesQuery = `${supabaseUrl}/rest/v1/volunteer_opportunities?select=*&order=start_date.asc`;
        
        // Members can only see open opportunities, admins see all
        if (userRole !== 'admin' && userRole !== 'board_member') {
            opportunitiesQuery += '&status=eq.open';
        } else if (status) {
            opportunitiesQuery += `&status=eq.${status}`;
        }

        if (category) {
            opportunitiesQuery += `&category=eq.${category}`;
        }

        const opportunitiesResponse = await fetch(opportunitiesQuery, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
            }
        });

        let opportunities = await opportunitiesResponse.json();

        // If includeUserAssignments is true, fetch user's assignments
        if (includeUserAssignments) {
            const assignmentsResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_assignments?user_id=eq.${userId}&select=opportunity_id,status`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    }
                }
            );

            const assignments = await assignmentsResponse.json();
            const assignmentMap = new Map(assignments.map((a: any) => [a.opportunity_id, a.status]));

            // Enrich opportunities with user's assignment status
            opportunities = opportunities.map((opp: any) => ({
                ...opp,
                userAssignmentStatus: assignmentMap.get(opp.id) || null
            }));
        }

        return new Response(JSON.stringify({
            data: {
                opportunities: opportunities,
                total: opportunities.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('List opportunities error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'LIST_OPPORTUNITIES_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
