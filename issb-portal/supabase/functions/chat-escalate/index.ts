// Chat Escalate Edge Function
// Escalates a conversation to human agent

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
        const { sessionId, reason, priority = 'medium' } = await req.json();

        if (!sessionId || !reason) {
            throw new Error('Session ID and reason are required');
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

        // Verify session exists and belongs to user
        const sessionResponse = await fetch(
            `${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}&user_id=eq.${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!sessionResponse.ok) {
            throw new Error('Session not found');
        }

        const sessions = await sessionResponse.json();
        if (sessions.length === 0) {
            throw new Error('Unauthorized access to session');
        }

        // Create escalation request
        const escalationResponse = await fetch(`${supabaseUrl}/rest/v1/escalation_requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                session_id: sessionId,
                user_id: userId,
                reason,
                priority,
                status: 'pending'
            })
        });

        if (!escalationResponse.ok) {
            const errorText = await escalationResponse.text();
            throw new Error(`Failed to create escalation: ${errorText}`);
        }

        const escalationData = await escalationResponse.json();

        // Add system message to chat
        await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId,
                sender_type: 'assistant',
                content: 'Your conversation has been escalated to a human agent. An admin will review your request and respond soon.',
                metadata: {
                    type: 'system',
                    escalation_id: escalationData[0].id
                }
            })
        });

        return new Response(JSON.stringify({
            data: escalationData[0]
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Escalation error:', error);

        const errorResponse = {
            error: {
                code: 'ESCALATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
