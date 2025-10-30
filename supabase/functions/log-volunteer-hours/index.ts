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
        const { hours, date, description, opportunityId, assignmentId } = await req.json();

        if (!hours || !date || !description) {
            throw new Error('Hours, date, and description are required');
        }

        // Get environment variables
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

        // Create volunteer hours record
        const hoursPayload = {
            user_id: userId,
            opportunity_id: opportunityId || null,
            assignment_id: assignmentId || null,
            hours: parseFloat(hours),
            date: date,
            description: description,
            status: 'pending'
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/volunteer_hours`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(hoursPayload)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Failed to log volunteer hours: ${errorText}`);
        }

        const volunteerHoursResult = await insertResponse.json();
        const volunteerHours = volunteerHoursResult[0];

        // Update assignment if provided
        if (assignmentId) {
            await fetch(
                `${supabaseUrl}/rest/v1/volunteer_assignments?id=eq.${assignmentId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        hours_logged: parseFloat(hours)
                    })
                }
            );
        }

        // Log audit trail
        const auditPayload = {
            user_id: userId,
            action: 'log_volunteer_hours',
            entity_type: 'volunteer_hours',
            entity_id: volunteerHours.id,
            new_values: hoursPayload
        };

        await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(auditPayload)
        });

        return new Response(JSON.stringify({
            data: {
                volunteerHours: volunteerHours,
                message: 'Volunteer hours logged successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201
        });

    } catch (error) {
        console.error('Volunteer hours logging error:', error);

        const errorResponse = {
            error: {
                code: 'VOLUNTEER_HOURS_LOG_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
