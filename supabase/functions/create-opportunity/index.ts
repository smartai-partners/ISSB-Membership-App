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
            description,
            opportunity_type,
            status,
            start_date,
            end_date,
            hours_required,
            capacity,
            location,
            contact_person,
            contact_email,
            contact_phone,
            required_skills,
            category,
            image_url,
            date_time,
            duration_hours
        } = body;

        // Validate required fields
        if (!title || !description || !opportunity_type || !hours_required) {
            throw new Error('Missing required fields: title, description, opportunity_type, hours_required');
        }

        // Create opportunity
        const opportunityPayload = {
            title,
            description,
            opportunity_type,
            status: status || 'open',
            start_date,
            end_date,
            hours_required: parseFloat(hours_required),
            capacity: capacity ? parseInt(capacity) : null,
            current_volunteers: 0,
            location,
            contact_person,
            contact_email,
            contact_phone,
            required_skills: required_skills || [],
            category,
            image_url,
            date_time,
            duration_hours: duration_hours ? parseFloat(duration_hours) : null,
            created_by: userId
        };

        const createResponse = await fetch(`${supabaseUrl}/rest/v1/volunteer_opportunities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(opportunityPayload)
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create opportunity: ${errorText}`);
        }

        const newOpportunity = await createResponse.json();

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
                action: 'create_opportunity',
                entity_type: 'volunteer_opportunity',
                entity_id: newOpportunity[0].id,
                new_values: opportunityPayload
            })
        });

        return new Response(JSON.stringify({
            data: {
                opportunity: newOpportunity[0],
                message: 'Opportunity created successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201
        });

    } catch (error: any) {
        console.error('Create opportunity error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'CREATE_OPPORTUNITY_ERROR',
                message: error.message
            }
        }), {
            status: error.message.includes('Unauthorized') ? 403 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
