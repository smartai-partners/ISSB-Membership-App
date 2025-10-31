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
        const { memberId } = await req.json();

        if (!memberId) {
            throw new Error('memberId is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get all approved volunteer hours for this member that count toward waiver
        const hoursResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_hours?user_id=eq.${memberId}&status=eq.APPROVED&counts_toward_waiver=eq.true`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!hoursResponse.ok) {
            throw new Error('Failed to fetch volunteer hours');
        }

        const hours = await hoursResponse.json();
        
        // Calculate total approved hours
        const totalHours = hours.reduce((sum, record) => sum + parseFloat(record.hours || 0), 0);
        
        const waiverThreshold = 30;
        const isEligibleForWaiver = totalHours >= waiverThreshold;

        // Get member's profile
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${memberId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!profileResponse.ok) {
            throw new Error('Failed to fetch member profile');
        }

        const profiles = await profileResponse.json();
        if (profiles.length === 0) {
            throw new Error('Member profile not found');
        }

        const profile = profiles[0];

        // Update profile if waiver status changed
        if (isEligibleForWaiver && !profile.membership_fee_waived) {
            const updateProfileResponse = await fetch(
                `${supabaseUrl}/rest/v1/profiles?id=eq.${memberId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        membership_fee_waived: true,
                        waiver_granted_at: new Date().toISOString(),
                        total_volunteer_hours: totalHours
                    })
                }
            );

            if (!updateProfileResponse.ok) {
                throw new Error('Failed to update profile with waiver status');
            }

            // Update active membership if exists
            const membershipResponse = await fetch(
                `${supabaseUrl}/rest/v1/memberships?user_id=eq.${memberId}&status=eq.ACTIVE`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (membershipResponse.ok) {
                const memberships = await membershipResponse.json();
                if (memberships.length > 0) {
                    const membership = memberships[0];
                    
                    await fetch(
                        `${supabaseUrl}/rest/v1/memberships?id=eq.${membership.id}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                waived_through_volunteering: true,
                                waiver_volunteer_hours: totalHours,
                                balance_due: 0
                            })
                        }
                    );
                }
            }
        }

        return new Response(JSON.stringify({
            data: {
                memberId: memberId,
                totalHours: totalHours,
                waiverThreshold: waiverThreshold,
                isEligibleForWaiver: isEligibleForWaiver,
                waiverApplied: isEligibleForWaiver && !profile.membership_fee_waived ? true : profile.membership_fee_waived,
                hoursNeeded: Math.max(0, waiverThreshold - totalHours)
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Waiver calculation error:', error);

        const errorResponse = {
            error: {
                code: 'WAIVER_CALCULATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
