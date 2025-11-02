# Phase 3E.1 Membership Foundation - Manual Testing Guide

## Deployment Information
**Production URL**: https://3yfw1fsoobj2.space.minimax.io
**Deployment Date**: 2025-11-03
**Status**: Ready for testing

## Overview
Complete membership management system with Stripe subscription integration has been deployed. Manual testing required as browser automation is unavailable.

## Backend Infrastructure Deployed

### Database Tables Created:
1. **plans** - Stripe subscription plan definitions
2. **subscriptions** - User subscription records
3. **subscription_members** - Family member management
4. **subscription_history** - Subscription change tracking
5. **payment_methods** - Stored payment information

### Edge Functions Deployed:
1. **create-subscription** - Stripe checkout for paid tiers (Individual, Family)
2. **create-student-subscription** - Free student tier enrollment
3. **get-subscription-status** - Fetch user subscription details
4. **manage-subscription** - Cancel or change subscription tier
5. **manage-family-members** - Add/remove family members (Family tier)
6. **get-membership-analytics** - Admin analytics dashboard
7. **stripe-webhook** - Webhook handler for Stripe events

## Testing Pathways

### Pathway 1: Membership Plans Page
**URL**: https://3yfw1fsoobj2.space.minimax.io/membership

**Steps**:
1. Navigate to the website
2. Click "Membership" in the navigation menu
3. Verify three membership tiers are displayed:
   - Student ($0/month - Free)
   - Individual ($50/month)
   - Family ($150/month)
4. Check tier features are listed correctly
5. Verify buttons for each tier are present and styled

**Expected Result**: Clean, professional layout with all three tiers clearly displayed

---

### Pathway 2: Student Tier Enrollment (Free)
**Prerequisites**: User account (can create via Sign Up)

**Steps**:
1. If not logged in, create account or login
2. Navigate to /membership
3. Click "Select Student" button
4. Should immediately activate student tier
5. Verify redirect to /membership/dashboard?success=true
6. Check dashboard shows:
   - Current subscription: Student
   - Status: Active
   - Monthly Price: $0/month
   - Membership benefits list

**Expected Result**: Instant activation of free student tier without payment

---

### Pathway 3: Individual Tier Subscription
**Prerequisites**: User account

**Steps**:
1. Login to the portal
2. Navigate to /membership
3. Click "Select Individual Membership" button
4. Should redirect to Stripe checkout page
5. **On Stripe Checkout**:
   - Verify product: "Individual Membership - $50.00/month"
   - Use Stripe test card: 4242 4242 4242 4242
   - Expiry: any future date
   - CVC: any 3 digits
   - Complete payment
6. After successful payment, should redirect back
7. Navigate to /membership/dashboard
8. Verify subscription shows:
   - Tier: Individual
   - Status: Active
   - Price: $50/month

**Expected Result**: Successful Stripe checkout and active subscription

---

### Pathway 4: Family Tier Subscription
**Prerequisites**: User account

**Steps**:
1. Login to the portal
2. Navigate to /membership
3. Click "Select Family Membership" button
4. Complete Stripe checkout ($150/month)
5. After payment, go to /membership/dashboard
6. Verify:
   - Tier: Family
   - Status: Active
   - Price: $150/month
   - "Family Members" section visible
   - Shows "0 / 6" family members

**Expected Result**: Active family subscription with family management section

---

### Pathway 5: Family Member Management
**Prerequisites**: Active Family tier subscription

**Steps**:
1. From membership dashboard with family tier
2. Click "Add Member" button in Family Members section
3. Fill out form:
   - First Name: John
   - Last Name: Doe
   - Relationship: Spouse
   - Email: john.doe@example.com (optional)
   - Phone: 555-1234 (optional)
   - Date of Birth: 1980-01-01 (optional)
4. Click "Add Member"
5. Verify family member appears in list
6. Test removing member:
   - Click trash icon next to member
   - Confirm deletion
   - Verify member removed from list

**Test Limit**:
- Try adding 6 family members
- Verify "Add Member" button becomes disabled at limit
- Verify error message if attempting to add 7th member

**Expected Result**: Successfully manage up to 6 family members

---

### Pathway 6: Subscription Tier Changes
**Prerequisites**: Active Individual or Family subscription

**Test Upgrade (Individual → Family)**:
1. Have active Individual subscription
2. Go to /membership/dashboard
3. Click "Upgrade to Family ($150/month)"
4. Confirm upgrade
5. Verify:
   - Tier changed to Family
   - Prorated charge applied
   - Family Members section now visible
   - History shows tier change

**Test Downgrade (Family → Individual)**:
1. Have active Family subscription (with 0 family members added)
2. Go to /membership/dashboard
3. Click "Downgrade to Individual ($50/month)"
4. Confirm downgrade
5. Verify:
   - Tier changed to Individual
   - Credit applied for proration
   - Family Members section hidden
   - History shows tier change

**Expected Result**: Smooth tier transitions with proper Stripe proration

---

### Pathway 7: Subscription Cancellation
**Prerequisites**: Active paid subscription

**Steps**:
1. Go to /membership/dashboard
2. Click "Cancel Subscription"
3. Confirm cancellation
4. Verify message: "Subscription will be cancelled at the end of the billing period"
5. Check subscription still shows as active
6. Verify cancellation recorded in history

**Note**: Subscription remains active until end of billing period

**Expected Result**: Cancellation scheduled for period end

---

### Pathway 8: Admin Membership Analytics
**Prerequisites**: Admin account (use create-admin edge function if needed)

**Steps**:
1. Login as admin user
2. Navigate to /admin/membership-analytics
3. Verify analytics dashboard displays:
   - **Total Members** (count of active subscriptions)
   - **Monthly Revenue** (MRR calculation)
   - **Annual Revenue** (MRR × 12)
   - **Family Members** (total additional members)
4. Check tier breakdown:
   - Student count and revenue ($0)
   - Individual count and revenue (count × $50)
   - Family count and revenue (count × $150)
5. Verify "Recent Activity" section shows:
   - Subscription creations
   - Tier changes
   - Cancellations
6. Check revenue projections section

**Expected Result**: Comprehensive analytics dashboard with accurate calculations

---

### Pathway 9: Navigation & Access Control
**Steps**:
1. **Public Access**:
   - Verify /membership is accessible without login
   - Can view all tier options
   - Clicking tier selection prompts login if not authenticated

2. **Authenticated Member Access**:
   - /membership/dashboard requires authentication
   - Redirects to login if not logged in
   - After login, shows appropriate dashboard

3. **Admin Access**:
   - /admin/membership-analytics requires admin role
   - Non-admin users redirected away
   - Admin users see full analytics

4. **Existing Subscription Redirect**:
   - User with active subscription visits /membership
   - Should auto-redirect to /membership/dashboard
   - Prevents duplicate subscriptions

**Expected Result**: Proper authentication and authorization throughout

---

## Edge Cases to Test

### 1. Duplicate Subscription Prevention
- Try to create second subscription while having active one
- Should show error or redirect to dashboard

### 2. Family Member Limit
- Try adding 7th family member to family subscription
- Should show error: "Maximum family member limit (6) reached"

### 3. Student to Paid Tier Upgrade
- Have active Student tier
- Attempt to upgrade to Individual or Family
- Should work via /membership page tier selection

### 4. Stripe Webhook Verification
- After successful payment in Stripe
- Verify database updated correctly
- Check subscription status is "active"

### 5. Payment Failure Handling
- Use Stripe test card that fails: 4000 0000 0000 0002
- Verify appropriate error message
- Subscription not created in database

---

## Testing Checklist

- [ ] All membership tiers display correctly
- [ ] Student tier enrollment works (free)
- [ ] Individual tier Stripe checkout works
- [ ] Family tier Stripe checkout works
- [ ] Family member add/remove works
- [ ] 6-member limit enforced
- [ ] Tier upgrades work with proration
- [ ] Tier downgrades work with proration
- [ ] Subscription cancellation works
- [ ] Admin analytics accessible (admin only)
- [ ] Analytics calculations accurate
- [ ] Navigation links work
- [ ] Access control enforced
- [ ] Duplicate subscription prevented
- [ ] Mobile responsive design
- [ ] All buttons and forms functional

---

## Stripe Test Cards

**Successful Payment**:
- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits

**Failed Payment**:
- Card: 4000 0000 0000 0002
- Expiry: Any future date
- CVC: Any 3 digits

**Requires 3D Secure**:
- Card: 4000 0025 0000 3155
- Expiry: Any future date
- CVC: Any 3 digits

---

## Known Limitations

1. **Student tier** is handled separately (no Stripe checkout)
2. **Stripe webhook** requires successful payment to update subscription status
3. **Cancellation** takes effect at end of billing period (standard Stripe behavior)
4. **Family members** are managed via subscription, not separate user accounts

---

## Support Information

**Edge Function URLs** (if testing directly):
- Subscription Status: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/get-subscription-status`
- Create Subscription: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-subscription`
- Manage Subscription: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/manage-subscription`
- Family Members: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/manage-family-members`
- Admin Analytics: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/get-membership-analytics`

**Supabase Dashboard**: Access database directly to verify data

---

## Reporting Issues

When reporting bugs, please include:
1. Pathway being tested
2. Step number where issue occurred
3. Expected behavior
4. Actual behavior
5. Browser console errors (if any)
6. Screenshots (if applicable)

---

## Success Criteria

All pathways tested successfully means:
- ✅ All three membership tiers functional
- ✅ Stripe integration working for paid tiers
- ✅ Student tier enrollment working
- ✅ Family member management functional
- ✅ Subscription management (upgrade/downgrade/cancel) working
- ✅ Admin analytics displaying correctly
- ✅ Access control enforced properly
- ✅ No console errors
- ✅ Responsive design working
- ✅ All edge cases handled gracefully

**Ready for production use when all success criteria met.**
