// Shared authentication utilities for edge functions

// SECURITY FIX: Use environment-configured CORS origin instead of wildcard
// This prevents unauthorized domains from accessing the API
const getAllowedOrigin = () => {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [];
  // Default to localhost for development if no origins configured
  return allowedOrigins.length > 0 ? allowedOrigins[0] : 'http://localhost:3000';
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function authenticateUser(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration missing');
  }

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

  // Get user profile for role
  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}&select=role`,
    {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    }
  );

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch user profile');
  }

  const profiles = await profileResponse.json();
  const profile = profiles[0];

  return {
    id: userData.id,
    email: userData.email,
    role: profile?.role || 'member'
  };
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

export function createErrorResponse(message: string, status: number = 500) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'ERROR',
        message
      }
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({ data }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
