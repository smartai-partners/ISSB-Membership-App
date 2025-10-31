// PHASE 1A SECURITY: Enhanced with rate limiting and security headers

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

function checkRateLimit(req: Request): {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
} {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const ip = cfConnectingIp || realIp || (forwardedFor?.split(',')[0]) || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const identifier = `${ip}-${userAgent.substring(0, 50)}`;
  
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return {
      allowed: true,
      remainingRequests: RATE_LIMIT_CONFIG.maxRequests - 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    };
  }
  
  if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: entry.resetTime,
    };
  }
  
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  return {
    allowed: true,
    remainingRequests: RATE_LIMIT_CONFIG.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

function getSecureHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

Deno.serve(async (req) => {
    const secureHeaders = getSecureHeaders();

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: secureHeaders });
    }

    try {
        // PHASE 1A SECURITY: Rate limiting
        const rateLimitCheck = checkRateLimit(req);
        if (!rateLimitCheck.allowed) {
            const retryAfter = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000);
            return new Response(
                JSON.stringify({
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many signup attempts. Please try again later.',
                        retryAfter,
                    },
                }),
                {
                    status: 429,
                    headers: {
                        ...secureHeaders,
                        'Retry-After': retryAfter.toString(),
                        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(rateLimitCheck.resetTime).toISOString(),
                    },
                }
            );
        }

        const { opportunityId, action, memberId } = await req.json();

        if (!opportunityId || !action || !memberId) {
            throw new Error('opportunityId, action, and memberId are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get current opportunity details
        const opportunityResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!opportunityResponse.ok) {
            throw new Error('Failed to fetch opportunity');
        }

        const opportunities = await opportunityResponse.json();
        if (opportunities.length === 0) {
            throw new Error('Opportunity not found');
        }

        const opportunity = opportunities[0];
        const currentVolunteers = opportunity.current_volunteers || 0;
        const maxVolunteers = opportunity.capacity || opportunity.max_volunteers || 0;

        let newCount = currentVolunteers;
        let signupStatus = 'PENDING';

        if (action === 'signup') {
            // Check if already signed up
            const checkSignupResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups?opportunity_id=eq.${opportunityId}&member_id=eq.${memberId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const existingSignups = await checkSignupResponse.json();
            if (existingSignups.length > 0) {
                throw new Error('Already signed up for this opportunity');
            }

            // Check capacity
            if (maxVolunteers > 0 && currentVolunteers >= maxVolunteers) {
                throw new Error('This opportunity is at full capacity');
            }

            newCount = currentVolunteers + 1;
            signupStatus = 'CONFIRMED';

            // Create signup record
            const createSignupResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        opportunity_id: opportunityId,
                        member_id: memberId,
                        status: signupStatus,
                        confirmed_at: new Date().toISOString()
                    })
                }
            );

            if (!createSignupResponse.ok) {
                const errorText = await createSignupResponse.text();
                throw new Error(`Failed to create signup: ${errorText}`);
            }

        } else if (action === 'withdraw') {
            // Check if signed up
            const checkSignupResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups?opportunity_id=eq.${opportunityId}&member_id=eq.${memberId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const existingSignups = await checkSignupResponse.json();
            if (existingSignups.length === 0) {
                throw new Error('No signup found for this opportunity');
            }

            const signup = existingSignups[0];

            // Update signup to cancelled
            const updateSignupResponse = await fetch(
                `${supabaseUrl}/rest/v1/volunteer_signups?id=eq.${signup.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'CANCELLED',
                        cancelled_at: new Date().toISOString()
                    })
                }
            );

            if (!updateSignupResponse.ok) {
                throw new Error('Failed to cancel signup');
            }

            newCount = Math.max(0, currentVolunteers - 1);
        }

        // Update opportunity capacity
        const updateOpportunityResponse = await fetch(
            `${supabaseUrl}/rest/v1/volunteer_opportunities?id=eq.${opportunityId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    current_volunteers: newCount,
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!updateOpportunityResponse.ok) {
            const errorText = await updateOpportunityResponse.text();
            throw new Error(`Failed to update opportunity: ${errorText}`);
        }

        const updatedOpportunity = await updateOpportunityResponse.json();

        return new Response(JSON.stringify({
            data: {
                success: true,
                opportunity: updatedOpportunity[0],
                action: action,
                newCapacity: newCount
            }
        }), {
            headers: secureHeaders
        });

    } catch (error) {
        console.error('Capacity management error:', error);

        const errorResponse = {
            error: {
                code: 'CAPACITY_MANAGEMENT_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: secureHeaders
        });
    }
});
