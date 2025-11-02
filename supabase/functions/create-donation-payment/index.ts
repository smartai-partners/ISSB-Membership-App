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
        const { amount, donationType, purpose, donorEmail, donorName } = await req.json();

        console.log('Donation payment request received:', { amount, purpose, donationType });

        // Validate required parameters
        if (!amount || amount <= 0) {
            throw new Error('Valid donation amount is required');
        }

        if (!purpose) {
            throw new Error('Donation purpose is required');
        }

        if (!['one_time', 'recurring'].includes(donationType)) {
            throw new Error('Invalid donation type');
        }

        // Get environment variables
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!stripeSecretKey) {
            console.error('Stripe secret key not found in environment');
            throw new Error('Stripe payment processing is not configured');
        }

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Environment variables validated, creating payment intent...');

        // Get user from auth header if provided
        let userId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                    console.log('User identified:', userId);
                }
            } catch (error) {
                console.log('Could not get user from token:', error.message);
            }
        }

        // Check if user has active membership
        let hasActiveMembership = false;
        if (userId) {
            const membershipCheck = await fetch(
                `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&status=eq.active&select=id`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );
            if (membershipCheck.ok) {
                const memberships = await membershipCheck.json();
                hasActiveMembership = memberships.length > 0;
                console.log('Active membership status:', hasActiveMembership);
            }
        }

        // Calculate membership application for donations >= $360
        const membershipAmount = 360;
        const canApplyToMembership = userId && !hasActiveMembership && amount >= membershipAmount;
        const amountAppliedToMembership = canApplyToMembership ? membershipAmount : 0;
        const remainingDonationAmount = amount - amountAppliedToMembership;

        console.log('Membership application calculation:', {
            canApplyToMembership,
            amountAppliedToMembership,
            remainingDonationAmount
        });

        // Prepare Stripe payment intent data
        const stripeParams = new URLSearchParams();
        stripeParams.append('amount', Math.round(amount * 100).toString()); // Convert to cents
        stripeParams.append('currency', 'usd');
        stripeParams.append('payment_method_types[]', 'card');
        stripeParams.append('metadata[purpose]', purpose);
        stripeParams.append('metadata[donation_type]', donationType);
        stripeParams.append('metadata[donor_email]', donorEmail || '');
        stripeParams.append('metadata[donor_name]', donorName || '');
        stripeParams.append('metadata[user_id]', userId || 'anonymous');
        stripeParams.append('metadata[organization]', 'ISSB Mosque');
        stripeParams.append('metadata[apply_to_membership]', canApplyToMembership.toString());
        stripeParams.append('metadata[membership_amount]', amountAppliedToMembership.toString());
        stripeParams.append('metadata[remaining_donation]', remainingDonationAmount.toString());

        // Add description
        const purposeNames = {
            'zakat': 'Zakat (Obligatory Charity)',
            'sadaqah': 'Sadaqah (Voluntary Charity)',
            'building_fund': 'Building Fund',
            'education': 'Educational Programs',
            'community_services': 'Community Services',
            'general': 'General Fund'
        };
        let description = `ISSB Donation: ${purposeNames[purpose] || purpose}`;
        if (canApplyToMembership) {
            description += ` (includes $${membershipAmount} membership)`;
        }
        stripeParams.append('description', description);

        // Create payment intent with Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: stripeParams.toString()
        });

        console.log('Stripe API response status:', stripeResponse.status);

        if (!stripeResponse.ok) {
            const errorData = await stripeResponse.text();
            console.error('Stripe API error:', errorData);
            throw new Error(`Stripe API error: ${errorData}`);
        }

        const paymentIntent = await stripeResponse.json();
        console.log('Payment intent created successfully:', paymentIntent.id);

        // Create donation record in database with membership application data
        const donationData = {
            user_id: userId,
            amount: amount,
            donation_type: donationType,
            purpose: purpose,
            donor_name: donorName || null,
            donor_email: donorEmail || null,
            payment_status: 'pending',
            stripe_payment_intent_id: paymentIntent.id,
            applied_to_membership: canApplyToMembership,
            amount_applied_to_membership: amountAppliedToMembership,
            remaining_donation_amount: remainingDonationAmount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Creating donation record in database...');

        const donationResponse = await fetch(`${supabaseUrl}/rest/v1/donations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(donationData)
        });

        if (!donationResponse.ok) {
            const errorText = await donationResponse.text();
            console.error('Failed to create donation record:', errorText);
            // Cancel payment intent if donation record creation fails
            try {
                await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntent.id}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${stripeSecretKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                console.log('Payment intent cancelled due to database error');
            } catch (cancelError) {
                console.error('Failed to cancel payment intent:', cancelError.message);
            }
            throw new Error(`Failed to create donation record: ${errorText}`);
        }

        const donation = await donationResponse.json();
        console.log('Donation record created successfully:', donation[0].id);

        const result = {
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                donationId: donation[0].id,
                amount: amount,
                purpose: purpose,
                status: 'pending',
                membershipInfo: canApplyToMembership ? {
                    appliedToMembership: true,
                    membershipAmount: amountAppliedToMembership,
                    remainingDonation: remainingDonationAmount
                } : null
            }
        };

        console.log('Donation payment intent creation completed successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Donation payment intent creation error:', error);

        const errorResponse = {
            error: {
                code: 'DONATION_PAYMENT_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
