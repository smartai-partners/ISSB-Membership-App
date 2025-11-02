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

        // Verify admin role
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

        if (userRole !== 'admin' && userRole !== 'board_member') {
            throw new Error('Unauthorized: Admin access required');
        }

        // Get opportunity ID from URL
        const url = new URL(req.url);
        const opportunityId = url.searchParams.get('id');

        if (!opportunityId) {
            throw new Error('Opportunity ID is required');
        }

        // Check if opportunity has assignments
        const assignmentsResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_assignments?opportunity_id=eq.${opportunityId}&select=count`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const assignments = await assignmentsResponse.json();
        
        if (assignments && assignments.length > 0) {
            // Instead of deleting, mark as cancelled if it has assignments
            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
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

            if (!updateResponse.ok) {
                throw new Error('Failed to cancel opportunity');
            }

            return new Response(JSON.stringify({
                data: {
                    message: 'Opportunity marked as cancelled (has existing assignments)'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Delete opportunity if no assignments
        const deleteResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            throw new Error(`Failed to delete opportunity: ${errorText}`);
        }

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
                action: 'delete_opportunity',
                entity_type: 'volunteer_opportunity',
                entity_id: opportunityId,
                old_values: { id: opportunityId }
            })
        });

        return new Response(JSON.stringify({
            data: {
                message: 'Opportunity deleted successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Delete opportunity error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'DELETE_OPPORTUNITY_ERROR',
                message: error.message
            }
        }), {
            status: error.message.includes('Unauthorized') ? 403 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
