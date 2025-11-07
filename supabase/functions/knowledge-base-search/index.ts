// Knowledge Base Search Edge Function
// Searches and retrieves relevant KB articles

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
        const { query, category, limit = 10 } = await req.json();

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

        // Get user profile to check role
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        let userRole = 'regular';
        if (profileResponse.ok) {
            const profiles = await profileResponse.json();
            if (profiles.length > 0) {
                userRole = profiles[0].role || 'regular';
            }
        }

        // Build query parameters
        let queryParams = 'is_published=eq.true';
        
        if (category) {
            queryParams += `&category=eq.${category}`;
        }

        // Filter by access level based on user role
        if (userRole === 'admin' || userRole === 'board') {
            // Admins and board can see all articles
        } else {
            queryParams += `&access_level=eq.all`;
        }

        // Search in title and content if query provided
        if (query) {
            queryParams += `&or=(title.ilike.*${query}*,content.ilike.*${query}*)`;
        }

        queryParams += `&limit=${limit}&order=helpful_count.desc`;

        // Fetch articles
        const articlesResponse = await fetch(
            `${supabaseUrl}/rest/v1/knowledge_base_articles?${queryParams}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!articlesResponse.ok) {
            throw new Error('Failed to fetch articles');
        }

        const articles = await articlesResponse.json();

        return new Response(JSON.stringify({
            data: articles
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Knowledge base search error:', error);

        const errorResponse = {
            error: {
                code: 'KB_SEARCH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
