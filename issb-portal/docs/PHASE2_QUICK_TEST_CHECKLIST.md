# Phase 2 Testing - Quick Reference Checklist

## URL
🔗 **Production**: https://6op3uk8bqhzd.space.minimax.io/admin/users

## Prerequisites
✓ Admin account with role='admin' in database  
✓ Browser DevTools open (F12)  
✓ Test users in database (various roles/statuses)

### Get Admin Access (Choose One Method):

**Method 1: Use create-admin Edge Function (Easiest)**
```bash
# After deploying Edge Functions (see EDGE_FUNCTIONS_DEPLOYMENT.md):
curl -X POST \
  'https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWltZ2dxZW5ua3l4Z2FqenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjEyNDIsImV4cCI6MjA3NzM5NzI0Mn0.M805YQcX85823c1sQB2xHhRV8rKr0RhMSLKfkpoB3Fc' \
  -d '{"email":"your@email.com","verificationCode":"ISSB_ADMIN_2024"}'

# Then: Logout → Login → Access /admin/users
```
**Verification Code**: `ISSB_ADMIN_2024`  
**Full Guide**: `docs/ADMIN_ACCESS_SETUP.md`

**Method 2: SQL Command (If Edge Function Not Deployed)**
```sql
-- Run in Supabase SQL Editor
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}', '"admin"'
)
WHERE email = 'your@email.com';
```

---

## 🚀 Quick Test Sequence (15 minutes)

### 1. Login & Navigation (2 min)
```
□ Load homepage → Login → Navigate to /admin/users
□ Page loads without errors
□ Console shows no errors (F12)
```

### 2. DataTable Display (2 min)
```
□ Table shows: Name | Email | Role | Status | Membership | Actions
□ User data displays in rows
□ Styling looks professional
□ Responsive (resize window)
```

### 3. Search (2 min)
```
□ Type in search box slowly → See debounce (500ms wait)
□ Results filter correctly
□ Clear search → All results return
□ Network tab: Only 1 API call after typing stops
```

### 4. Filters (3 min)
```
□ Role filter: Check "admin" → Only admins shown
□ Status filter: Check "active" → Only active shown
□ Combined: Role + Status → Correct subset
□ Clear filters → All users return
```

### 5. Sorting (2 min)
```
□ Click "Name" header → Sorts A→Z (arrow up)
□ Click again → Sorts Z→A (arrow down)
□ Click again → Reset
□ Try "Email", "Role" columns
```

### 6. Pagination (2 min)
```
□ Click "Next" → Page 2 shows
□ Click "Previous" → Page 1 returns
□ Change page size (10 → 25) → More rows show
□ Last page: "Next" disabled
```

### 7. User Actions (3 min)
```
□ Click "Edit" on user → Dialog opens
□ Change role dropdown → Select new role
□ Click "Save" → Success message shows
□ Table updates without page reload
□ Refresh page → Change persisted
```

### 8. Accessibility (2 min)
```
□ Press Tab → Focus moves logically
□ Tab to filter → Press Space/Enter to interact
□ Tab to table → Press Enter on "Edit"
□ Escape key closes dialogs
```

### 9. Error Check (1 min)
```
□ Final console check → No red errors
□ Network tab → All requests 200/successful
□ Try rapid clicking → No crashes
```

---

## 🐛 Common Issues

| Issue | Likely Cause | Quick Fix |
|-------|--------------|-----------|
| "Access Denied" | Not admin role | Update user role in Supabase |
| Page not found | Wrong URL | Use /admin/users (plural) |
| No data shows | API error | Check Network tab, Supabase logs |
| Infinite loading | Edge Function issue | Check Supabase Functions logs |
| Console errors | Build issue | Check build warnings |

---

## 📸 Screenshot Checklist

Capture these screens:
- [ ] Full admin dashboard page
- [ ] DataTable with data loaded
- [ ] Search results after filtering
- [ ] Filters panel (role/status selected)
- [ ] Edit user dialog/modal
- [ ] Browser console (should be clean)
- [ ] Any errors encountered

---

## ✅ Pass Criteria

**PASS** if all these work:
- ✅ Login & navigation successful
- ✅ Table displays user data
- ✅ Search filters correctly (debounced)
- ✅ Role/status filters work
- ✅ Sorting changes order
- ✅ Pagination navigates pages
- ✅ Edit user updates persist
- ✅ Keyboard navigation works
- ✅ No console errors

**FAIL** if any of these occur:
- ❌ Cannot access /admin/users
- ❌ Table shows no data / errors
- ❌ Critical features broken (search, edit)
- ❌ Console shows red errors
- ❌ Page crashes during normal use

---

## 📝 Quick Bug Report

```
Bug: [What's broken]
Severity: Critical/High/Medium/Low
Steps: 1. [Step] 2. [Step] 3. [Step]
Expected: [What should happen]
Actual: [What happened]
Console Error: [Copy/paste error]
Screenshot: [Attach]
```

---

## ⏱️ Estimated Time
- **Full Testing**: 20-30 minutes
- **Quick Smoke Test**: 10-15 minutes
- **Critical Path Only**: 5-10 minutes

---

## 🔗 Resources
- **Full Guide**: `/workspace/issb-portal/docs/PHASE2_MANUAL_TESTING_GUIDE.md`
- **Developer Guide**: `/workspace/issb-portal/docs/phase2_developer_guide.md`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn
