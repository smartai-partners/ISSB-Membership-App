// Chat Message Edge Function
// Processes user messages and generates AI responses using Google Gemini

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
        const { sessionId, message } = await req.json();

        if (!sessionId || !message) {
            return new Response(JSON.stringify({
                error: {
                    code: 'MISSING_PARAMS',
                    message: 'Session ID and message are required'
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate message length
        if (message.length > 2000) {
            return new Response(JSON.stringify({
                error: {
                    code: 'MESSAGE_TOO_LONG',
                    message: 'Message must be less than 2000 characters'
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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

        // Verify session belongs to user
        const sessionResponse = await fetch(
            `${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}&user_id=eq.${userId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!sessionResponse.ok) {
            return new Response(JSON.stringify({
                error: {
                    code: 'SESSION_NOT_FOUND',
                    message: 'Session not found'
                }
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const sessions = await sessionResponse.json();
        if (sessions.length === 0) {
            return new Response(JSON.stringify({
                error: {
                    code: 'UNAUTHORIZED_SESSION',
                    message: 'Unauthorized access to session'
                }
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const session = sessions[0];

        // Get user profile for role-based context
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role,full_name,email`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        let userRole = 'member';
        let userName = 'Member';
        let userEmail = '';

        if (profileResponse.ok) {
            const profiles = await profileResponse.json();
            if (profiles.length > 0) {
                userRole = profiles[0].role || 'member';
                userName = profiles[0].full_name || 'Member';
                userEmail = profiles[0].email || '';
            }
        }

        console.log(`Chat message from user ${userId} (${userName}, role: ${userRole})`);

        // Save user message
        const userMessageResponse = await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                session_id: sessionId,
                sender_type: 'user',
                content: message,
                metadata: {}
            })
        });

        if (!userMessageResponse.ok) {
            throw new Error('Failed to save user message');
        }

        // Get recent conversation history (last 10 messages, excluding the one just saved)
        const historyResponse = await fetch(
            `${supabaseUrl}/rest/v1/chat_messages?session_id=eq.${sessionId}&order=created_at.desc&limit=11`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        let conversationHistory = [];
        if (historyResponse.ok) {
            const messages = await historyResponse.json();
            // Reverse to chronological order and skip the last (newest) message
            conversationHistory = messages.reverse().slice(0, -1);
        }

        // Search knowledge base for relevant context
        const kbQuery = message.toLowerCase();
        let kbContext = '';

        // Determine access level based on role
        let accessFilter = 'access_level=in.(all)';
        if (userRole === 'admin') {
            accessFilter = 'access_level=in.(all,member,board,admin)';
        } else if (userRole === 'board') {
            accessFilter = 'access_level=in.(all,member,board)';
        } else if (userRole === 'member') {
            accessFilter = 'access_level=in.(all,member)';
        }

        // Improved knowledge base search
        const kbResponse = await fetch(
            `${supabaseUrl}/rest/v1/knowledge_base_articles?is_published=eq.true&${accessFilter}&or=(title.ilike.*${encodeURIComponent(kbQuery)}*,content.ilike.*${encodeURIComponent(kbQuery)}*)&select=title,content,category&limit=3`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (kbResponse.ok) {
            const articles = await kbResponse.json();
            if (articles.length > 0) {
                kbContext = articles.map(a =>
                    `[KB Article - ${a.category || 'General'}]\nTitle: ${a.title}\n${a.content.substring(0, 500)}${a.content.length > 500 ? '...' : ''}`
                ).join('\n\n');
                console.log(`Found ${articles.length} relevant KB articles`);
            }
        }

        // Build context-aware prompt for Gemini
        const systemPrompt = `You are an AI assistant for the Islamic Society of San Bernardino (ISSB) Membership Portal. You help members with questions about:

- Event registration and attendance
- Volunteer opportunities and logging hours
- Donation campaigns and giving
- Photo galleries and community activities
- Membership fees and payment
- Badge system and rewards
- General portal navigation

User Information:
- Name: ${userName}
- Role: ${userRole}
- Current Page: ${session.context_data?.current_page || 'Portal'}

${kbContext ? `\nRelevant Knowledge Base Information:\n${kbContext}\n` : ''}

${conversationHistory.length > 0 ? `Recent Conversation:\n${conversationHistory.slice(-6).map(m => `${m.sender_type === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n` : ''}

Current User Question: ${message}

Instructions:
1. Provide clear, helpful responses based on the knowledge base when available
2. Be warm, professional, and concise (aim for 2-3 paragraphs max)
3. If the question requires admin action (account issues, payment problems, etc.), politely suggest escalating to a human admin
4. If you're unsure, admit it and offer to escalate rather than guessing
5. Avoid repeating information from recent conversation unless asked

Response:`;

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
                        maxOutputTokens: 1000,
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
        const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
                          'I apologize, but I am having trouble generating a response right now. Please try again in a moment, or escalate to a human admin for immediate assistance.';

        // Enhanced escalation detection
        const escalationKeywords = ['escalat', 'human agent', 'admin', 'speak to someone', 'talk to a person', 'human help'];
        const shouldEscalate = escalationKeywords.some(keyword =>
            aiResponse.toLowerCase().includes(keyword)
        );

        // Save AI response
        const aiMessageResponse = await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                session_id: sessionId,
                sender_type: 'assistant',
                content: aiResponse,
                metadata: {
                    model: 'gemini-2.0-flash-exp',
                    kb_articles_used: kbContext !== '',
                    kb_article_count: kbContext ? (kbContext.match(/\[KB Article/g) || []).length : 0,
                    escalation_suggested: shouldEscalate,
                    user_role: userRole,
                    response_length: aiResponse.length
                }
            })
        });

        if (!aiMessageResponse.ok) {
            throw new Error('Failed to save AI response');
        }

        const aiMessages = await aiMessageResponse.json();
        const aiMessage = aiMessages[0];

        // Generate contextual follow-up suggestions
        let suggestions = [];
        if (shouldEscalate) {
            suggestions = ['Escalate to human admin', 'Try rephrasing my question', 'View help articles'];
        } else if (message.toLowerCase().includes('event')) {
            suggestions = ['How do I register?', 'View upcoming events', 'Tell me about event fees'];
        } else if (message.toLowerCase().includes('volunteer')) {
            suggestions = ['How do I log hours?', 'View opportunities', 'Tell me about volunteer badges'];
        } else if (message.toLowerCase().includes('donat')) {
            suggestions = ['How do I donate?', 'View campaigns', 'Is my donation tax-deductible?'];
        } else {
            suggestions = ['What else can you help with?', 'Tell me about events', 'How does volunteering work?'];
        }

        console.log(`AI response generated (${aiResponse.length} chars, escalation: ${shouldEscalate})`);

        return new Response(JSON.stringify({
            data: {
                message: aiMessage,
                suggestions: suggestions.slice(0, 3),
                escalation_suggested: shouldEscalate
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chat message error:', error);

        const errorResponse = {
            error: {
                code: 'CHAT_MESSAGE_FAILED',
                message: error.message || 'An unexpected error occurred'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
