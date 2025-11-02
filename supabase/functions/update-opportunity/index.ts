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

        // Get opportunity ID from URL
        const url = new URL(req.url);
        const opportunityId = url.searchParams.get('id');

        if (!opportunityId) {
            throw new Error('Opportunity ID is required');
        }

        // Get request body
        const body = await req.json();
        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };

        // Only include fields that are provided
        const allowedFields = [
            'title', 'description', 'opportunity_type', 'status',
            'start_date', 'end_date', 'hours_required', 'capacity',
            'location', 'contact_person', 'contact_email', 'contact_phone',
            'required_skills', 'category', 'image_url', 'date_time', 'duration_hours'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === 'hours_required' || field === 'duration_hours') {
                    updatePayload[field] = parseFloat(body[field]);
                } else if (field === 'capacity') {
                    updatePayload[field] = parseInt(body[field]);
                } else {
                    updatePayload[field] = body[field];
                }
            }
        }

        // Update opportunity
        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
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
            throw new Error(`Failed to update opportunity: ${errorText}`);
        }

        const updatedOpportunity = await updateResponse.json();

        if (!updatedOpportunity || updatedOpportunity.length === 0) {
            throw new Error('Opportunity not found');
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
                action: 'update_opportunity',
                entity_type: 'volunteer_opportunity',
                entity_id: opportunityId,
                new_values: updatePayload
            })
        });

        return new Response(JSON.stringify({
            data: {
                opportunity: updatedOpportunity[0],
                message: 'Opportunity updated successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Update opportunity error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'UPDATE_OPPORTUNITY_ERROR',
                message: error.message
            }
        }), {
            status: error.message.includes('Unauthorized') ? 403 : error.message.includes('not found') ? 404 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
