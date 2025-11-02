
const planConfig = {
  "individual_annual": {
    "amount": 36000, // $360/year
    "name": "Individual Annual Membership",
    "currency": "usd",
    "interval": "year",
    "monthlyLimit": 1
  }
};

const tableName = "plans";

async function createDynamicPrice(stripeSecretKey: string) {
  const config = planConfig.individual_annual;

  const priceParams = new URLSearchParams({
    currency: config.currency,
    unit_amount: config.amount.toString(),
    'recurring[interval]': config.interval,
    'product_data[name]': config.name,
    'metadata[plan_type]': 'individual_annual'
  });

  const response = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: priceParams.toString()
  });

  if (!response.ok) throw new Error(`Failed to create price: ${await response.text()}`);
  
  const priceData = await response.json();
  const priceId = priceData.id;

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  if (serviceRoleKey && supabaseUrl) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          price_id: priceId,
          plan_type: 'individual_annual',
          price: config.amount,
          monthly_limit: config.monthlyLimit,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });
      
      console.log(`Plan synced to database: individual_annual -> ${priceId}`);
    } catch (syncError) {
      console.error('Failed to sync plan to database:', syncError);
      throw new Error(`Failed to sync plan to database`)
    }
  }

  return priceId;
}

async function getOrCreatePrice(stripeSecretKey: string) {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  if (serviceRoleKey && supabaseUrl) {
    try {
      const localResponse = await fetch(
        `${supabaseUrl}/rest/v1/${tableName}?plan_type=eq.individual_annual&select=price_id`,
        { 
          headers: { 
            'Authorization': `Bearer ${serviceRoleKey}`, 
            'apikey': serviceRoleKey 
          } 
        }
      );
      
      if (localResponse.ok) {
        const localData = await localResponse.json();
        if (localData?.length > 0) {
          console.log(`Found existing plan in local database: individual_annual -> ${localData[0].price_id}`);
          return localData[0].price_id;
        }
      }
    } catch (error) {
      console.error('Local database query failed:', error);
    }
  }
  console.log(`Plan not found locally, creating new price for individual_annual`);
  return await createDynamicPrice(stripeSecretKey);
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const origin = req.headers.get('origin') || req.headers.get('referer')
      
    const { customerEmail } = await req.json();
    if (!customerEmail) throw new Error('Missing required params');

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!stripeSecretKey || !serviceRoleKey || !supabaseUrl) throw new Error('Missing env config');

    // Get or create price for single annual plan
    const priceId = await getOrCreatePrice(stripeSecretKey);

    // Get userId
    let userId = null;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceRoleKey }
      });
      if (userRes.ok) userId = (await userRes.json()).id;
    }

    // Find or create Stripe customer
    let customerId = null;
    const customerRes = await fetch(`https://api.stripe.com/v1/customers/search?query=metadata['user_id']:'${userId}'&limit=1`, {
      headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
    });
    const customerData = await customerRes.json();
    if (customerData.data?.length) {
      customerId = customerData.data[0].id;
      console.log(`Found customer by user_id: ${userId} -> ${customerId}`);
    } else {
      const params = new URLSearchParams({ 
        email: customerEmail, 
        'metadata[user_id]': userId || '', 
        'metadata[plan_type]': 'individual_annual' 
      });
      const createRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      customerId = (await createRes.json()).id;
    }

    const checkoutParams = new URLSearchParams({
      customer: customerId, 
      mode: 'subscription',
      'line_items[0][price]': priceId, 
      'line_items[0][quantity]': '1',
      success_url: `${origin}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
      'metadata[user_id]': userId || '', 
      'metadata[plan_type]': 'individual_annual',
      'metadata[activation_method]': 'payment'
    });
    const checkoutRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: checkoutParams.toString()
    });
    const checkoutSession = await checkoutRes.json();

    return new Response(JSON.stringify({
      data: {
        checkoutSessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
        customerId,
        planType: 'individual_annual',
        priceId
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
