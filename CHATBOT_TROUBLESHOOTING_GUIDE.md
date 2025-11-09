# Chatbot Error Troubleshooting Guide
**Date:** 2025-11-08  
**Issue:** "I apologize, but I am having trouble responding right now. Please try again or escalate to a human agent."  
**Status:** 🔧 RESOLUTION IN PROGRESS

## 🎯 Root Cause Identified

**Error:** `Google Gemini API key not configured`

**Explanation:** The AI chatbot uses Google Gemini API to generate responses, but the required API key is not set as an environment variable in your Supabase project.

## 🔧 Solution

### Step 1: Add Environment Variable in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Click on: `lsyimggqennkyxgajzvn`
   - This is your ISSB Portal project

3. **Navigate to Environment Variables**
   - Go to **Settings** (left sidebar)
   - Click on **Environment Variables**
   - Or go to: Settings → Environment Variables

4. **Add the API Key**
   - Click **Add new variable**
   - **Name:** `GOOGLE_GEMINI_API_KEY`
   - **Value:** `AIzaSyAv_gX87saMDtGD0uC5E4dXyz809oQ6o5o`
   - Click **Save**

5. **Redeploy Functions (if needed)**
   - In some cases, you may need to redeploy the edge functions after adding environment variables
   - Functions should automatically detect the new environment variable

### Step 2: Test the Fix

I've deployed a test function to verify the API key is working:

**Test URL:** `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/test-gemini-api`

**Before fix (expected):**
```json
{
  "success": false,
  "error": "GOOGLE_GEMINI_API_KEY not found in environment variables"
}
```

**After fix (expected):**
```json
{
  "success": true,
  "message": "Google Gemini API is configured and working!",
  "apiKey": "AIzaSyAv_gX..."
}
```

### Step 3: Test the Chatbot

Once the environment variable is set:

1. **Go to your portal:** https://ngclt8fbwfb0.space.minimax.io
2. **Login** with your admin credentials
3. **Click the chat widget** (bottom right corner)
4. **Send a test message:** "Hello, how can you help me with volunteering?"
5. **Verify you get an AI response** instead of the error message

## 🔍 Technical Details

### What's Happening

1. **User sends message** → Chat widget calls `chat-message` edge function
2. **Edge function runs** → Tries to get `GOOGLE_GEMINI_API_KEY` from environment
3. **API key missing** → Function throws error: "Google Gemini API key not configured"
4. **Error returned** → User sees: "I apologize, but I am having trouble responding right now..."

### Environment Variable Requirements

- **Variable Name:** `GOOGLE_GEMINI_API_KEY` (exact case-sensitive match)
- **Variable Value:** `AIzaSyAv_gX87saMDtGD0uC5E4dXyz809oQ6o5o`
- **Scope:** Available to all edge functions in the project

## 🚨 Security Note

- The API key is stored securely as an environment variable
- Edge functions can access it via `Deno.env.get('GOOGLE_GEMINI_API_KEY')`
- Never hardcode API keys in function code
- Environment variables are encrypted and secure

## 📱 Chatbot Features (Once Fixed)

After the fix, your AI assistant will provide:

- **24/7 Support:** Instant responses to member questions
- **Context Awareness:** Understanding of user role and portal section
- **Knowledge Base:** Responses based on 15 comprehensive articles
- **Escalation:** Smooth handoff to human agents when needed
- **Role-Based Help:** Different guidance for members vs admins

## 🔄 Verification Checklist

- [ ] Environment variable `GOOGLE_GEMINI_API_KEY` added to Supabase
- [ ] Test function returns success: `true`
- [ ] Chatbot responds with AI-generated messages
- [ ] No more error messages in chat
- [ ] Escalation feature works for complex questions

## 🆘 If You Need Help

If you encounter any issues:

1. **Double-check the variable name:** Must be exactly `GOOGLE_GEMINI_API_KEY`
2. **Verify the value:** `AIzaSyAv_gX87saMDtGD0uC5E4dXyz809oQ6o5o`
3. **Wait 2-3 minutes:** Environment variables can take a moment to propagate
4. **Test the API:** Use the test function I provided above

## 📞 Emergency Contact

If the chatbot is critical for your operations and you need immediate help:
- **System Status:** All other features working (login, admin panel, database)
- **Only Affected:** AI chatbot responses
- **Workaround:** Use escalation feature to connect with human agents directly

---

**Expected Resolution Time:** 5 minutes  
**Next Review:** After environment variable is set  
**Priority:** High - Core member support feature