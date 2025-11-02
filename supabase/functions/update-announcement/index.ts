Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
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

        // Get announcement ID from URL
        const url = new URL(req.url);
        const announcementId = url.searchParams.get('id');

        if (!announcementId) {
            throw new Error('Announcement ID is required');
        }

        // Get request body
        const body = await req.json();
        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };

        // Only include fields that are provided
        const allowedFields = [
            'title', 'content', 'recipient_groups', 'is_published', 'send_email'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updatePayload[field] = body[field];
            }
        }

        // If publishing for the first time, set published_at
        if (body.is_published === true) {
            // Check if already published
            const existingResponse = await fetch(
                `${supabaseUrl}/rest/v1/announcements?id=eq.${announcementId}&select=is_published,published_at`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    }
                }
            );
            
            const existing = await existingResponse.json();
            if (existing[0] && !existing[0].is_published && !existing[0].published_at) {
                updatePayload.published_at = new Date().toISOString();
            }
        }

        // Update announcement
        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/announcements?id=eq.${announcementId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updatePayload)
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update announcement: ${errorText}`);
        }

        const updatedAnnouncement = await updateResponse.json();

        if (!updatedAnnouncement || updatedAnnouncement.length === 0) {
            throw new Error('Announcement not found');
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
                action: 'update_announcement',
                entity_type: 'announcement',
                entity_id: announcementId,
                new_values: updatePayload
            })
        });

        return new Response(JSON.stringify({
            data: {
                announcement: updatedAnnouncement[0],
                message: 'Announcement updated successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Update announcement error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'UPDATE_ANNOUNCEMENT_ERROR',
                message: error.message
            }
        }), {
            status: error.message.includes('Unauthorized') ? 403 : error.message.includes('not found') ? 404 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
