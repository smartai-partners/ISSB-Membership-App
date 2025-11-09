// Temporary test function to verify Gemini API is working
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
        const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
        
        if (!geminiApiKey) {
            return new Response(JSON.stringify({
                success: false,
                error: 'GOOGLE_GEMINI_API_KEY not found in environment variables'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Test the API key with a simple request
        const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello, this is a test. Please respond with 'API is working'." }]
                }]
            })
        });

        const data = await testResponse.json();
        
        if (testResponse.ok) {
            return new Response(JSON.stringify({
                success: true,
                message: 'Google Gemini API is configured and working!',
                apiKey: geminiApiKey.substring(0, 10) + '...', // Show only first 10 chars for security
                testResponse: data
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({
                success: false,
                error: 'API key is configured but request failed',
                details: data
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
