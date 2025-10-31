# Edge Functions Deployment Guide

## Quick Deployment Options

You have 3 options to deploy the Edge Functions for the admin dashboard:

---

## Option 1: Via Supabase Dashboard (Easiest - No CLI Required)

### Step 1: Access Functions Dashboard
1. Go to: https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn/functions
2. Login with your Supabase credentials

### Step 2: Deploy create-admin Function

1. Click **"Deploy new function"** or **"New Edge Function"**
2. **Function name**: `create-admin`
3. **Method**: Upload file or paste code
4. **Code**: Copy from `/workspace/issb-portal/supabase/functions/create-admin/index.ts`
5. Click **"Deploy function"**

### Step 3: Deploy admin-update-user-role Function

1. Click **"Deploy new function"** again
2. **Function name**: `admin-update-user-role`
3. **Code**: Copy from `/workspace/issb-portal/supabase/functions/admin-update-user-role/index.ts`
4. Click **"Deploy function"**

### Step 4: Verify Deployment

Test the create-admin function:

```bash
curl -X POST \
  'https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc' \
  -d '{"email":"test@example.com","verificationCode":"ISSB_ADMIN_2024"}'
```

If you get a 404, the function is not yet deployed. Any other response means it's working!

---

## Option 2: Via Supabase CLI (Recommended for Developers)

### Prerequisites

Install Supabase CLI:

**Mac/Linux**:
```bash
brew install supabase/tap/supabase
```

**Windows** (via npm):
```bash
npm install -g supabase
```

**Or download binary**: https://github.com/supabase/cli/releases

### Deployment Steps

1. **Login to Supabase**:
```bash
supabase login
```

2. **Link to your project**:
```bash
cd /workspace/issb-portal
supabase link --project-ref lsyimggqennkyxgajzvn
```

3. **Deploy Both Functions**:
```bash
supabase functions deploy create-admin
supabase functions deploy admin-update-user-role
```

4. **Verify Deployment**:
```bash
supabase functions list
```

You should see both functions listed with status "ACTIVE".

---

## Option 3: Manual API Deployment (Advanced)

If you prefer to use the Supabase Management API directly:

### Deploy create-admin

```bash
# Get the function code
FUNCTION_CODE=$(cat /workspace/issb-portal/supabase/functions/create-admin/index.ts | base64)

# Deploy via API
curl -X POST \
  'https://api.supabase.com/v1/projects/lsyimggqennkyxgajzvn/functions' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "slug": "create-admin",
    "name": "create-admin",
    "body": "'"$FUNCTION_CODE"'",
    "verify_jwt": false
  }'
```

**Note**: Replace `YOUR_SUPABASE_ACCESS_TOKEN` with your actual access token.

---

## Verifying Edge Functions Are Working

### Test create-admin Function

**Quick Test** (using curl):

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

**Expected Responses**:

Success (user exists and was promoted):
```json
{
  "success": true,
  "message": "Admin role successfully added to your-email@example.com!",
  "instructions": [...]
}
```

User not found (register first):
```json
{
  "error": "User not found",
  "details": "No user found with email: xxx. Please register first."
}
```

Invalid code:
```json
{
  "error": "Invalid verification code"
}
```

404 Not Found:
```
Function not deployed yet - deploy using one of the options above
```

### Test admin-update-user-role Function

This function requires authentication, so test it from the admin dashboard after logging in.

---

## Environment Variables

The Edge Functions automatically access these environment variables from your Supabase project:

- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Anonymous/public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

**No additional configuration needed** - these are automatically available in Edge Functions.

---

## Function Endpoints

After deployment, your functions will be available at:

**create-admin**:
```
https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin
```

**admin-update-user-role**:
```
https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/admin-update-user-role
```

---

## Monitoring & Logs

### View Function Logs

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn/functions
2. Click on the function name (create-admin or admin-update-user-role)
3. Go to **"Logs"** tab
4. View real-time logs and errors

### Common Log Messages

**create-admin**:
- `Successfully created admin user: {...}` - Admin created successfully
- `Invalid verification code attempt: {...}` - Wrong code used
- `Error listing users: {...}` - Database connection issue

**admin-update-user-role**:
- `Successfully updated user: {...}` - User role/status updated
- `Non-admin user attempted role update: {...}` - Permission denied
- `Authentication error: {...}` - Invalid or expired token

---

## Troubleshooting

### Function Returns 404

**Problem**: Function not deployed or wrong name

**Solution**:
1. Check function list in Supabase Dashboard
2. Verify function name is exactly: `create-admin` (not `create_admin` or `createAdmin`)
3. Redeploy using one of the options above

### Function Returns 500

**Problem**: Internal server error

**Solution**:
1. Check function logs in Supabase Dashboard
2. Common causes:
   - Missing environment variables (shouldn't happen in Supabase)
   - Database connection issues
   - Code syntax errors
3. Verify function code is correct (check for any copy/paste errors)

### Function Returns CORS Error

**Problem**: Browser blocking request

**Solution**:
This shouldn't happen as functions include CORS headers. If it does:
1. Use curl instead of browser fetch
2. Check if you're using the correct API key
3. Verify function deployed correctly

### "Invalid Verification Code"

**Problem**: Wrong code or typo

**Solution**:
- Use exactly: `ISSB_ADMIN_2024` (case-sensitive)
- No extra spaces
- Check JSON syntax in request body

---

## Security Considerations

### For Production

Before going to production:

1. **Remove create-admin function**:
   ```bash
   supabase functions delete create-admin
   ```
   Or delete via dashboard

2. **Keep admin-update-user-role function**:
   - This is secure (requires admin authentication)
   - Used by the admin dashboard UI

3. **Implement proper admin invitation system**:
   - Email-based invitations
   - Approval workflows
   - Multi-factor authentication

### For Testing

Current setup is appropriate for testing:
- Verification code provides basic security
- All admin creations are logged
- Only works for existing registered users
- IP addresses tracked in audit logs

---

## Quick Reference

**Deploy Command** (Supabase CLI):
```bash
cd /workspace/issb-portal
supabase functions deploy create-admin
supabase functions deploy admin-update-user-role
```

**Test Command**:
```bash
curl -X POST \
  'https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc' \
  -d '{"email":"your@email.com","verificationCode":"ISSB_ADMIN_2024"}'
```

**Dashboard URL**: https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn/functions

**Function Files**:
- `supabase/functions/create-admin/index.ts`
- `supabase/functions/admin-update-user-role/index.ts`

---

## Next Steps

1. **Deploy the Edge Functions** using Option 1 or 2 above
2. **Create admin access** using the `create-admin` function
3. **Test the admin dashboard** at https://6op3uk8bqhzd.space.minimax.io/admin/users
4. **Follow the testing guide** in `docs/PHASE2_MANUAL_TESTING_GUIDE.md`

---

**Need Help?**

If you encounter issues during deployment:
1. Check the function logs in Supabase Dashboard
2. Verify your Supabase project is active and accessible
3. Ensure you're using the correct project reference ID: `lsyimggqennkyxgajzvn`
4. Try the dashboard deployment method (Option 1) as it's most reliable
