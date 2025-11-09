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
            throw new Error('Session ID and message are required');
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
            throw new Error('No authorization header');
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
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Verify session belongs to user
        const sessionResponse = await fetch(
            `${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}&user_id=eq.${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!sessionResponse.ok) {
            throw new Error('Session not found');
        }

        const sessions = await sessionResponse.json();
        if (sessions.length === 0) {
            throw new Error('Unauthorized access to session');
        }

        const session = sessions[0];

        // Get user profile for role-based context
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        let userRole = 'regular';
        let userName = 'Member';
        if (profileResponse.ok) {
            const profiles = await profileResponse.json();
            if (profiles.length > 0) {
                userRole = profiles[0].role || 'regular';
                userName = profiles[0].name || 'Member';
            }
        }

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
                content: message
            })
        });

        if (!userMessageResponse.ok) {
            throw new Error('Failed to save user message');
        }

        // Get recent conversation history (last 10 messages)
        const historyResponse = await fetch(
            `${supabaseUrl}/rest/v1/chat_messages?session_id=eq.${sessionId}&order=created_at.desc&limit=10`,
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
            conversationHistory = messages.reverse();
        }

        // Search knowledge base for relevant context
        const kbQuery = message.toLowerCase();
        let kbContext = '';
        
        // Determine access level based on role
        let accessFilter = 'access_level=eq.all';
        if (userRole === 'admin' || userRole === 'board') {
            accessFilter = 'access_level=in.(all,admin,board)';
        }

        const kbResponse = await fetch(
            `${supabaseUrl}/rest/v1/knowledge_base_articles?is_published=eq.true&${accessFilter}&or=(title.ilike.*${encodeURIComponent(kbQuery)}*,content.ilike.*${encodeURIComponent(kbQuery)}*)&limit=3`,
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
                kbContext = articles.map(a => `Title: ${a.title}\nContent: ${a.content}`).join('\n\n');
            }
        }

        // Build context-aware prompt for Gemini
        const systemPrompt = `You are an AI assistant for the ISSB Portal, a community engagement platform for board members and volunteers.

User Information:
- Name: ${userName}
- Role: ${userRole}
- Current Context: ${session.context_data?.current_page || 'General Help'}

Your responsibilities:
1. Provide helpful, accurate information about the ISSB Portal
2. Guide users through portal features (volunteering, events, communication, badges)
3. Answer questions using the knowledge base when available
4. Be professional, friendly, and concise
5. If you cannot help, suggest escalating to a human agent

${kbContext ? `Knowledge Base Context:\n${kbContext}\n` : ''}

Conversation History:
${conversationHistory.slice(-5).map(m => `${m.sender_type === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}

Current User Message: ${message}

Please provide a helpful response. If the question requires admin intervention or is too complex, suggest escalation.`;

        // Call Google Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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
                        maxOutputTokens: 800,
                        topP: 0.8,
                        topK: 40
                    }
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
                          'I apologize, but I am having trouble generating a response. Please try again or escalate to a human agent.';

        // Check if escalation is suggested
        const shouldEscalate = aiResponse.toLowerCase().includes('escalat') || 
                              aiResponse.toLowerCase().includes('human agent') ||
                              aiResponse.toLowerCase().includes('admin');

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
                    model: 'gemini-2.0-flash',
                    kb_articles_used: kbContext ? true : false,
                    escalation_suggested: shouldEscalate
                }
            })
        });

        if (!aiMessageResponse.ok) {
            throw new Error('Failed to save AI response');
        }

        const aiMessage = await aiMessageResponse.json();

        // Update session last_message_at
        await fetch(`${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                last_message_at: new Date().toISOString()
            })
        });

        // Generate follow-up suggestions
        const suggestions = shouldEscalate 
            ? ['Escalate to human agent', 'Try rephrasing', 'View help articles']
            : ['Tell me more', 'What else can you help with?', 'View related articles'];

        return new Response(JSON.stringify({
            data: {
                message: aiMessage[0],
                suggestions,
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
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
