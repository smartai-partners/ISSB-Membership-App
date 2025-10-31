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
        const { opportunityId, action, memberId } = await req.json();

        if (!opportunityId || !action || !memberId) {
            throw new Error('opportunityId, action, and memberId are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get current opportunity details
        const opportunityResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!opportunityResponse.ok) {
            throw new Error('Failed to fetch opportunity');
        }

        const opportunities = await opportunityResponse.json();
        if (opportunities.length === 0) {
            throw new Error('Opportunity not found');
        }

        const opportunity = opportunities[0];
        const currentVolunteers = opportunity.current_volunteers || 0;
        const maxVolunteers = opportunity.capacity || opportunity.max_volunteers || 0;

        let newCount = currentVolunteers;
        let signupStatus = 'PENDING';

        if (action === 'signup') {
            // Check if already signed up
            const checkSignupResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups?opportunity_id=eq.${opportunityId}&member_id=eq.${memberId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const existingSignups = await checkSignupResponse.json();
            if (existingSignups.length > 0) {
                throw new Error('Already signed up for this opportunity');
            }

            // Check capacity
            if (maxVolunteers > 0 && currentVolunteers >= maxVolunteers) {
                throw new Error('This opportunity is at full capacity');
            }

            newCount = currentVolunteers + 1;
            signupStatus = 'CONFIRMED';

            // Create signup record
            const createSignupResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        opportunity_id: opportunityId,
                        member_id: memberId,
                        status: signupStatus,
                        confirmed_at: new Date().toISOString()
                    })
                }
            );

            if (!createSignupResponse.ok) {
                const errorText = await createSignupResponse.text();
                throw new Error(`Failed to create signup: ${errorText}`);
            }

        } else if (action === 'withdraw') {
            // Check if signed up
            const checkSignupResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups?opportunity_id=eq.${opportunityId}&member_id=eq.${memberId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const existingSignups = await checkSignupResponse.json();
            if (existingSignups.length === 0) {
                throw new Error('No signup found for this opportunity');
            }

            const signup = existingSignups[0];

            // Update signup to cancelled
            const updateSignupResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups?id=eq.${signup.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'CANCELLED',
                        cancelled_at: new Date().toISOString()
                    })
                }
            );

            if (!updateSignupResponse.ok) {
                throw new Error('Failed to cancel signup');
            }

            newCount = Math.max(0, currentVolunteers - 1);
        }

        // Update opportunity capacity
        const updateOpportunityResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    current_volunteers: newCount,
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!updateOpportunityResponse.ok) {
            const errorText = await updateOpportunityResponse.text();
            throw new Error(`Failed to update opportunity: ${errorText}`);
        }

        const updatedOpportunity = await updateOpportunityResponse.json();

        return new Response(JSON.stringify({
            data: {
                success: true,
                opportunity: updatedOpportunity[0],
                action: action,
                newCapacity: newCount
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Capacity management error:', error);

        const errorResponse = {
            error: {
                code: 'CAPACITY_MANAGEMENT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
