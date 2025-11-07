// Admin Escalation Management Edge Function
// Manages escalation requests for admins

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
        const { action, escalationId, updates } = await req.json();

        if (!action) {
            throw new Error('Action is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
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

        // Verify user is admin or board
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!profileResponse.ok) {
            throw new Error('Failed to fetch profile');
        }

        const profiles = await profileResponse.json();
        if (profiles.length === 0 || !['admin', 'board'].includes(profiles[0].role)) {
            throw new Error('Unauthorized: Admin or Board access required');
        }

        let result;

        switch (action) {
            case 'list': {
                // List all escalation requests with filters
                const { status, priority, limit = 50 } = updates || {};
                let queryParams = '';
                
                if (status) {
                    queryParams += `status=eq.${status}&`;
                }
                if (priority) {
                    queryParams += `priority=eq.${priority}&`;
                }
                
                queryParams += `limit=${limit}&order=created_at.desc`;

                const escalationsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/escalation_requests?${queryParams}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                if (!escalationsResponse.ok) {
                    throw new Error('Failed to fetch escalations');
                }

                result = await escalationsResponse.json();
                break;
            }

            case 'update': {
                if (!escalationId) {
                    throw new Error('Escalation ID is required for update');
                }

                const updateData = {
                    ...updates,
                    updated_at: new Date().toISOString()
                };

                // If resolving, add resolved_at timestamp
                if (updates.status === 'resolved' || updates.status === 'closed') {
                    updateData.resolved_at = new Date().toISOString();
                }

                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/escalation_requests?id=eq.${escalationId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(updateData)
                    }
                );

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update escalation: ${errorText}`);
                }

                result = await updateResponse.json();
                
                // If resolution notes provided, add to chat
                if (updates.resolution_notes && updates.status === 'resolved') {
                    const escalation = result[0];
                    await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            session_id: escalation.session_id,
                            sender_type: 'assistant',
                            content: `Resolution from admin: ${updates.resolution_notes}`,
                            metadata: {
                                type: 'admin_response',
                                escalation_id: escalationId,
                                admin_id: userId
                            }
                        })
                    });
                }
                break;
            }

            case 'assign': {
                if (!escalationId) {
                    throw new Error('Escalation ID is required for assignment');
                }

                const assignResponse = await fetch(
                    `${supabaseUrl}/rest/v1/escalation_requests?id=eq.${escalationId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            assigned_to: updates.assignedTo || userId,
                            status: 'in_progress',
                            updated_at: new Date().toISOString()
                        })
                    }
                );

                if (!assignResponse.ok) {
                    throw new Error('Failed to assign escalation');
                }

                result = await assignResponse.json();
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin escalation management error:', error);

        const errorResponse = {
            error: {
                code: 'ESCALATION_MANAGEMENT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
