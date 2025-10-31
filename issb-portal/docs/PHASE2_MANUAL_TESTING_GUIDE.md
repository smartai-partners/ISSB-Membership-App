# Phase 2 Admin Dashboard - Manual Testing Guide

## Deployment Information
**Production URL**: https://6op3uk8bqhzd.space.minimax.io  
**Test Date**: 2025-10-31  
**Feature**: Enhanced Admin User Management Dashboard

## Testing Status
⚠️ **Browser Automation Unavailable** - Manual testing required

---

## Pre-Testing Setup

### 1. Admin Account Requirements
You need an admin account to access `/admin/users`. If you don't have one:

**Option A: Use existing admin account**
- Username/Email: [Your existing admin credentials]
- Password: [Your password]

**Option B: Create admin account via database**
```sql
-- Run in Supabase SQL Editor
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

### 2. Test Data Preparation
Ensure you have test users in the database with various:
- Roles: admin, member, volunteer
- Statuses: active, inactive, pending
- Names for search testing

---

## Testing Pathways

## Pathway 1: Authentication & Navigation

### Steps:
1. **Open Browser**: Navigate to https://6op3uk8bqhzd.space.minimax.io
2. **Verify Homepage**: Check if the portal loads correctly
3. **Login Process**:
   - Click "Login" or "Sign In" button
   - Enter admin credentials
   - Submit login form
   - **Expected**: Successful login, redirected to dashboard
4. **Navigate to Admin**:
   - Click on "Admin" menu item (if visible in navigation)
   - Or directly navigate to: https://6op3uk8bqhzd.space.minimax.io/admin/users
   - **Expected**: Enhanced Users Management page loads

### Success Criteria:
- ✅ Login successful without errors
- ✅ Admin navigation accessible
- ✅ Users management page loads
- ✅ No console errors in browser DevTools

### Common Issues:
- ❌ "Access Denied" → Your account doesn't have admin role
- ❌ Page not found → Check if route is `/admin/users` (with 's')
- ❌ Infinite loading → Check Network tab for API failures

---

## Pathway 2: DataTable Display & Rendering

### Steps:
1. **On `/admin/users` page**, observe the DataTable component
2. **Visual Inspection**:
   - Check column headers: Name, Email, Role, Status, Membership, Actions
   - Verify user data rows display correctly
   - Check for proper styling (borders, padding, alignment)
3. **Open Browser Console** (F12):
   - Check for JavaScript errors (red text)
   - Check Network tab for failed API calls
4. **Take Screenshots**:
   - Full page view
   - Close-up of DataTable
   - Console errors (if any)

### Success Criteria:
- ✅ Table renders with all columns visible
- ✅ User data displays in rows (not empty)
- ✅ Styling looks professional (green theme matching portal)
- ✅ No JavaScript errors in console
- ✅ Responsive design works (try resizing window)

### Test Data Verification:
```javascript
// Open Browser Console and run:
console.table(
  Array.from(document.querySelectorAll('tbody tr')).map(row => ({
    name: row.cells[0]?.textContent,
    email: row.cells[1]?.textContent,
    role: row.cells[2]?.textContent,
    status: row.cells[3]?.textContent
  }))
);
```

---

## Pathway 3: Search Functionality

### Steps:
1. **Locate Search Input**: At top of user filters section
2. **Test Search**:
   - Type slowly: "john" (watch for debounce behavior)
   - **Expected**: No immediate search, waits ~500ms
   - After pause, results filter to matching names/emails
3. **Test Search Variations**:
   - Search by name: "Ahmed"
   - Search by email: "test@"
   - Search with special characters: "o'brien"
   - Clear search (delete all text)
4. **Performance Check**:
   - Type rapidly: "abcdefgh"
   - **Expected**: Only one API call after you stop typing
   - Check Network tab to verify debouncing

### Success Criteria:
- ✅ Search debouncing works (500ms delay)
- ✅ Results filter correctly based on input
- ✅ Clear search restores all results
- ✅ No multiple API calls while typing
- ✅ Loading indicator appears during search

### Debug Commands:
```javascript
// Check if search input exists
document.querySelector('input[placeholder*="Search"]');

// Monitor search API calls
// (In Network tab, filter by "users" to see API requests)
```

---

## Pathway 4: Filter System (Role & Status)

### Steps:
1. **Locate Filter Section**: Above or beside DataTable
2. **Test Role Filter**:
   - Click "Role" dropdown or checkboxes
   - Select "admin" only
   - **Expected**: Table shows only admin users
   - Select "member" additionally
   - **Expected**: Table shows admin + member users
   - Clear all role filters
   - **Expected**: All roles shown again
3. **Test Status Filter**:
   - Click "Status" filter
   - Select "active" only
   - **Expected**: Table shows only active users
   - Try other statuses: inactive, pending
4. **Test Combined Filters**:
   - Set Role: "member" + Status: "active"
   - **Expected**: Only active members shown
5. **Test Filter Clearing**:
   - Look for "Clear Filters" button
   - Click it
   - **Expected**: All filters reset, all users shown

### Success Criteria:
- ✅ Role filter works correctly
- ✅ Status filter works correctly
- ✅ Combined filters work (AND logic)
- ✅ Clear filters button resets everything
- ✅ Filter count displays correctly (e.g., "Showing 5 of 20 users")

### Accessibility Check:
```javascript
// Verify ARIA labels exist
document.querySelectorAll('[role="checkbox"]').forEach(cb => {
  console.log('Checkbox:', cb.ariaLabel || cb.getAttribute('aria-label'));
});

// Check for live region announcements
document.querySelector('[aria-live]');
```

---

## Pathway 5: Column Sorting

### Steps:
1. **Test Each Column Header**:
   - Click "Name" header
   - **Expected**: Sort ascending (A→Z), arrow icon appears
   - Click "Name" again
   - **Expected**: Sort descending (Z→A), arrow flips
   - Click again
   - **Expected**: Sort resets (original order)
2. **Test Other Columns**:
   - Sort by "Email"
   - Sort by "Role"
   - Sort by "Status"
   - Sort by "Membership"
3. **Visual Feedback**:
   - Check for sort indicator (↑↓ arrows)
   - Active sort column should be highlighted
4. **Data Integrity**:
   - Verify rows actually change order
   - Check if sorting is alphabetical/logical

### Success Criteria:
- ✅ All sortable columns work
- ✅ Sort direction toggles correctly
- ✅ Visual indicators display
- ✅ Data orders correctly
- ✅ Sorting persists with filters applied

---

## Pathway 6: Pagination Controls

### Steps:
1. **Locate Pagination**: Usually at bottom of table
2. **Test Navigation**:
   - Click "Next" button
   - **Expected**: Shows page 2 of results
   - Click "Previous" button
   - **Expected**: Returns to page 1
   - Click page numbers directly (if available)
3. **Test Page Size**:
   - Look for "Items per page" dropdown
   - Change from 10 to 25
   - **Expected**: Table shows 25 rows
   - Try other sizes: 50, 100
4. **Test Edge Cases**:
   - Navigate to last page
   - Try clicking "Next" (should be disabled)
   - Navigate to first page
   - Try clicking "Previous" (should be disabled)

### Success Criteria:
- ✅ Next/Previous buttons work
- ✅ Page number indicators correct
- ✅ Page size selector works
- ✅ Edge cases handled (disabled buttons)
- ✅ Total count displayed correctly
- ✅ Pagination works with filters applied

---

## Pathway 7: Accessibility Features

### Keyboard Navigation Test:
1. **Tab Navigation**:
   - Press Tab key repeatedly
   - **Expected**: Focus moves through: Search → Filters → Table → Actions
   - Visual focus indicator should be visible
2. **Filter Interaction**:
   - Tab to Role filter
   - Press Space to open/close
   - Use Arrow keys to navigate options
   - Press Enter to select
3. **Table Navigation**:
   - Tab to table rows
   - Press Enter on "Edit" button
4. **Modal/Dialog Navigation**:
   - Open edit dialog
   - Tab through fields
   - Press Escape to close

### Screen Reader Test (if available):
1. **Enable Screen Reader**: (VoiceOver on Mac, NVDA on Windows)
2. **Navigate Page**:
   - Listen to table announcements
   - Verify filter changes are announced
   - Check button labels are descriptive
3. **Form Fields**:
   - Verify labels are associated with inputs
   - Check error messages are announced

### Success Criteria:
- ✅ All interactive elements keyboard accessible
- ✅ Focus indicators visible
- ✅ Tab order logical
- ✅ ARIA labels present
- ✅ Live regions announce changes
- ✅ Escape key closes modals
- ✅ Enter key activates buttons

### Debug Commands:
```javascript
// Check ARIA attributes
document.querySelectorAll('[role]').forEach(el => {
  console.log(el.tagName, el.getAttribute('role'), el.ariaLabel);
});

// Find live regions
document.querySelectorAll('[aria-live]');

// Check focus management
document.addEventListener('focus', e => console.log('Focus:', e.target), true);
```

---

## Pathway 8: User Actions (Edit, Update Role, Update Status)

### Setup:
1. **Identify Test User**: Pick a non-admin user for testing
2. **Note Current Values**: Record current role and status

### Test Edit User:
1. **Open Edit Dialog**:
   - Locate user row in table
   - Click "Edit" button (or three-dot menu → Edit)
   - **Expected**: Modal/dialog opens
2. **Verify Dialog Contents**:
   - User name displayed
   - Email displayed
   - Role dropdown with current value
   - Status dropdown with current value
   - Save and Cancel buttons

### Test Role Update:
1. **Change Role**:
   - Click Role dropdown
   - Select different role (e.g., "member" → "volunteer")
   - Click "Save" or "Update" button
2. **Verify Success**:
   - Success message/toast appears
   - Dialog closes automatically
   - Table row updates with new role
   - Page doesn't reload
3. **Verify Persistence**:
   - Refresh page
   - Find same user
   - **Expected**: Role change persisted

### Test Status Update:
1. **Change Status**:
   - Edit same user again
   - Change status (e.g., "active" → "inactive")
   - Save changes
2. **Verify Update**:
   - Status updates in table
   - Visual indicator changes (badge color)

### Test Edge Cases:
1. **Cancel Action**:
   - Open edit dialog
   - Make changes
   - Click "Cancel"
   - **Expected**: No changes saved
2. **Validation**:
   - Try invalid inputs (if any validation exists)
   - **Expected**: Error messages display
3. **Concurrent Edits**:
   - Open two browser tabs
   - Edit same user in both
   - Check for conflicts/handling

### Success Criteria:
- ✅ Edit dialog opens correctly
- ✅ Current values pre-populated
- ✅ Role update works and persists
- ✅ Status update works and persists
- ✅ Success feedback provided (toast/message)
- ✅ Table updates without full page reload
- ✅ Cancel button discards changes
- ✅ Form validation works (if applicable)

### Verify Edge Function:
```javascript
// Check Network tab for Edge Function call:
// POST https://[project].supabase.co/functions/v1/admin-update-user-role
// Response should be 200 with success message
```

---

## Pathway 9: Error Handling & Performance

### Error Scenario Testing:

1. **Network Failure Simulation**:
   - Open DevTools → Network tab
   - Set throttling to "Offline"
   - Try to load users
   - **Expected**: Error message displays gracefully
   - Set back to "Online"

2. **API Error Simulation**:
   - Temporarily break API key (if possible)
   - Try to fetch data
   - **Expected**: Friendly error message, not raw error

3. **Invalid Data**:
   - Try edge case searches (very long strings)
   - Try special characters in filters
   - **Expected**: No crashes, graceful handling

### Performance Testing:

1. **Load Time**:
   - Clear browser cache
   - Navigate to /admin/users
   - **Expected**: Page loads within 2-3 seconds
   - Check Network tab for slow requests

2. **Large Dataset**:
   - If 100+ users exist, test pagination
   - Check if scrolling is smooth
   - Verify no memory leaks (check Memory tab)

3. **Rapid Interactions**:
   - Quickly click multiple filters
   - Rapidly sort different columns
   - **Expected**: No crashes, UI remains responsive

### Browser Console Monitoring:

```javascript
// Monitor for errors
window.addEventListener('error', e => {
  console.error('Error caught:', e.message, e.filename, e.lineno);
});

// Monitor for warnings
const originalWarn = console.warn;
console.warn = function(...args) {
  originalWarn.apply(console, ['[WARN]', ...args]);
};

// Check React DevTools for re-render issues
// (If React DevTools extension installed)
```

### Success Criteria:
- ✅ Errors display user-friendly messages
- ✅ No console errors during normal operation
- ✅ Page loads in reasonable time (<3s)
- ✅ UI remains responsive with filters/sorting
- ✅ No memory leaks detected
- ✅ Edge cases handled gracefully

---

## Testing Checklist

### Pre-Testing
- [ ] Admin account confirmed working
- [ ] Browser DevTools open (F12)
- [ ] Test data verified in database
- [ ] Screenshots folder prepared

### Core Features
- [ ] DataTable renders correctly
- [ ] Search with debouncing works
- [ ] Role filter works
- [ ] Status filter works
- [ ] Column sorting works
- [ ] Pagination works
- [ ] User edit dialog opens
- [ ] Role update persists
- [ ] Status update persists

### Accessibility
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Screen reader compatible (if tested)

### Quality
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Responsive design works
- [ ] Cross-browser tested (Chrome, Firefox, Safari)

---

## Reporting Issues

### Bug Report Template:

```markdown
## Bug: [Short Description]

**Severity**: [Critical / High / Medium / Low]
**Pathway**: [Which testing pathway]
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots**:
[Attach screenshots if available]

**Console Errors**:
```
[Paste any console errors here]
```

**Environment**:
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows 11, macOS 14, etc.]
- Screen Size: [1920x1080, etc.]
```

---

## Expected Results Summary

If all tests pass, you should see:

✅ **DataTable**: Professional table with user data, properly styled  
✅ **Search**: Debounced search filtering users by name/email  
✅ **Filters**: Role and status checkboxes filtering table  
✅ **Sorting**: Clickable column headers with visual indicators  
✅ **Pagination**: Working navigation with page size options  
✅ **Accessibility**: Full keyboard navigation and ARIA support  
✅ **User Actions**: Edit dialog with role/status updates persisting  
✅ **Performance**: Fast loading, no errors, responsive design  
✅ **Error Handling**: Graceful error messages, no crashes  

---

## Next Steps After Testing

1. **Document Findings**: Create a test report with all results
2. **Report Bugs**: Use bug report template for any issues found
3. **Capture Evidence**: Take screenshots of working features and any bugs
4. **Performance Metrics**: Note any slow operations or bottlenecks
5. **Accessibility Report**: Document any WCAG 2.1 AA compliance issues

---

## Support Resources

**Documentation Files**:
- `/workspace/issb-portal/docs/PHASE2_ADMIN_ENHANCEMENT_SUMMARY.md`
- `/workspace/issb-portal/docs/phase2_developer_guide.md`

**Component Locations**:
- DataTable: `src/components/admin/DataTable.tsx`
- UserFilters: `src/components/admin/UserFilters.tsx`
- Admin Page: `src/pages/EnhancedUsersManagementPage.tsx`
- Admin API: `src/store/api/adminApi.ts`

**Supabase Dashboard**:
- URL: https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn
- Check Edge Functions logs
- Query database directly for verification

---

## Testing Completed By:
**Name**: _______________  
**Date**: _______________  
**Duration**: ___________ minutes  
**Overall Result**: [ ] Pass [ ] Pass with Issues [ ] Fail  

**Issues Found**: _____  
**Critical Bugs**: _____  
**Recommendations**: _______________________________________________
