// Chat Message Edge Function
// Processes user messages and generates AI responses using Google Gemini
// Enhanced with improved prompts, retry logic, and better error handling

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
        let membershipTier = 'standard';
        if (profileResponse.ok) {
            const profiles = await profileResponse.json();
            if (profiles.length > 0) {
                userRole = profiles[0].role || 'regular';
                userName = profiles[0].full_name || profiles[0].name || 'Member';
                membershipTier = profiles[0].membership_tier || 'standard';
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
        let kbArticlesUsed = [];

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
                kbArticlesUsed = articles.map(a => ({ id: a.id, title: a.title }));
                kbContext = articles.map(a => `
**Article: ${a.title}**
Category: ${a.category || 'General'}
Content: ${a.content}
`).join('\n---\n');
            }
        }

        // Build enhanced context-aware prompt for Gemini
        const systemPrompt = buildEnhancedPrompt({
            userName,
            userRole,
            membershipTier,
            currentPage: session.context_data?.current_page || 'General Help',
            kbContext,
            conversationHistory: conversationHistory.slice(-5),
            userMessage: message
        });

        // Call Google Gemini API with retry logic
        const aiResponse = await callGeminiWithRetry(geminiApiKey, systemPrompt, 3);

        // Analyze response for escalation triggers
        const shouldEscalate = detectEscalationNeed(aiResponse, message);

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
                    kb_articles_used: kbArticlesUsed,
                    escalation_suggested: shouldEscalate,
                    user_role: userRole,
                    context_page: session.context_data?.current_page,
                    timestamp: new Date().toISOString()
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

        // Generate intelligent follow-up suggestions
        const suggestions = generateSmartSuggestions(aiResponse, message, shouldEscalate, userRole);

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
                message: error.message,
                details: error.stack
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Build enhanced system prompt with comprehensive context
 */
function buildEnhancedPrompt({ userName, userRole, membershipTier, currentPage, kbContext, conversationHistory, userMessage }) {
    return `You are an intelligent AI assistant for the ISSB (Islamic Society of the South Bay) Portal, a comprehensive community engagement platform. Your goal is to provide helpful, accurate, and contextual assistance to community members.

# USER CONTEXT
- **Name:** ${userName}
- **Role:** ${userRole} ${userRole === 'admin' || userRole === 'board' ? '(Staff Member)' : '(Community Member)'}
- **Membership:** ${membershipTier} tier
- **Current Location:** ${currentPage}

# YOUR CAPABILITIES

## 1. VOLUNTEER MANAGEMENT
- Guide users through volunteer opportunity discovery and application
- Explain the badge and achievement system
- Help track volunteer hours and progress
- Provide information about volunteer waivers and requirements
- Assist with volunteer scheduling and commitments

## 2. EVENT MANAGEMENT
- Help users discover and register for upcoming events
- Explain event gamification features (points, badges, leaderboards)
- Provide event details, schedules, and requirements
- Assist with event attendance tracking
- Answer questions about event categories and types

## 3. MEMBERSHIP & PROFILE
- Explain membership tiers (Standard, Family, Volunteer) and benefits
- Help users update their profiles and preferences
- Guide users through membership renewal processes
- Explain payment schedules and donation options

## 4. COMMUNICATION PORTAL
- Explain announcement and notification systems
- Help users manage their communication preferences
- Assist with family member management (for family tier)
- Provide guidance on staying connected with the community

## 5. ACHIEVEMENTS & GAMIFICATION
- Explain the badge and achievement system
- Help users track their progress and milestones
- Provide motivation and recognition for community engagement
- Explain contest participation and rewards

## 6. DONATIONS
- Guide users through one-time and recurring donation processes
- Explain donation impact and recognition
- Assist with payment methods and scheduling
- Answer questions about donation tax documentation

# KNOWLEDGE BASE CONTEXT
${kbContext ? `\n**Relevant Articles from Knowledge Base:**\n${kbContext}\n` : '\n*No specific knowledge base articles found for this query.*\n'}

# CONVERSATION HISTORY
${conversationHistory.length > 0 ? conversationHistory.map(m => `${m.sender_type === 'user' ? userName : 'You'}: ${m.content}`).join('\n') : '*This is the start of the conversation.*'}

# CURRENT USER MESSAGE
${userName}: ${userMessage}

# RESPONSE GUIDELINES

1. **Be Personalized:** Use the user's name and acknowledge their role/membership tier when relevant
2. **Be Contextual:** Reference their current page location and previous conversation if applicable
3. **Be Specific:** Use knowledge base articles when available, and cite them naturally in your response
4. **Be Concise:** Keep responses clear and to the point (2-4 paragraphs maximum)
5. **Be Actionable:** Provide clear next steps or guidance
6. **Be Professional Yet Friendly:** Maintain a warm, welcoming tone appropriate for a community organization
7. **Be Accurate:** If you don't know something or it requires admin access, admit it and suggest escalation

# ESCALATION TRIGGERS

Suggest escalation to a human admin if:
- The question requires access to private user data or admin functions
- The issue involves payment problems, account access issues, or security concerns
- The request needs human judgment or approval (e.g., special accommodations)
- You cannot find relevant information after checking the knowledge base
- The user explicitly asks to speak with a human
- The query involves sensitive personal or religious matters requiring pastoral care

# YOUR RESPONSE

Provide a helpful, contextual response to ${userName}'s message above. If escalation is needed, politely explain why and assure them an admin will help soon.`;
}

/**
 * Call Gemini API with exponential backoff retry logic
 */
async function callGeminiWithRetry(apiKey, prompt, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1000,
                            topP: 0.9,
                            topK: 40,
                            candidateCount: 1
                        },
                        safetySettings: [
                            {
                                category: 'HARM_CATEGORY_HARASSMENT',
                                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                            },
                            {
                                category: 'HARM_CATEGORY_HATE_SPEECH',
                                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                            },
                            {
                                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                            },
                            {
                                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                            }
                        ]
                    }),
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Gemini API error (attempt ${attempt + 1}):`, errorText);
                throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!aiResponse) {
                throw new Error('No response text from Gemini API');
            }

            return aiResponse;

        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt + 1} failed:`, error.message);

            // Don't retry on abort (timeout)
            if (error.name === 'AbortError') {
                break;
            }

            // Exponential backoff: wait 1s, 2s, 4s...
            if (attempt < maxRetries - 1) {
                const backoffMs = Math.pow(2, attempt) * 1000;
                console.log(`Retrying after ${backoffMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }
    }

    // All retries failed
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Detect if escalation to human is needed based on response and message content
 */
function detectEscalationNeed(aiResponse, userMessage) {
    const escalationKeywords = [
        'escalat', 'human agent', 'admin', 'speak to someone', 'contact',
        'urgent', 'problem', 'issue', 'complaint', 'help me', 'cannot',
        'doesn\'t work', 'not working', 'error', 'broken', 'unable to'
    ];

    const sensitiveKeywords = [
        'payment', 'charge', 'refund', 'account', 'password', 'login',
        'access denied', 'privacy', 'personal', 'discrimination', 'harassment'
    ];

    const responseText = aiResponse.toLowerCase();
    const messageText = userMessage.toLowerCase();

    // Check if AI suggests escalation
    const aiSuggestsEscalation = escalationKeywords.some(keyword =>
        responseText.includes(keyword)
    );

    // Check if message contains sensitive topics
    const hasSensitiveContent = sensitiveKeywords.some(keyword =>
        messageText.includes(keyword)
    );

    // Check for frustration indicators (multiple punctuation, caps)
    const showsFrustration = /[!?]{2,}/.test(userMessage) ||
                            (userMessage.toUpperCase() === userMessage && userMessage.length > 10);

    return aiSuggestsEscalation || hasSensitiveContent || showsFrustration;
}

/**
 * Generate context-aware follow-up suggestions
 */
function generateSmartSuggestions(aiResponse, userMessage, shouldEscalate, userRole) {
    if (shouldEscalate) {
        return [
            'Escalate to human agent',
            'Tell me more about this issue',
            'View help articles'
        ];
    }

    // Topic detection for smart suggestions
    const message = userMessage.toLowerCase();

    if (message.includes('volunteer')) {
        return [
            'Show available volunteer opportunities',
            'How do volunteer badges work?',
            'Tell me about volunteer requirements'
        ];
    }

    if (message.includes('event')) {
        return [
            'Show upcoming events',
            'How do I earn event points?',
            'Tell me about event registration'
        ];
    }

    if (message.includes('membership') || message.includes('donate')) {
        return [
            'Explain membership tiers',
            'How do I update my profile?',
            'Tell me about donation options'
        ];
    }

    if (message.includes('badge') || message.includes('achievement')) {
        return [
            'Show my achievements',
            'How do I earn more badges?',
            'What are the available contests?'
        ];
    }

    // Default suggestions based on role
    if (userRole === 'admin' || userRole === 'board') {
        return [
            'Help me with admin functions',
            'Show me analytics',
            'Explain admin features'
        ];
    }

    return [
        'What else can you help with?',
        'Show me volunteer opportunities',
        'Tell me about upcoming events'
    ];
}
