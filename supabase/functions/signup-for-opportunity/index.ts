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

        // Get opportunity ID from request
        const { opportunityId } = await req.json();

        if (!opportunityId) {
            throw new Error('Opportunity ID is required');
        }

        // Verify opportunity exists and is active
        const opportunityResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const opportunities = await opportunityResponse.json();
        const opportunity = opportunities[0];

        if (!opportunity) {
            throw new Error('Opportunity not found');
        }

        if (opportunity.status !== 'open') {
            throw new Error('This opportunity is not currently accepting sign-ups');
        }

        // Check capacity
        if (opportunity.capacity && opportunity.current_volunteers >= opportunity.capacity) {
            throw new Error('This opportunity is currently full');
        }

        // Check if user already signed up
        const existingAssignmentResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_assignments?opportunity_id=eq.${opportunityId}&user_id=eq.${userId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const existingAssignments = await existingAssignmentResponse.json();

        if (existingAssignments && existingAssignments.length > 0) {
            throw new Error('You are already signed up for this opportunity');
        }

        // Create assignment
        const assignmentPayload = {
            opportunity_id: opportunityId,
            user_id: userId,
            status: 'confirmed',
            assigned_date: new Date().toISOString()
        };

        const createAssignmentResponse = await fetch(`${supabaseUrl}/rest/v1/volunteer_assignments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(assignmentPayload)
        });

        if (!createAssignmentResponse.ok) {
            const errorText = await createAssignmentResponse.text();
            throw new Error(`Failed to create assignment: ${errorText}`);
        }

        const newAssignment = await createAssignmentResponse.json();

        // Increment current_volunteers count
        await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_volunteers: opportunity.current_volunteers + 1
                })
            }
        );

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
                action: 'signup_for_opportunity',
                entity_type: 'volunteer_assignment',
                entity_id: newAssignment[0].id,
                new_values: assignmentPayload
            })
        });

        return new Response(JSON.stringify({
            data: {
                assignment: newAssignment[0],
                message: 'Successfully signed up for opportunity'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201
        });

    } catch (error: any) {
        console.error('Signup for opportunity error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'SIGNUP_OPPORTUNITY_ERROR',
                message: error.message
            }
        }), {
            status: error.message.includes('not found') ? 404 : error.message.includes('full') || error.message.includes('already signed up') ? 400 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
