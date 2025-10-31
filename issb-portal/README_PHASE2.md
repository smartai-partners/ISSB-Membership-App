# Phase 2 Admin Dashboard - Complete Setup & Testing Guide

**Deployment**: https://6op3uk8bqhzd.space.minimax.io  
**Status**: Deployed and Ready for Testing  
**Date**: 2025-10-31

---

## What's New in Phase 2

Phase 2 transforms the admin user management interface into an enterprise-grade system with:

- **DataTable Component**: Professional table with sorting, filtering, and pagination
- **Advanced Filters**: Role and status filters with real-time updates
- **Search System**: Debounced search (500ms) for better performance
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **User Management**: Edit roles and statuses with instant updates
- **RTK Query Integration**: Automatic caching and state management
- **Edge Functions**: Secure backend operations with audit logging

---

## Getting Started in 3 Steps

### Step 1: Deploy Edge Functions

The admin dashboard requires two Edge Functions for full functionality:

**Option A: Via Supabase Dashboard** (No CLI Required - Recommended)

1. Go to: https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn/functions
2. Deploy `create-admin`:
   - Click "New Edge Function"
   - Name: `create-admin`
   - Copy code from: `supabase/functions/create-admin/index.ts`
   - Deploy
3. Deploy `admin-update-user-role`:
   - Click "New Edge Function"
   - Name: `admin-update-user-role`
   - Copy code from: `supabase/functions/admin-update-user-role/index.ts`
   - Deploy

**Option B: Via Supabase CLI**

```bash
cd /workspace/issb-portal
supabase login
supabase link --project-ref lsyimggqennkyxgajzvn
supabase functions deploy create-admin
supabase functions deploy admin-update-user-role
```

**Full Deployment Guide**: `docs/EDGE_FUNCTIONS_DEPLOYMENT.md`

### Step 2: Get Admin Access

**Quick Method** (Using create-admin Edge Function):

```bash
curl -X POST \
  'https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc' \
  -d '{"email":"your@email.com","verificationCode":"ISSB_ADMIN_2024"}'
```

**Replace `your@email.com`** with your registered email address.

**Verification Code**: `ISSB_ADMIN_2024`

**Then**:
1. Logout of the portal
2. Login again
3. Navigate to /admin/users

**Alternative Method** (SQL):

If Edge Function is not deployed, run this in Supabase SQL Editor:

```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}', '"admin"'
)
WHERE email = 'your@email.com';
```

**Full Admin Access Guide**: `docs/ADMIN_ACCESS_SETUP.md`

### Step 3: Test the Admin Dashboard

Navigate to: **https://6op3uk8bqhzd.space.minimax.io/admin/users**

Follow the testing guide to verify all features work correctly.

**Quick Test** (15 minutes): `docs/PHASE2_QUICK_TEST_CHECKLIST.md`  
**Comprehensive Test** (30 minutes): `docs/PHASE2_MANUAL_TESTING_GUIDE.md`

---

## Key Features to Test

### 1. DataTable
- Professional table layout
- User data with columns: Name, Email, Role, Status, Membership, Actions
- Responsive design
- Proper styling with green mosque theme

### 2. Search
- Search input with debouncing (500ms delay)
- Filters by name or email
- Real-time results
- Clear search functionality

### 3. Filters
- Role filter (admin, member, volunteer)
- Status filter (active, inactive, pending)
- Combined filtering (AND logic)
- Clear all filters button

### 4. Sorting
- Click column headers to sort
- Visual indicators (arrows)
- Three states: ascending, descending, reset
- Works on all sortable columns

### 5. Pagination
- Next/Previous navigation
- Page numbers
- Page size selector (10, 25, 50, 100)
- Total count display
- Disabled buttons at boundaries

### 6. User Management
- Edit button opens dialog
- Role dropdown
- Status dropdown
- Save changes with instant updates
- Success notifications
- Persistent changes (survives page refresh)

### 7. Accessibility
- Full keyboard navigation (Tab, Enter, Escape)
- ARIA labels and live regions
- Focus indicators
- Screen reader compatible

---

## Documentation Reference

All documentation is located in the `/workspace/issb-portal/docs/` directory:

| Document | Purpose | Time |
|----------|---------|------|
| `ADMIN_ACCESS_SETUP.md` | Get admin access quickly | 5 min |
| `EDGE_FUNCTIONS_DEPLOYMENT.md` | Deploy Edge Functions | 10 min |
| `PHASE2_QUICK_TEST_CHECKLIST.md` | Quick testing | 15 min |
| `PHASE2_MANUAL_TESTING_GUIDE.md` | Comprehensive testing | 30 min |
| `PHASE2_TESTING_STATUS_REPORT.md` | Executive summary | Read |
| `phase2_developer_guide.md` | Technical details | Reference |
| `PHASE2_ADMIN_ENHANCEMENT_SUMMARY.md` | Implementation summary | Reference |

---

## Expected Test Results

If everything works correctly:

- DataTable displays all users with proper formatting
- Search filters results after 500ms pause
- Role and status filters work independently and together
- Sorting changes data order with visual feedback
- Pagination navigates through pages smoothly
- Edit dialog opens and saves changes
- Role/status updates persist after page refresh
- No console errors (check F12)
- Full keyboard navigation works
- Loading states display properly

---

## Troubleshooting

### Can't Access /admin/users

**Symptoms**: 403 Forbidden or redirected away

**Solutions**:
1. Verify you have admin role:
   ```sql
   SELECT email, raw_user_meta_data->'role' as role 
   FROM auth.users 
   WHERE email = 'your@email.com';
   ```
2. Logout and login again
3. Clear browser cache
4. Try incognito/private window

### Edge Function Returns 404

**Symptoms**: Function not found error

**Solutions**:
1. Verify function is deployed in Supabase Dashboard
2. Check function name is exactly: `create-admin` (not `create_admin`)
3. Deploy using dashboard or CLI

### DataTable Shows No Data

**Symptoms**: Empty table or loading forever

**Solutions**:
1. Open browser console (F12) - check for errors
2. Check Network tab - look for failed API calls
3. Verify you have test users in database
4. Check Supabase API logs

### Edit User Doesn't Work

**Symptoms**: Dialog opens but save fails

**Solutions**:
1. Verify `admin-update-user-role` Edge Function is deployed
2. Check Edge Function logs in Supabase Dashboard
3. Verify you're logged in with admin account
4. Check Network tab for error responses

### Common Console Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot read property of undefined" | Missing data | Check API response format |
| "Failed to fetch" | Network issue | Check Supabase project status |
| "Unauthorized" | Not logged in | Login again |
| "Forbidden" | Not admin | Update role to admin |

---

## File Structure

```
issb-portal/
├── docs/
│   ├── ADMIN_ACCESS_SETUP.md              ← Admin access guide
│   ├── EDGE_FUNCTIONS_DEPLOYMENT.md       ← Deploy Edge Functions
│   ├── PHASE2_QUICK_TEST_CHECKLIST.md     ← Quick testing
│   ├── PHASE2_MANUAL_TESTING_GUIDE.md     ← Full testing
│   ├── PHASE2_TESTING_STATUS_REPORT.md    ← Status report
│   ├── phase2_developer_guide.md          ← Technical docs
│   └── PHASE2_ADMIN_ENHANCEMENT_SUMMARY.md ← Summary
├── supabase/
│   └── functions/
│       ├── create-admin/
│       │   └── index.ts                   ← Admin creation function
│       └── admin-update-user-role/
│           └── index.ts                   ← Role update function
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── DataTable.tsx              ← Reusable table
│   │   │   └── UserFilters.tsx            ← Filter component
│   │   └── ui/                            ← UI components
│   ├── pages/
│   │   └── EnhancedUsersManagementPage.tsx ← Admin page
│   ├── store/
│   │   └── api/
│   │       ├── adminApi.ts                ← Admin endpoints
│   │       └── memberApi.ts               ← Member endpoints
│   └── hooks/
│       └── use-toast.ts                   ← Toast notifications
└── test-progress.md                       ← Testing tracker
```

---

## Testing Workflow

### Quick Workflow (15 minutes)

1. **Deploy** Edge Functions via dashboard
2. **Create** admin access with curl command
3. **Login** and navigate to /admin/users
4. **Test** using quick checklist
5. **Report** any issues found

### Comprehensive Workflow (45 minutes)

1. **Deploy** Edge Functions via CLI or dashboard
2. **Verify** deployment with test curl request
3. **Create** admin access
4. **Test** all 9 pathways from comprehensive guide
5. **Document** findings with screenshots
6. **Report** detailed test results

---

## Next Steps

After testing the admin dashboard:

1. **Document Bugs**: Use bug report template in testing guides
2. **Provide Feedback**: Share your experience and suggestions
3. **Performance Notes**: Record any slow operations
4. **Accessibility Check**: Test with screen readers if available
5. **Mobile Testing**: Try on tablet and mobile devices

---

## Support Resources

**Supabase Dashboard**: https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn

**Quick Links**:
- Functions: /functions
- Database: /editor
- Auth: /auth/users
- API Logs: /logs/explorer

**Project Info**:
- Project ID: `lsyimggqennkyxgajzvn`
- Project URL: `https://lsyimggqennkyxgajzvn.supabase.co`
- Anon Key: Available in `docs/ADMIN_ACCESS_SETUP.md`

---

## Summary

Phase 2 Admin Dashboard Enhancement is **complete and deployed**. 

**To get started**:
1. Deploy the Edge Functions (10 minutes)
2. Create admin access (1 minute)
3. Test the admin dashboard (15-30 minutes)

**All documentation is ready** to guide you through deployment, setup, and comprehensive testing.

**Need help?** All guides include troubleshooting sections and common issues.

---

**Deployment URL**: https://6op3uk8bqhzd.space.minimax.io  
**Admin Dashboard**: https://6op3uk8bqhzd.space.minimax.io/admin/users  
**Verification Code**: `ISSB_ADMIN_2024`  
**Status**: Ready for Testing
