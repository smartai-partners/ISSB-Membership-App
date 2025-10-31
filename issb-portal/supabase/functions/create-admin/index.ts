import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateAdminRequest {
  email: string;
  verificationCode: string;
  role?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const requestData: CreateAdminRequest = await req.json();
    const { email, verificationCode, role = 'admin' } = requestData;

    // Validate inputs
    if (!email || !verificationCode) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Both email and verificationCode are required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the testing code
    const VALID_CODE = 'ISSB_ADMIN_2024';
    
    if (verificationCode !== VALID_CODE) {
      console.error('Invalid verification code attempt:', { email, code: verificationCode });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid verification code',
          details: 'Please use the correct verification code for testing'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const targetUser = users.find(u => u.email === email);
    
    if (!targetUser) {
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          details: `No user found with email: ${email}. Please register first.`
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user already has admin role
    const currentRole = targetUser.user_metadata?.role || targetUser.raw_user_meta_data?.role;
    if (currentRole === 'admin') {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `User ${email} already has admin role`,
          alreadyAdmin: true,
          adminUrl: '/admin/users'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update user's role in auth.users metadata
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: { 
          ...targetUser.user_metadata,
          role: role 
        }
      }
    );

    if (updateError) {
      console.error('Error updating user role:', updateError);
      throw updateError;
    }

    // Also update in profiles table if it exists
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: role })
      .eq('id', targetUser.id);

    // Log the admin creation (don't fail if logging fails)
    if (profileError) {
      console.warn('Could not update profiles table (may not exist):', profileError.message);
    }

    // Try to log to audit_logs if table exists
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          admin_user_id: 'system',
          target_user_id: targetUser.id,
          action: 'admin_creation',
          details: { 
            email, 
            role, 
            verification_code_used: 'VALID',
            timestamp: new Date().toISOString()
          },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        });
    } catch (auditError) {
      console.warn('Could not log to audit_logs (table may not exist):', auditError);
    }

    console.log('Successfully created admin user:', { email, role, userId: targetUser.id });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Admin role successfully added to ${email}!`,
        instructions: [
          'Please logout of the portal',
          'Login again with your credentials',
          'Navigate to /admin/users to access the admin dashboard'
        ],
        adminUrl: '/admin/users',
        userId: targetUser.id,
        role: role
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-admin function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
