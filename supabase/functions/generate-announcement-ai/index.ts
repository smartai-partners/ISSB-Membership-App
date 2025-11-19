// AI Announcement Generation Edge Function
// Generates announcement drafts using Google Gemini AI

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        if (!geminiApiKey) {
            throw new Error('Google Gemini API key not configured');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No authorization header'
                }
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
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
            return new Response(JSON.stringify({
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid authentication token'
                }
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Verify admin or board member role
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role,full_name`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                }
            }
        );

        const profiles = await profileResponse.json();
        const userRole = profiles[0]?.role;

        if (userRole !== 'admin' && userRole !== 'board') {
            return new Response(JSON.stringify({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Admin or board member access required'
                }
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get request body
        const body = await req.json();
        const { prompt } = body;

        if (!prompt || typeof prompt !== 'string') {
            return new Response(JSON.stringify({
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Prompt is required and must be a string'
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate prompt length
        if (prompt.length < 10) {
            return new Response(JSON.stringify({
                error: {
                    code: 'PROMPT_TOO_SHORT',
                    message: 'Prompt must be at least 10 characters'
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (prompt.length > 2000) {
            return new Response(JSON.stringify({
                error: {
                    code: 'PROMPT_TOO_LONG',
                    message: 'Prompt must be less than 2000 characters'
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`AI Announcement Generation requested by user ${userId} (${userRole})`);

        // Build AI prompt for announcement generation
        const systemPrompt = `You are an AI assistant for the Islamic Society of San Bernardino (ISSB) helping administrators create professional community announcements.

Your task is to generate a well-structured announcement based on the admin's description.

Guidelines:
1. Create a clear, concise title (5-10 words)
2. Write professional, warm, and engaging content
3. Use proper formatting with paragraphs
4. Include relevant details like dates, times, locations if mentioned
5. End with a clear call to action if appropriate
6. Maintain a respectful, community-focused tone
7. Keep the total content under 500 words

Admin's Description:
${prompt}

Generate the announcement in the following JSON format:
{
  "title": "Clear and engaging title here",
  "content": "Full announcement text with proper paragraphs separated by double newlines. Include all relevant details and end with a call to action if appropriate."
}

IMPORTANT: Return ONLY valid JSON, no additional text or explanation.`;

        // Call Google Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1500,
                        topP: 0.9,
                        topK: 40
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            throw new Error('AI service temporarily unavailable');
        }

        const geminiData = await geminiResponse.json();
        const aiResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponseText) {
            throw new Error('No response from AI service');
        }

        // Parse JSON response from AI
        let announcementData;
        try {
            // Extract JSON from response (AI might wrap it in markdown code blocks)
            const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid AI response format');
            }
            announcementData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponseText);
            throw new Error('Failed to parse AI-generated announcement');
        }

        // Validate generated data
        if (!announcementData.title || !announcementData.content) {
            throw new Error('AI response missing required fields');
        }

        // Trim and validate lengths
        announcementData.title = announcementData.title.trim().substring(0, 200);
        announcementData.content = announcementData.content.trim().substring(0, 5000);

        console.log(`AI announcement generated successfully (${announcementData.title.length} chars title, ${announcementData.content.length} chars content)`);

        // Log audit trail
        await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                action: 'generate_announcement_ai',
                entity_type: 'announcement',
                entity_id: null,
                new_values: {
                    prompt_length: prompt.length,
                    generated_title_length: announcementData.title.length,
                    generated_content_length: announcementData.content.length
                }
            })
        });

        return new Response(JSON.stringify({
            data: {
                title: announcementData.title,
                content: announcementData.content,
                generated_at: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Generate announcement AI error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'AI_GENERATION_FAILED',
                message: error.message || 'Failed to generate announcement'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
