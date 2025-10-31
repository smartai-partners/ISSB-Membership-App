# ISSB Volunteer Portal - Quick Start Testing Guide

## Testing Checklist

### Step 1: Initial Access
- [ ] Navigate to https://fvkx52b660xj.space.minimax.io
- [ ] Verify homepage loads correctly
- [ ] Check prayer times widget is displaying
- [ ] Confirm green/mosque branding is consistent

### Step 2: Member Experience Testing

#### Sign In
- [ ] Click "Sign In" or navigate to /login
- [ ] Use existing member credentials OR create new account
- [ ] Verify successful login redirects to homepage

#### Browse Opportunities
- [ ] Click "Volunteer" in navigation
- [ ] Verify "Volunteer Portal" hero section displays
- [ ] Check "Browse Opportunities" view is active by default
- [ ] Test search functionality (if opportunities exist)
- [ ] Test category filter dropdown
- [ ] Test status filter dropdown

#### Sign Up for Opportunity (If Available)
- [ ] Click on an opportunity card
- [ ] Verify capacity bar shows correctly
- [ ] Click "Sign Up" button
- [ ] Confirm success message appears
- [ ] Verify opportunity shows "Signed Up" status
- [ ] Check capacity count incremented

#### View Dashboard
- [ ] Click "My Dashboard" toggle button
- [ ] Verify waiver progress card displays:
  - Current hours / 30 hours
  - Percentage complete
  - Hours remaining
  - Value earned
- [ ] Check stats cards show:
  - Total hours
  - Opportunities count
  - Volunteer level
- [ ] Verify "My Sign-ups" section lists signed-up opportunities
- [ ] Check "Volunteer Hours Log" table displays logged hours

#### Log Volunteer Hours
- [ ] Click "Log Volunteer Hours" button
- [ ] Verify modal opens with form
- [ ] Test opportunity dropdown (optional field)
- [ ] Enter hours (e.g., 2.5)
- [ ] Select date
- [ ] Enter description
- [ ] Click "Log Hours"
- [ ] Verify success message
- [ ] Check hours appear in dashboard with "PENDING" status

### Step 3: Admin Experience Testing

#### Access Admin Panel
- [ ] Sign in with admin account
- [ ] Navigate to /admin/volunteers directly OR
- [ ] Go to /admin and look for volunteers link
- [ ] Verify admin volunteer management page loads

#### View Analytics
- [ ] Check top stats cards display:
  - Total Opportunities
  - Total Sign-ups
  - Total Hours
  - Waiver Eligible Members
- [ ] Click "Analytics" tab
- [ ] Verify overview metrics show
- [ ] Check recent activity (7 days) displays
- [ ] View top opportunities list

#### Create Opportunity
- [ ] Click "Opportunities" tab
- [ ] Click "Create Opportunity" button
- [ ] Fill in form:
  ```
  Title: Test Opportunity
  Category: Community Service
  Description: This is a test volunteer opportunity
  Date/Time: [Select future date]
  Duration: 3
  Max Volunteers: 10
  Location: ISSB Mosque
  Required Skills: (leave blank or add test skills)
  Status: ACTIVE
  ```
- [ ] Click "Create" button
- [ ] Verify success message
- [ ] Check opportunity appears in list
- [ ] Verify members can now see this opportunity in their view

#### Approve Volunteer Hours
- [ ] Click "Pending Approvals" tab
- [ ] Verify pending hours are listed (if any logged)
- [ ] Review a pending hour entry:
  - Member name
  - Hours claimed
  - Date
  - Description
- [ ] Click "Approve" button
- [ ] Verify success message
- [ ] Check entry removed from pending list
- [ ] Switch to member account
- [ ] Verify hours now show "APPROVED" status
- [ ] Check total hours updated

#### Test Waiver Calculation
**Method 1: Manual Testing**
- [ ] As admin, approve hours for a test member
- [ ] Approve multiple entries totaling 30+ hours
- [ ] Switch to member account
- [ ] Check dashboard waiver progress shows "Congratulations!"
- [ ] Verify membership fee waived status

**Method 2: Edge Function Test**
```bash
curl -X POST https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/calculate-volunteer-waiver \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"memberId": "TEST_MEMBER_UUID"}'
```

### Step 4: Capacity Management Testing

#### Test Capacity Limits
- [ ] Create opportunity with capacity of 2
- [ ] Sign up with first member account
- [ ] Verify capacity shows 1/2
- [ ] Sign up with second member account
- [ ] Verify capacity shows 2/2
- [ ] Try to sign up with third member account
- [ ] Verify "Full" message displays
- [ ] Check sign-up button disabled or shows "Full - Waitlist"

#### Test Withdrawal
- [ ] As a signed-up member, find an opportunity
- [ ] Click "Withdraw" button
- [ ] Confirm withdrawal
- [ ] Verify success message
- [ ] Check capacity count decreased
- [ ] Verify opportunity no longer in "My Sign-ups"

### Step 5: Edge Function Testing

#### Test Analytics Function
```bash
curl -X POST https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/volunteer-analytics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```
Expected: JSON response with overview, hours, capacity, topOpportunities, recentActivity

#### Test Capacity Management Function
```bash
# Sign up
curl -X POST https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/manage-opportunity-capacity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "opportunityId": "OPPORTUNITY_UUID",
    "action": "signup",
    "memberId": "MEMBER_UUID"
  }'

# Withdraw
curl -X POST https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/manage-opportunity-capacity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "opportunityId": "OPPORTUNITY_UUID",
    "action": "withdraw",
    "memberId": "MEMBER_UUID"
  }'
```

### Step 6: Integration Testing

#### End-to-End Flow
- [ ] Admin creates opportunity
- [ ] Member signs up for opportunity
- [ ] Member participates and logs hours
- [ ] Admin approves hours
- [ ] Member sees updated total
- [ ] Member reaches 30 hours
- [ ] Waiver automatically applied
- [ ] Member dashboard shows "Congratulations!"

### Step 7: Responsive Design Testing

#### Desktop (1920x1080)
- [ ] All components display properly
- [ ] Navigation bar shows all items
- [ ] Dashboard cards in proper grid
- [ ] Tables have adequate spacing

#### Tablet (768x1024)
- [ ] Navigation adapts to medium screen
- [ ] Cards stack appropriately
- [ ] Forms remain usable
- [ ] Modals center correctly

#### Mobile (375x667)
- [ ] Mobile menu button appears
- [ ] Cards stack vertically
- [ ] Forms are touch-friendly
- [ ] Text remains readable
- [ ] Buttons are large enough

### Step 8: Error Handling Testing

#### Validation
- [ ] Try logging hours without description (should fail)
- [ ] Try logging negative hours (should fail)
- [ ] Try logging future date (should fail)
- [ ] Try signing up twice for same opportunity (should show error)

#### Network Errors
- [ ] Disable network briefly
- [ ] Try to sign up for opportunity
- [ ] Verify error message displays
- [ ] Re-enable network
- [ ] Retry action

### Step 9: Performance Testing

#### Load Times
- [ ] Measure homepage load time
- [ ] Measure volunteer page load time
- [ ] Measure admin page load time
- [ ] Check dashboard data fetching speed

#### Database Queries
- [ ] Create 20+ opportunities
- [ ] Verify browse page still loads quickly
- [ ] Test search/filter performance

### Step 10: Security Testing

#### Access Control
- [ ] Try accessing /admin/volunteers without login (should redirect)
- [ ] Try accessing as regular member (should redirect)
- [ ] Verify only admin/board can access admin panel

#### Data Privacy
- [ ] Verify members can only see their own hours
- [ ] Check members can't approve their own hours
- [ ] Ensure capacity manipulation is prevented

---

## Known Issues & Limitations

### Current Limitations
1. **Opportunity Editing:** Currently requires delete and recreate
2. **Bulk Operations:** No bulk approval yet (approve one at a time)
3. **Email Notifications:** Not implemented (manual communication needed)
4. **Photo Uploads:** Not available yet
5. **Export Features:** No CSV/PDF export yet

### Browser Compatibility
- **Recommended:** Chrome, Firefox, Safari (latest versions)
- **Minimum:** Any modern browser with ES6 support
- **Mobile:** iOS Safari 13+, Chrome Mobile

---

## Troubleshooting

### Problem: Opportunities not loading
**Solution:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies are active
4. Ensure user is authenticated

### Problem: Sign-up button not working
**Solution:**
1. Check if at capacity
2. Verify user is logged in
3. Check for duplicate sign-up
4. Review browser console for errors

### Problem: Hours not appearing after logging
**Solution:**
1. Refresh dashboard view
2. Check "My Volunteer Hours" table
3. Verify submission was successful
4. Check pending approvals (admin)

### Problem: Waiver not applying at 30 hours
**Solution:**
1. Ensure all hours are APPROVED status
2. Check `counts_toward_waiver` flag
3. Manually trigger calculation via edge function
4. Verify profile update in database

---

## Success Criteria

This testing is successful if:
- [x] Members can browse and sign up for opportunities
- [x] Capacity management prevents over-booking
- [x] Members can log hours and view status
- [x] Admins can create opportunities
- [x] Admins can approve hours
- [x] Waiver automatically applies at 30 hours
- [x] Analytics display correctly
- [x] System handles 50+ concurrent users
- [x] Page load times under 3 seconds
- [x] No critical security vulnerabilities

---

## Reporting Issues

If you encounter issues:
1. Note exact steps to reproduce
2. Capture browser console errors
3. Note browser and OS version
4. Include screenshots if applicable
5. Check if issue persists after refresh

---

## Next Steps After Testing

1. **Populate Initial Data:**
   - Create 10-15 real volunteer opportunities
   - Categorize appropriately
   - Set realistic capacities

2. **Train Admin Staff:**
   - Walk through opportunity creation
   - Practice hour approval workflow
   - Review analytics dashboard

3. **Member Communication:**
   - Announce new volunteer portal
   - Provide quick start guide
   - Highlight waiver benefit

4. **Monitor & Iterate:**
   - Track usage metrics
   - Gather member feedback
   - Plan enhancements

---

**Testing Completed By:** ___________________  
**Date:** ___________________  
**Overall Status:** ⬜ Pass ⬜ Pass with Issues ⬜ Fail  
**Notes:**
