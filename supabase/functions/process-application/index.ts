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
        const { applicationId, action, notes, rejectionReason } = await req.json();

        if (!applicationId || !action) {
            throw new Error('Application ID and action are required');
        }

        if (!['approve', 'reject'].includes(action)) {
            throw new Error('Invalid action. Must be approve or reject');
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
        const reviewerId = userData.id;

        // Check if reviewer is admin or board member
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${reviewerId}&select=role`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!profileResponse.ok) {
            throw new Error('Failed to verify reviewer permissions');
        }

        const profiles = await profileResponse.json();
        if (!profiles.length || !['admin', 'board'].includes(profiles[0].role)) {
            throw new Error('Insufficient permissions to process applications');
        }

        // Get application details
        const appResponse = await fetch(
            `${supabaseUrl}/rest/v1/applications?id=eq.${applicationId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!appResponse.ok) {
            throw new Error('Application not found');
        }

        const applications = await appResponse.json();
        const application = applications[0];

        if (!application) {
            throw new Error('Application not found');
        }

        // Update application status
        const updatePayload = {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
            review_notes: notes || null,
            rejection_reason: action === 'reject' ? rejectionReason : null
        };

        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/applications?id=eq.${applicationId}`,
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
            throw new Error(`Failed to update application: ${errorText}`);
        }

        const updatedApplication = await updateResponse.json();

        // If approved, create membership and update profile
        if (action === 'approve') {
            const today = new Date();
            const endDate = new Date(today);
            endDate.setFullYear(endDate.getFullYear() + 1);

            // Get membership fee from settings
            const feeKey = `${application.membership_tier}_membership_fee`;
            const settingsResponse = await fetch(
                `${supabaseUrl}/rest/v1/system_settings?key=eq.${feeKey}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            let membershipFee = 0;
            if (settingsResponse.ok) {
                const settings = await settingsResponse.json();
                if (settings.length > 0) {
                    membershipFee = parseFloat(settings[0].value);
                }
            }

            // Get volunteer hours requirement for students
            let volunteerHoursRequired = 0;
            if (application.membership_tier === 'student') {
                const hoursResponse = await fetch(
                    `${supabaseUrl}/rest/v1/system_settings?key=eq.student_volunteer_hours`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                if (hoursResponse.ok) {
                    const hoursSettings = await hoursResponse.json();
                    if (hoursSettings.length > 0) {
                        volunteerHoursRequired = parseInt(hoursSettings[0].value);
                    }
                }
            }

            // Create membership
            const membershipPayload = {
                user_id: application.user_id,
                tier: application.membership_tier,
                status: 'pending',
                start_date: today.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                amount: membershipFee,
                payment_status: 'pending',
                volunteer_hours_required: volunteerHoursRequired,
                volunteer_hours_completed: 0
            };

            const membershipResponse = await fetch(`${supabaseUrl}/rest/v1/memberships`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(membershipPayload)
            });

            if (!membershipResponse.ok) {
                const errorText = await membershipResponse.text();
                console.error('Failed to create membership:', errorText);
            }

            // Update profile
            const profileUpdatePayload = {
                role: application.membership_tier === 'student' ? 'student' : 'member',
                membership_tier: application.membership_tier,
                status: 'active'
            };

            await fetch(
                `${supabaseUrl}/rest/v1/profiles?id=eq.${application.user_id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(profileUpdatePayload)
                }
            );
        }

        // Log audit trail
        const auditPayload = {
            user_id: reviewerId,
            action: `${action}_application`,
            entity_type: 'applications',
            entity_id: applicationId,
            new_values: updatePayload
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
                application: updatedApplication[0],
                message: `Application ${action}d successfully`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Application processing error:', error);

        const errorResponse = {
            error: {
                code: 'APPLICATION_PROCESSING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
