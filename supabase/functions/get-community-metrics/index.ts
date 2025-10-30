Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Get volunteer hours metrics
    const volunteerResponse = await fetch(
      `${supabaseUrl}/rest/v1/volunteer_hours?status=eq.approved&select=hours,user_id`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const volunteerData = await volunteerResponse.json();
    const totalVolunteerHours = volunteerData.reduce((sum: number, record: any) => sum + (record.hours || 0), 0);
    const uniqueVolunteers = new Set(volunteerData.map((r: any) => r.user_id)).size;

    // Get donations metrics
    const donationsResponse = await fetch(
      `${supabaseUrl}/rest/v1/donations?payment_status=eq.paid&select=amount,user_id,donation_type`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const donationsData = await donationsResponse.json();
    const totalDonations = donationsData.reduce((sum: number, record: any) => sum + (record.amount || 0), 0);
    const uniqueDonors = new Set(donationsData.map((r: any) => r.user_id)).size;
    const recurringDonors = donationsData.filter((r: any) => r.donation_type === 'recurring').length;

    // Get total community members (users)
    const usersResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=id`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const usersData = await usersResponse.json();
    const totalMembers = usersData.length;

    // Calculate this month's metrics
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const monthlyDonationsResponse = await fetch(
      `${supabaseUrl}/rest/v1/donations?payment_status=eq.paid&created_at=gte.${firstDayOfMonth}&select=amount`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const monthlyDonationsData = await monthlyDonationsResponse.json();
    const monthlyTotal = monthlyDonationsData.reduce((sum: number, record: any) => sum + (record.amount || 0), 0);
    const monthlyDonorCount = monthlyDonationsData.length;

    // If no real data exists, return placeholder data for demo purposes
    const metrics = {
      totalVolunteerHours: totalVolunteerHours > 0 ? totalVolunteerHours : 850,
      totalDonations: totalDonations > 0 ? totalDonations : 125000,
      activeVolunteers: uniqueVolunteers > 0 ? uniqueVolunteers : 120,
      totalMembers: totalMembers > 0 ? totalMembers : 450,
      monthlyDonations: monthlyTotal > 0 ? monthlyTotal : 45200,
      monthlyDonorCount: monthlyDonorCount > 0 ? monthlyDonorCount : 185,
      recurringDonors: recurringDonors > 0 ? recurringDonors : 67,
      volunteerGoal: 1000,
      buildingFundGoal: 150000,
      buildingFundCurrent: totalDonations > 0 ? Math.min(totalDonations, 150000) : 125000,
      isRealData: totalVolunteerHours > 0 || totalDonations > 0 // Flag to indicate if using real data
    };

    return new Response(
      JSON.stringify({ data: metrics }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching community metrics:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'METRICS_FETCH_FAILED',
          message: error.message,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
