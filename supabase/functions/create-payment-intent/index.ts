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
        const { 
            amount, 
            currency = 'usd', 
            donorEmail, 
            donorName, 
            isAnonymous = false, 
            message = null,
            dedicationType = null,
            dedicationName = null,
            notificationEmail = null
        } = await req.json();

        console.log('Payment intent request received:', { amount, currency, donorEmail, isAnonymous });

        // Validate required parameters
        if (!amount || amount <= 0) {
            throw new Error('Valid amount is required (minimum $1 or equivalent)');
        }

        if (!donorEmail) {
            throw new Error('Donor email is required');
        }

        // Validate currency
        const supportedCurrencies = ['usd', 'eur', 'gbp', 'cad'];
        if (!supportedCurrencies.includes(currency.toLowerCase())) {
            throw new Error(`Currency must be one of: ${supportedCurrencies.join(', ')}`);
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

        console.log('Environment variables validated');

        // Get user from auth header if provided (optional for anonymous donations)
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
                console.log('Could not get user from token (proceeding as anonymous):', error.message);
            }
        }

        // Generate idempotency key to prevent duplicate charges
        const idempotencyKey = `donation_${donorEmail}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Prepare Stripe payment intent data
        const stripeParams = new URLSearchParams();
        stripeParams.append('amount', Math.round(amount * 100).toString()); // Convert to cents
        stripeParams.append('currency', currency.toLowerCase());
        stripeParams.append('payment_method_types[]', 'card');
        stripeParams.append('metadata[donor_email]', donorEmail);
        stripeParams.append('metadata[donor_name]', donorName || 'Anonymous');
        stripeParams.append('metadata[is_anonymous]', isAnonymous.toString());
        stripeParams.append('metadata[user_id]', userId || '');
        if (message) {
            stripeParams.append('metadata[message]', message);
        }

        console.log('Creating payment intent with Stripe...');

        // Create payment intent with Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Idempotency-Key': idempotencyKey
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

        // Create donation record in database
        const donationData = {
            user_id: userId,
            donor_email: donorEmail,
            donor_name: isAnonymous ? 'Anonymous' : (donorName || 'Anonymous'),
            amount: amount,
            currency: currency.toLowerCase(),
            stripe_payment_intent_id: paymentIntent.id,
            stripe_customer_id: paymentIntent.customer || null,
            payment_status: 'pending',
            payment_method: 'stripe',
            is_anonymous: isAnonymous,
            message: message,
            donation_type: 'one_time',
            is_recurring: false,
            tax_receipt_sent: false,
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
            
            // If donation record creation fails, cancel the payment intent
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
        const donationId = donation[0].id;
        console.log('Donation record created successfully:', donationId);

        // Create donation metadata if dedication information provided
        if (dedicationType && dedicationName) {
            const metadataData = {
                donation_id: donationId,
                dedication_type: dedicationType,
                dedication_name: dedicationName,
                notification_email: notificationEmail || null,
                created_at: new Date().toISOString()
            };

            console.log('Creating donation metadata...');

            const metadataResponse = await fetch(`${supabaseUrl}/rest/v1/donation_metadata`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadataData)
            });

            if (!metadataResponse.ok) {
                const errorText = await metadataResponse.text();
                console.error('Failed to create donation metadata:', errorText);
                // Log error but don't fail the entire operation
            } else {
                console.log('Donation metadata created successfully');
            }
        }

        const result = {
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                donationId: donationId,
                amount: amount,
                currency: currency,
                status: 'pending'
            }
        };

        console.log('Payment intent creation completed successfully');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);

        const errorResponse = {
            error: {
                code: 'PAYMENT_INTENT_FAILED',
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
