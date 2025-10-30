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
        const applicationData = await req.json();

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

        // Create application record
        const applicationPayload = {
            user_id: userId,
            membership_tier: applicationData.membership_tier,
            first_name: applicationData.first_name,
            last_name: applicationData.last_name,
            email: applicationData.email,
            phone: applicationData.phone,
            address: applicationData.address,
            city: applicationData.city,
            state: applicationData.state,
            zip_code: applicationData.zip_code,
            date_of_birth: applicationData.date_of_birth,
            occupation: applicationData.occupation || null,
            employer: applicationData.employer || null,
            emergency_contact_name: applicationData.emergency_contact_name,
            emergency_contact_phone: applicationData.emergency_contact_phone,
            emergency_contact_relationship: applicationData.emergency_contact_relationship,
            reason_for_joining: applicationData.reason_for_joining || null,
            how_did_you_hear: applicationData.how_did_you_hear || null,
            agreed_to_terms: applicationData.agreed_to_terms || false,
            agreed_to_code_of_conduct: applicationData.agreed_to_code_of_conduct || false,
            reference_1_name: applicationData.reference_1_name || null,
            reference_1_email: applicationData.reference_1_email || null,
            reference_1_phone: applicationData.reference_1_phone || null,
            reference_2_name: applicationData.reference_2_name || null,
            reference_2_email: applicationData.reference_2_email || null,
            reference_2_phone: applicationData.reference_2_phone || null,
            status: 'pending'
        };

        // Insert application
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/applications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(applicationPayload)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Application submission failed: ${errorText}`);
        }

        const applicationResult = await insertResponse.json();
        const application = applicationResult[0];

        // Log audit trail
        const auditPayload = {
            user_id: userId,
            action: 'submit_application',
            entity_type: 'applications',
            entity_id: application.id,
            new_values: applicationPayload
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
                application: application,
                message: 'Application submitted successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201
        });

    } catch (error) {
        console.error('Application submission error:', error);

        const errorResponse = {
            error: {
                code: 'APPLICATION_SUBMISSION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
