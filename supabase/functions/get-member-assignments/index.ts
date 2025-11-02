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

        // Get query parameters
        const url = new URL(req.url);
        const status = url.searchParams.get('status');

        // Build query for assignments
        let assignmentsQuery = `${supabaseUrl}/rest/v1/volunteer_assignments?user_id=eq.${userId}&select=*,volunteer_opportunities(*)&order=assigned_date.desc`;

        if (status) {
            assignmentsQuery += `&status=eq.${status}`;
        }

        const assignmentsResponse = await fetch(assignmentsQuery, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
            }
        });

        const assignments = await assignmentsResponse.json();

        // Enrich assignments with hours logged data
        const enrichedAssignments = await Promise.all(
            assignments.map(async (assignment: any) => {
                const hoursResponse = await fetch(
                    `${supabaseUrl}/rest/v1/volunteer_hours?assignment_id=eq.${assignment.id}&select=id,hours,status,date&order=date.desc`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                        }
                    }
                );

                const hours = await hoursResponse.json();
                const totalHours = hours.reduce((sum: number, h: any) => {
                    if (h.status === 'approved') {
                        return sum + parseFloat(h.hours);
                    }
                    return sum;
                }, 0);

                return {
                    ...assignment,
                    hours_entries: hours,
                    total_approved_hours: totalHours
                };
            })
        );

        return new Response(JSON.stringify({
            data: {
                assignments: enrichedAssignments,
                total: enrichedAssignments.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Get member assignments error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'GET_ASSIGNMENTS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
