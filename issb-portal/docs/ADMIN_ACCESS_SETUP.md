# Simplified Admin Access Setup Guide

## Overview

Instead of manually running SQL commands, use the **create-admin** Edge Function to quickly gain admin access for testing the admin dashboard.

---

## Quick Start (3 Steps)

### Step 1: Deploy Edge Functions (If Not Already Deployed)

The Edge Functions need to be deployed to your Supabase project. If you have Supabase CLI installed:

```bash
cd /workspace/issb-portal
supabase functions deploy create-admin
supabase functions deploy admin-update-user-role
```

**Alternative**: Deploy via Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn/functions
2. Click "Deploy new function"
3. Upload the function files from `supabase/functions/`

### Step 2: Call the create-admin Function

Use this **verification code**: `ISSB_ADMIN_2024`

**Option A: Using curl (Terminal)**

```bash
curl -X POST \
  'https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc' \
  -d '{
    "email": "your-email@example.com",
    "verificationCode": "ISSB_ADMIN_2024"
  }'
```

**Replace `your-email@example.com` with your actual registered email.**

**Option B: Using JavaScript (Browser Console)**

On the portal website, open browser console (F12) and run:

```javascript
fetch('https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc'
  },
  body: JSON.stringify({
    email: 'your-email@example.com',
    verificationCode: 'ISSB_ADMIN_2024'
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

**Replace `your-email@example.com` with your actual registered email.**

**Option C: Using Postman/Insomnia**

1. **Method**: POST
2. **URL**: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin`
3. **Headers**:
   - `Content-Type`: `application/json`
   - `apikey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc`
4. **Body** (JSON):
```json
{
  "email": "your-email@example.com",
  "verificationCode": "ISSB_ADMIN_2024"
}
```

### Step 3: Login and Access Admin Dashboard

**Success Response:**
```json
{
  "success": true,
  "message": "Admin role successfully added to your-email@example.com!",
  "instructions": [
    "Please logout of the portal",
    "Login again with your credentials",
    "Navigate to /admin/users to access the admin dashboard"
  ],
  "adminUrl": "/admin/users"
}
```

**Follow the instructions**:
1. Logout of the portal
2. Login again
3. Navigate to https://6op3uk8bqhzd.space.minimax.io/admin/users

---

## Verification Code

**Code**: `ISSB_ADMIN_2024`

This code is required to prevent unauthorized admin access. It's for testing purposes only.

---

## Error Handling

### Common Errors

**1. Invalid Verification Code**
```json
{
  "error": "Invalid verification code",
  "details": "Please use the correct verification code for testing"
}
```
**Solution**: Make sure you're using `ISSB_ADMIN_2024` exactly (case-sensitive).

**2. User Not Found**
```json
{
  "error": "User not found",
  "details": "No user found with email: xxx. Please register first."
}
```
**Solution**: Register an account on the portal first, then use the create-admin function.

**3. Already Admin**
```json
{
  "success": true,
  "message": "User xxx already has admin role",
  "alreadyAdmin": true
}
```
**Solution**: You're already an admin! Just login and access /admin/users.

**4. Function Not Deployed**
```
404 Not Found
```
**Solution**: Deploy the Edge Function first (see Step 1 above).

---

## Security Notes

This Edge Function is designed for **testing purposes only**. In production:

1. Remove or disable the `create-admin` function
2. Use proper admin invitation system
3. Implement multi-factor authentication
4. Use more secure verification methods

**Current Security Measures**:
- Requires valid verification code
- Only works for existing registered users
- Logs all admin creation attempts
- Includes IP address tracking

---

## Manual SQL Alternative (If Edge Function Unavailable)

If the Edge Function is not deployed, you can still create admin access via SQL:

```sql
-- Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn/editor

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

Then logout and login again.

---

## Testing the Admin Dashboard

Once you have admin access:

1. Navigate to: https://6op3uk8bqhzd.space.minimax.io/admin/users
2. Follow the comprehensive testing guide: `docs/PHASE2_MANUAL_TESTING_GUIDE.md`
3. Or use quick checklist: `docs/PHASE2_QUICK_TEST_CHECKLIST.md`

---

## Edge Function Details

### create-admin Function

**File**: `supabase/functions/create-admin/index.ts`

**Features**:
- Validates verification code
- Checks if user exists
- Updates user role to admin
- Updates profiles table
- Logs admin creation for auditing
- Returns clear success/error messages

**Endpoint**: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin`

**Method**: POST

**Required Fields**:
- `email` (string): User's registered email
- `verificationCode` (string): Must be `ISSB_ADMIN_2024`

**Optional Fields**:
- `role` (string): Default is "admin", can be "member" or "volunteer"

---

## Troubleshooting

### Function Returns 500 Error

1. Check Supabase Function Logs:
   - Go to https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn/functions
   - Select "create-admin"
   - View "Logs" tab

2. Common causes:
   - Missing environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
   - Database connection issues
   - Invalid request format

### Function Not Responding

1. Verify function is deployed:
   ```bash
   curl -I https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin
   ```
   Should return: `200 OK` for OPTIONS request

2. Check Supabase project status in dashboard

### Still Can't Access Admin Dashboard After Success

1. **Clear browser cache and cookies**
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Try incognito/private window**
4. **Verify role was updated**:
   ```sql
   SELECT email, raw_user_meta_data->'role' as role 
   FROM auth.users 
   WHERE email = 'your-email@example.com';
   ```

---

## Summary

**Fastest Path to Admin Access**:

1. Make sure you have an account registered on the portal
2. Run this curl command (replace email):
   ```bash
   curl -X POST \
     'https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin' \
     -H 'Content-Type: application/json' \
     -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc' \
     -d '{"email":"your@email.com","verificationCode":"ISSB_ADMIN_2024"}'
   ```
3. Logout and login again
4. Go to https://6op3uk8bqhzd.space.minimax.io/admin/users

**Total time**: Less than 1 minute!

---

## Next Steps

After gaining admin access:
1. Test the admin dashboard features
2. Follow the manual testing guide
3. Report any issues or bugs found
4. Provide feedback on the user experience

---

**Verification Code**: `ISSB_ADMIN_2024`  
**Function Endpoint**: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin`  
**Admin Dashboard**: https://6op3uk8bqhzd.space.minimax.io/admin/users
