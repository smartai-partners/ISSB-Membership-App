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

        // Verify token and get user (must be admin)
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
        const adminUserId = userData.id;

        // Check if user is admin
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${adminUserId}&select=role`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const profiles = await profileResponse.json();
        const profile = profiles[0];

        if (!profile || (profile.role !== 'admin' && profile.role !== 'board')) {
            throw new Error('Unauthorized: Admin access required');
        }

        const { volunteerHourId, action, rejectionReason, adminNotes } = await req.json();

        if (!volunteerHourId || !action) {
            throw new Error('Volunteer hour ID and action are required');
        }

        if (action !== 'approve' && action !== 'reject') {
            throw new Error('Action must be "approve" or "reject"');
        }

        if (action === 'reject' && !rejectionReason) {
            throw new Error('Rejection reason is required when rejecting');
        }

        // Get the volunteer hours record
        const volunteerHoursResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?id=eq.${volunteerHourId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const volunteerHoursRecords = await volunteerHoursResponse.json();
        const volunteerHoursRecord = volunteerHoursRecords[0];

        if (!volunteerHoursRecord) {
            throw new Error('Volunteer hours record not found');
        }

        // Update volunteer hours record
        const updateData: any = {
            status: action === 'approve' ? 'approved' : 'rejected',
            approved_by: adminUserId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (action === 'reject') {
            updateData.rejection_reason = rejectionReason;
        }

        if (adminNotes) {
            updateData.admin_notes = adminNotes;
        }

        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?id=eq.${volunteerHourId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updateData)
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update volunteer hours: ${errorText}`);
        }

        const updatedRecord = await updateResponse.json();

        // If approved, check if user has completed 30 hours and activate membership
        if (action === 'approve') {
            const userId = volunteerHoursRecord.user_id;

            // Get total approved hours
            const approvedHoursResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_hours?user_id=eq.${userId}&status=eq.approved&counts_toward_waiver=eq.true&select=hours`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    }
                }
            );

            const approvedHours = await approvedHoursResponse.json();
            const totalApprovedHours = approvedHours.reduce((sum: number, record: any) => sum + parseFloat(record.hours), 0);

            // Check if user has subscription with volunteer activation method
            const subscriptionResponse = await fetch(
                `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&activation_method=eq.volunteer&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    }
                }
            );

            const subscriptions = await subscriptionResponse.json();

            if (subscriptions && subscriptions.length > 0) {
                const subscription = subscriptions[0];

                // Update volunteer hours completed and activate if >= 30 hours
                await fetch(
                    `${supabaseUrl}/rest/v1/subscriptions?id=eq.${subscription.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            volunteer_hours_completed: totalApprovedHours,
                            status: totalApprovedHours >= 30 ? 'active' : 'pending',
                            updated_at: new Date().toISOString()
                        })
                    }
                );

                // Log subscription history if activated
                if (totalApprovedHours >= 30 && subscription.status !== 'active') {
                    await fetch(
                        `${supabaseUrl}/rest/v1/subscription_history`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                user_id: userId,
                                subscription_id: subscription.stripe_subscription_id,
                                action: 'volunteer_activated',
                                to_tier: 'individual_annual',
                                amount: 0
                            })
                        }
                    );
                }
            }
        }

        return new Response(JSON.stringify({
            data: {
                volunteerHours: updatedRecord[0],
                message: `Volunteer hours ${action}d successfully`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Approve volunteer hours error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'APPROVE_VOLUNTEER_HOURS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
