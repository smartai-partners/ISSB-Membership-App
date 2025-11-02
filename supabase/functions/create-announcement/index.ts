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

        // Get request body
        const body = await req.json();
        const {
            title,
            content,
            recipient_groups,
            is_published,
            send_email
        } = body;

        // Validate required fields
        if (!title || !content) {
            throw new Error('Missing required fields: title and content');
        }

        // Create announcement
        const announcementPayload: any = {
            title,
            content,
            author_id: userId,
            recipient_groups: recipient_groups || ['all_members'],
            is_published: is_published || false,
            send_email: send_email || false,
        };

        // Set published_at if publishing
        if (is_published) {
            announcementPayload.published_at = new Date().toISOString();
        }

        const createResponse = await fetch(`${supabaseUrl}/rest/v1/announcements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(announcementPayload)
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create announcement: ${errorText}`);
        }

        const newAnnouncement = await createResponse.json();

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
                action: 'create_announcement',
                entity_type: 'announcement',
                entity_id: newAnnouncement[0].id,
                new_values: announcementPayload
            })
        });

        return new Response(JSON.stringify({
            data: {
                announcement: newAnnouncement[0],
                message: 'Announcement created successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201
        });

    } catch (error: any) {
        console.error('Create announcement error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'CREATE_ANNOUNCEMENT_ERROR',
                message: error.message
            }
        }), {
            status: error.message.includes('Unauthorized') ? 403 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
