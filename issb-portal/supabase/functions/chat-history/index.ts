// Chat History Edge Function
// Retrieves conversation history for a session

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
        const { sessionId, limit = 50 } = await req.json();

        if (!sessionId) {
            throw new Error('Session ID is required');
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

        // Verify user owns the session
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

        // Get chat messages
        const messagesResponse = await fetch(
            `${supabaseUrl}/rest/v1/chat_messages?session_id=eq.${sessionId}&order=created_at.asc&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!messagesResponse.ok) {
            throw new Error('Failed to fetch messages');
        }

        const messages = await messagesResponse.json();

        return new Response(JSON.stringify({
            data: {
                session: sessions[0],
                messages
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chat history error:', error);

        const errorResponse = {
            error: {
                code: 'HISTORY_FETCH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
