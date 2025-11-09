# 🚨 CHATBOT QUICK FIX - Step by Step

**Current Status:** The chatbot is failing because the Google Gemini API key is not configured.

## ⚡ IMMEDIATE FIX NEEDED

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Sign in with your account

2. **Select Your Project**
   - Click on: `lsyimggqennkyxgajzvn`
   - This should show "ISSB Portal" project

3. **Add Environment Variable**
   - Go to: **Settings** (left sidebar)
   - Click: **Environment Variables**
   - Click: **"Add new variable"**
   - **Name:** `GOOGLE_GEMINI_API_KEY`
   - **Value:** `AIzaSyAv_gX87saMDtGD0uC5E4dXyz809oQ6o5o`
   - Click: **Save**

4. **Wait & Test**
   - Wait 2-3 minutes
   - Test: https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/test-gemini-api
   - Should return: `{"success": true, "message": "Google Gemini API is configured and working!"}`

### Method 2: Via Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Set the environment variable
supabase secrets set GOOGLE_GEMINI_API_KEY=AIzaSyAv_gX87saMDtGD0uC5E4dXyz809oQ6o5o

# Then redeploy functions (if needed)
supabase functions deploy
```

## 🧪 Testing the Fix

After setting the environment variable:

1. **Test the API:** Visit: https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/test-gemini-api
   - Should show: `{"success": true, ...}`

2. **Test the Chatbot:** Go to https://ngclt8fbwfb0.space.minimax.io
   - Login with admin credentials
   - Click the chat widget
   - Send: "Hello, how can you help me?"
   - Should get AI response (not error)

## 🎯 What This Does

- **Enables AI responses:** Chatbot can now use Google Gemini to answer questions
- **Fixes the error:** No more "I am having trouble responding" message
- **Activates 24/7 support:** Members get instant help with portal questions

## ⚠️ Important Notes

- **Variable name must be exact:** `GOOGLE_GEMINI_API_KEY` (case-sensitive)
- **Wait time needed:** Environment variables take 2-3 minutes to propagate
- **Security:** This is a secure way to store API keys
- **Only affects:** Chatbot AI responses (other features work fine)

## 🆘 If Still Not Working

1. **Double-check the name:** Must be exactly `GOOGLE_GEMINI_API_KEY`
2. **Check the value:** Copy exactly: `AIzaSyAv_gX87saMDtGD0uC5E4dXyz809oQ6o5o`
3. **Wait longer:** Sometimes takes up to 5 minutes
4. **Contact me:** If you're still having issues, let me know the exact error

**Expected Result:** 2-minute fix for the chatbot! 🚀
