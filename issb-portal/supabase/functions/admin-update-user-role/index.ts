import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UpdateUserRoleRequest {
  userId: string;
  role?: string;
  status?: string;
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

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create client with user's token to verify they're authenticated
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: authHeader,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify user has admin role
    const userRole = user.user_metadata?.role || user.raw_user_meta_data?.role;
    
    if (userRole !== 'admin') {
      console.error('Non-admin user attempted role update:', { userId: user.id, role: userRole });
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden - Admin access required',
          details: 'Only administrators can update user roles'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const requestData: UpdateUserRoleRequest = await req.json();
    const { userId, role, status } = requestData;

    // Validate inputs
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: userId'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!role && !status) {
      return new Response(
        JSON.stringify({ 
          error: 'At least one field (role or status) must be provided'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'member', 'volunteer'];
      if (!validRoles.includes(role)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid role',
            details: `Role must be one of: ${validRoles.join(', ')}`
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'inactive', 'pending'];
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid status',
            details: `Status must be one of: ${validStatuses.join(', ')}`
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get target user to verify they exist
    const { data: targetUserData, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (targetUserError || !targetUserData.user) {
      console.error('Target user not found:', targetUserError);
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          details: `No user found with ID: ${userId}`
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const targetUser = targetUserData.user;
    const updates: any = {};

    // Update role in auth.users metadata if provided
    if (role) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: { 
            ...targetUser.user_metadata,
            role: role 
          }
        }
      );

      if (updateError) {
        console.error('Error updating user role in auth:', updateError);
        throw updateError;
      }
      updates.role = role;
    }

    // Update profiles table if it exists
    const profileUpdates: any = {};
    if (role) profileUpdates.role = role;
    if (status) profileUpdates.status = status;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (profileError) {
        console.warn('Could not update profiles table:', profileError.message);
      }
    }

    // Log the update to audit_logs if table exists
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          admin_user_id: user.id,
          target_user_id: userId,
          action: 'user_update',
          details: { 
            updates: { role, status },
            target_email: targetUser.email,
            admin_email: user.email,
            timestamp: new Date().toISOString()
          },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        });
    } catch (auditError) {
      console.warn('Could not log to audit_logs (table may not exist):', auditError);
    }

    console.log('Successfully updated user:', { 
      adminId: user.id, 
      targetId: userId, 
      updates: { role, status } 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User updated successfully',
        updates: { role, status },
        user: {
          id: targetUser.id,
          email: targetUser.email,
          role: role || targetUser.user_metadata?.role,
          status: status
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in admin-update-user-role function:', error);
    
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
