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

        // Get user from auth header (optional - supports both authenticated and public access)
        const authHeader = req.headers.get('authorization');
        let userId = null;
        let userRole = null;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            
            // Verify token and get user
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                userId = userData.id;

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
                userRole = profiles[0]?.role;
            }
        }

        // Parse query parameters
        const url = new URL(req.url);
        const limit = url.searchParams.get('limit') || '20';
        const offset = url.searchParams.get('offset') || '0';
        const includeUnpublished = url.searchParams.get('includeUnpublished') === 'true';

        // Build query
        let announcementsQuery = `${supabaseUrl}/rest/v1/announcements?select=*,profiles:author_id(id,first_name,last_name,email)&order=published_at.desc.nullslast,created_at.desc&limit=${limit}&offset=${offset}`;
        
        // Only admins can see unpublished announcements
        if (!includeUnpublished || (userRole !== 'admin' && userRole !== 'board_member')) {
            announcementsQuery += '&is_published=eq.true';
        }

        const announcementsResponse = await fetch(announcementsQuery, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
            }
        });

        if (!announcementsResponse.ok) {
            throw new Error('Failed to fetch announcements');
        }

        const announcements = await announcementsResponse.json();

        // Get total count
        let countQuery = `${supabaseUrl}/rest/v1/announcements?select=count`;
        if (!includeUnpublished || (userRole !== 'admin' && userRole !== 'board_member')) {
            countQuery += '&is_published=eq.true';
        }

        const countResponse = await fetch(countQuery, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Prefer': 'count=exact'
            }
        });

        const countData = await countResponse.json();
        const total = countData.length || 0;

        return new Response(JSON.stringify({
            data: {
                announcements: announcements,
                total: total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('List announcements error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'LIST_ANNOUNCEMENTS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
