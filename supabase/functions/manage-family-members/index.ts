Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
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

        const { action, memberData, memberId } = await req.json();

        // Verify user has active family subscription
        const subsResponse = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&status=eq.active&select=*,plans(*)`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const subscriptions = await subsResponse.json();
        const subscription = subscriptions[0];

        if (!subscription) {
            throw new Error('No active subscription found');
        }

        // Check if it's a family plan
        const plan = subscription.plans;
        if (!plan || plan.plan_type !== 'family') {
            throw new Error('Family member management is only available for Family tier subscriptions');
        }

        if (action === 'add') {
            // Check family member limit
            const membersResponse = await fetch(
                `${supabaseUrl}/rest/v1/subscription_members?subscription_id=eq.${subscription.stripe_subscription_id}&select=id`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    }
                }
            );
            const existingMembers = await membersResponse.json();

            if (existingMembers.length >= 6) {
                throw new Error('Maximum family member limit (6) reached');
            }

            // Add family member
            const addResponse = await fetch(
                `${supabaseUrl}/rest/v1/subscription_members`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        subscription_id: subscription.stripe_subscription_id,
                        user_id: userId,
                        is_primary: false,
                        ...memberData
                    })
                }
            );

            if (!addResponse.ok) {
                const errorText = await addResponse.text();
                throw new Error(`Failed to add family member: ${errorText}`);
            }

            const newMember = await addResponse.json();

            return new Response(JSON.stringify({
                data: {
                    member: newMember[0],
                    message: 'Family member added successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'remove') {
            // Remove family member
            const deleteResponse = await fetch(
                `${supabaseUrl}/rest/v1/subscription_members?id=eq.${memberId}&subscription_id=eq.${subscription.stripe_subscription_id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    }
                }
            );

            if (!deleteResponse.ok) {
                throw new Error('Failed to remove family member');
            }

            return new Response(JSON.stringify({
                data: {
                    message: 'Family member removed successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            throw new Error('Invalid action. Use "add" or "remove"');
        }

    } catch (error: any) {
        console.error('Manage family members error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'FAMILY_MEMBER_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
