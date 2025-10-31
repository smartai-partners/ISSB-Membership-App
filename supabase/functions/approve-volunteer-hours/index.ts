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
        const { hourLogId, action, adminId, adminNotes, rejectionReason } = await req.json();

        if (!hourLogId || !action || !adminId) {
            throw new Error('hourLogId, action, and adminId are required');
        }

        if (!['APPROVE', 'REJECT'].includes(action)) {
            throw new Error('action must be either APPROVE or REJECT');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get the volunteer hour log
        const logResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?id=eq.${hourLogId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!logResponse.ok) {
            throw new Error('Failed to fetch volunteer hour log');
        }

        const logs = await logResponse.json();
        if (logs.length === 0) {
            throw new Error('Volunteer hour log not found');
        }

        const log = logs[0];

        // Update the log with approval/rejection
        const updateData = {
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            approved_by: adminId,
            approved_at: new Date().toISOString(),
            admin_notes: adminNotes || null,
            rejection_reason: action === 'REJECT' ? rejectionReason : null,
            counts_toward_waiver: action === 'APPROVE' ? true : false,
            updated_at: new Date().toISOString()
        };

        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?id=eq.${hourLogId}`,
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
            throw new Error(`Failed to update volunteer hour log: ${errorText}`);
        }

        const updatedLog = await updateResponse.json();

        // If approved, update the volunteer signup status if linked
        if (action === 'APPROVE' && log.signup_id) {
            await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups?id=eq.${log.signup_id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'COMPLETED',
                        completed_at: new Date().toISOString()
                    })
                }
            );
        }

        // Recalculate member's total volunteer hours
        const allApprovedHoursResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?user_id=eq.${log.user_id}&status=eq.APPROVED`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (allApprovedHoursResponse.ok) {
            const approvedHours = await allApprovedHoursResponse.json();
            const totalHours = approvedHours.reduce((sum, record) => sum + parseFloat(record.hours || 0), 0);

            // Update profile with new total
            await fetch(
                `${supabaseUrl}/rest/v1/profiles?id=eq.${log.user_id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        total_volunteer_hours: totalHours
                    })
                }
            );

            // Check if member is eligible for waiver (trigger waiver calculation)
            if (totalHours >= 30) {
                await fetch(
                    `${supabaseUrl}/functions/v1/calculate-volunteer-waiver`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            memberId: log.user_id
                        })
                    }
                );
            }
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                action: action,
                hourLog: updatedLog[0],
                message: action === 'APPROVE' 
                    ? 'Volunteer hours approved successfully' 
                    : 'Volunteer hours rejected'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Hour approval error:', error);

        const errorResponse = {
            error: {
                code: 'HOUR_APPROVAL_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
