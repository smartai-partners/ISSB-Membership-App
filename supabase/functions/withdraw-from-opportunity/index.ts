Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

        // Get opportunity ID from request
        const url = new URL(req.url);
        const opportunityId = url.searchParams.get('opportunityId');

        if (!opportunityId) {
            throw new Error('Opportunity ID is required');
        }

        // Find existing assignment
        const assignmentResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_assignments?opportunity_id=eq.${opportunityId}&user_id=eq.${userId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const assignments = await assignmentResponse.json();
        const assignment = assignments[0];

        if (!assignment) {
            throw new Error('You are not signed up for this opportunity');
        }

        // Check if hours have been logged
        const hoursResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?assignment_id=eq.${assignment.id}&select=count`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const hours = await hoursResponse.json();

        if (hours && hours.length > 0) {
            // Mark as cancelled instead of deleting if hours exist
            await fetch(
                `${supabaseUrl}/rest/v1/volunteer_assignments?id=eq.${assignment.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'cancelled' })
                }
            );
        } else {
            // Delete assignment if no hours logged
            const deleteResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_assignments?id=eq.${assignment.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    }
                }
            );

            if (!deleteResponse.ok) {
                throw new Error('Failed to withdraw from opportunity');
            }
        }

        // Decrement current_volunteers count
        const opportunityResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}&select=current_volunteers`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const opportunities = await opportunityResponse.json();
        const currentVolunteers = opportunities[0]?.current_volunteers || 0;

        await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_volunteers: Math.max(0, currentVolunteers - 1)
                })
            }
        );

        // Log audit trail
        await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                action: 'withdraw_from_opportunity',
                entity_type: 'volunteer_assignment',
                entity_id: assignment.id,
                old_values: { id: assignment.id, opportunity_id: opportunityId }
            })
        });

        return new Response(JSON.stringify({
            data: {
                message: 'Successfully withdrawn from opportunity'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Withdraw from opportunity error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'WITHDRAW_OPPORTUNITY_ERROR',
                message: error.message
            }
        }), {
            status: error.message.includes('not signed up') ? 404 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
