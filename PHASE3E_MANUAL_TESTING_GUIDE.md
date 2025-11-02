# Phase 3E.2 & 3E.3 - Manual Testing Guide
## Single-Tier Membership with Volunteer Hours Alternative

**Deployed URL**: https://zeepjpxlqkif.space.minimax.io

---

## Testing Overview
This guide provides comprehensive testing instructions for the new single-tier membership system with dual payment options (payment and volunteer hours).

---

## Test Pathway 1: Payment Path

### Step 1: View Membership Plans
1. Navigate to: https://zeepjpxlqkif.space.minimax.io/membership
2. **Expected**: Single membership card displays
   - Title: "Individual Annual Membership"
   - Price: "$360/year"
   - Two action buttons:
     - "Pay $360 Now" (blue button)
     - "Volunteer 30 Hours" (outlined button)
   - Feature list and FAQ section visible

### Step 2: Initiate Payment
1. Click "Pay $360 Now" button
2. **Expected**: If not logged in, redirect to login/signup page
3. After login, click "Pay $360 Now" again
4. **Expected**: Redirect to Stripe Checkout page
   - Amount displayed: $360.00
   - Billing cycle: Annual
   - Plan: Individual Annual Membership

### Step 3: Complete Payment (Test Mode)
1. Use Stripe test card: `4242 4242 4242 4242`
2. Expiry: Any future date (e.g., 12/25)
3. CVC: Any 3 digits (e.g., 123)
4. **Expected**: Successful payment, redirect to dashboard with success message

### Step 4: Verify Payment-Activated Membership
1. Navigate to: https://zeepjpxlqkif.space.minimax.io/dashboard
2. **Expected**:
   - Membership Status card shows:
     - Activation Method: "Payment ($360)"
     - Status: "Active"
     - Member Since: Current month/year
   - Message displayed: "Active Paid Membership" with thank you note
   - NO volunteer hours tracking section (hidden for paid members)

---

## Test Pathway 2: Volunteer Path

### Step 1: Create New Account
1. Logout from current account (if any)
2. Sign up with new email
3. Navigate to: https://zeepjpxlqkif.space.minimax.io/membership

### Step 2: Choose Volunteer Option
1. Click "Volunteer 30 Hours" button
2. **Expected**: Confirmation or commitment message displayed
3. Redirect to dashboard

### Step 3: Verify Volunteer Dashboard
1. Navigate to: https://zeepjpxlqkif.space.minimax.io/dashboard
2. **Expected**:
   - Membership Status shows "Not Activated" or "Pending Volunteer Hours"
   - Volunteer Hours Progress section visible:
     - Progress bar: 0/30 hours (0%)
     - Approved Hours: 0
     - Pending Review: 0
     - Hours Needed: 30

### Step 4: Log Volunteer Hours
1. Scroll to "Log Volunteer Hours" form
2. Fill in:
   - Number of Hours: 5
   - Date Completed: Select today's date
   - Activity Description: "Community event setup and coordination"
3. Click "Submit Volunteer Hours"
4. **Expected**: 
   - Success message: "Volunteer hours logged successfully! Awaiting admin approval."
   - Form clears

### Step 5: View Volunteer Hours History
1. Scroll to "Volunteer Hours History" table
2. **Expected**:
   - Table displays logged hours:
     - Date: Today's date
     - Hours: 5 hrs
     - Description: Your entered description
     - Status: "Pending" (amber badge with clock icon)

### Step 6: Log Additional Hours
1. Submit 3 more volunteer hour entries (varying hours: 3, 7, 4)
2. **Expected**:
   - All entries appear in history table
   - All show "Pending" status
   - Progress bar still at 0% (no approved hours yet)
   - "Pending Review" counter shows total pending hours

---

## Test Pathway 3: Admin Volunteer Hours Approval

### Step 1: Access Admin Panel
1. Login as admin user
2. Navigate to: https://zeepjpxlqkif.space.minimax.io/admin/volunteer-hours
3. **Expected**: Admin Volunteer Hours Management page loads

### Step 2: View Pending Approvals
1. Check "Pending Approvals" section
2. **Expected**:
   - All pending volunteer hour entries from test user visible
   - Each entry shows:
     - User name/email
     - Date submitted
     - Hours
     - Activity description
     - Approve/Reject buttons

### Step 3: Approve Hours
1. For the first entry (5 hours):
   - Add admin notes (optional): "Great work on event setup!"
   - Click "Approve" button
2. **Expected**:
   - Entry moves to "Recent Approvals" section
   - Disappears from "Pending Approvals"
   - Success message displayed

### Step 4: Approve More Hours
1. Approve additional entries to reach 30+ total hours
2. **Expected**: 
   - Approval counter updates
   - When total approved hours >= 30, automatic membership activation should occur

### Step 5: Reject an Entry
1. For one entry:
   - Add admin notes: "Please provide more detail about the activity"
   - Click "Reject" button
2. **Expected**:
   - Entry disappears from pending
   - Shows in recent activity as rejected

---

## Test Pathway 4: Member View After Approval

### Step 1: Return to Member Dashboard
1. Logout from admin account
2. Login as the test volunteer user
3. Navigate to: https://zeepjpxlqkif.space.minimax.io/dashboard

### Step 2: Verify Progress Updates
1. Check "Volunteer Hours Progress" section
2. **Expected**:
   - Progress bar updated (e.g., 15/30 hours if 15 approved)
   - "Approved Hours" shows correct count
   - "Pending Review" shows remaining pending count
   - "Hours Needed" calculates correctly (30 - approved)

### Step 3: Verify Hours History
1. Scroll to "Volunteer Hours History" table
2. **Expected**:
   - Approved entries show green "Approved" badge with checkmark
   - Pending entries show amber "Pending" badge
   - Rejected entry shows red "Rejected" badge with admin notes displayed

### Step 4: Test Membership Activation
1. After admin approves 30+ total hours, refresh dashboard
2. **Expected**:
   - Progress bar shows 100%
   - "Goal Reached" message displays with green background
   - Membership Status card updates:
     - Activation Method: "Volunteer Hours (30 hrs)"
     - Status: "Active"
   - Success message: "Congratulations! Your membership has been activated!"

---

## Test Pathway 5: Responsive Design

### Desktop View (1920x1080)
1. Test all pages at full desktop resolution
2. **Expected**: 
   - Multi-column layouts display properly
   - All content readable and properly spaced
   - No horizontal scrolling

### Tablet View (768x1024)
1. Resize browser or use device emulator
2. **Expected**:
   - Layouts adjust to single or 2-column
   - Navigation collapses to mobile menu
   - Forms remain usable

### Mobile View (375x667)
1. Test on mobile viewport
2. **Expected**:
   - All content stacks vertically
   - Touch targets adequate size (44x44px minimum)
   - Forms easy to fill on mobile
   - Tables scroll horizontally if needed

---

## Test Pathway 6: Navigation & Routing

1. Test all navigation links from homepage
2. Click "Membership" in nav → Expected: /membership page
3. Click "Dashboard" in nav → Expected: /dashboard page (if logged in)
4. Click admin menu items → Expected: Admin pages load correctly
5. Test browser back/forward buttons → Expected: Proper navigation

---

## Edge Cases to Test

### 1. Duplicate Hour Submission
- Submit same hours twice in short succession
- **Expected**: Both submissions accepted (admin can reject duplicates)

### 2. Invalid Form Data
- Try submitting volunteer hours form with:
  - Negative hours
  - Future date
  - Empty description
- **Expected**: Validation errors prevent submission

### 3. Unauthorized Access
- Logout, try to access /dashboard directly
- **Expected**: Redirect to login page

### 4. Admin Authorization
- Login as regular user, try to access /admin/volunteer-hours
- **Expected**: Forbidden error or redirect

---

## Success Criteria

✅ **Payment Path**:
- Stripe checkout loads correctly
- Payment processes successfully
- Membership activates immediately
- Dashboard shows payment activation method

✅ **Volunteer Path**:
- Hours can be logged successfully
- Progress tracking displays correctly
- History table shows all submissions
- Status badges accurate (pending/approved/rejected)

✅ **Admin Workflow**:
- Pending hours visible to admin
- Approval/rejection works correctly
- Admin notes display to users
- Automatic membership activation at 30 hours

✅ **Responsive Design**:
- All layouts work on desktop, tablet, mobile
- No layout breaks or overlapping content

✅ **Data Persistence**:
- All data saves correctly
- Page refreshes maintain state
- Logout/login preserves data

---

## Bug Reporting Template

If issues found, document using this format:

**Bug #**: [number]
**Pathway**: [e.g., Volunteer Path - Step 3]
**Severity**: [Critical/High/Medium/Low]
**Description**: [What happened]
**Expected**: [What should happen]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Screenshot**: [If applicable]

---

## Testing Timeline

**Estimated Time**: 45-60 minutes for complete testing

- Payment Path: 10 minutes
- Volunteer Path: 15 minutes
- Admin Workflow: 10 minutes
- Member View Verification: 10 minutes
- Responsive Design: 10 minutes
- Edge Cases: 5 minutes

---

## Support

If technical issues arise during testing:
1. Check browser console for errors (F12 → Console tab)
2. Verify you're using latest browser version
3. Try clearing cache and cookies
4. Test in incognito/private mode

**Testing Date**: _____________
**Tester**: _____________
**Overall Result**: ✅ Pass / ❌ Fail
**Notes**: _____________
