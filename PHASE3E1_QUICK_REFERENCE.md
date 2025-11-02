# Phase 3E.1 - Quick Reference Guide

## Deployment Information
**Production URL**: https://3yfw1fsoobj2.space.minimax.io
**Deployment Date**: 2025-11-03
**Status**: Deployed and Ready for Testing

---

## Membership Tiers

| Tier | Price | Features | Implementation |
|------|-------|----------|----------------|
| Student | $0/month | Basic portal access, newsletter, basic events | Free tier, instant activation |
| Individual | $50/month | Full access, priority registration, volunteer alerts, analytics | Stripe subscription |
| Family | $150/month | Everything in Individual + 6 family members, family events, premium support | Stripe subscription |

---

## Key URLs

### User-Facing Pages
- Membership Plans: `/membership`
- Member Dashboard: `/membership/dashboard`
- Admin Analytics: `/admin/membership-analytics`

### Edge Functions (Supabase)
Base: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/`

- `create-subscription` - Stripe checkout for paid tiers
- `create-student-subscription` - Free student tier activation
- `get-subscription-status` - Get user subscription details
- `manage-subscription` - Cancel or change tier
- `manage-family-members` - Add/remove family members
- `get-membership-analytics` - Admin analytics
- `stripe-webhook` - Webhook event handler

---

## Quick Testing Commands

### Test Student Tier Enrollment
1. Login to portal
2. Go to `/membership`
3. Click "Select Student"
4. Verify redirect to dashboard with active student tier

### Test Individual Tier (Stripe)
1. Login to portal
2. Go to `/membership`
3. Click "Select Individual Membership"
4. Use test card: `4242 4242 4242 4242`
5. Complete Stripe checkout
6. Verify active subscription in dashboard

### Test Family Tier + Members
1. Subscribe to Family tier
2. Go to dashboard
3. Click "Add Member"
4. Add family member details
5. Verify member appears in list
6. Test remove functionality

---

## Stripe Test Cards

**Success**: 4242 4242 4242 4242
**Failure**: 4000 0000 0000 0002
**3D Secure**: 4000 0025 0000 3155

Expiry: Any future date
CVC: Any 3 digits

---

## Database Schema Quick Reference

### subscriptions
- `id` - Primary key
- `user_id` - References auth.users
- `stripe_subscription_id` - Stripe subscription ID
- `stripe_customer_id` - Stripe customer ID
- `price_id` - References plans.price_id
- `status` - active, cancelled, etc.

### plans
- `id` - Primary key
- `price_id` - Stripe price ID
- `plan_type` - individual, family
- `price` - Amount in cents
- `monthly_limit` - Member limit (1 or 6)

### subscription_members
- `id` - Primary key
- `subscription_id` - Stripe subscription ID
- `user_id` - Subscription owner
- `first_name`, `last_name` - Member name
- `relationship` - Relationship to owner
- `email`, `phone` - Contact info (optional)

---

## Admin Access

### Create Admin Account
Use existing `create-admin` edge function:
```bash
curl -X POST https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-admin \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "secure_password", "verificationCode": "ISSB_ADMIN_2024"}'
```

### Access Analytics
1. Login as admin
2. Navigate to `/admin/membership-analytics`
3. View membership statistics and revenue

---

## Common Issues and Solutions

### Issue: Subscription not showing after payment
**Solution**: Wait a few seconds for webhook to process, then refresh page

### Issue: Cannot add 7th family member
**Expected**: Maximum limit is 6 members per family subscription

### Issue: Tier change not immediate
**Expected**: Stripe processes proration, may take a few seconds

### Issue: Student tier not creating subscription
**Check**: Verify user is logged in and doesn't have existing subscription

---

## Monitoring Checklist

After testing, verify:
- [ ] All three tiers functional
- [ ] Stripe checkout working
- [ ] Student tier instant activation
- [ ] Family member add/remove working
- [ ] Tier upgrades/downgrades working
- [ ] Cancellation working
- [ ] Admin analytics accessible
- [ ] No console errors
- [ ] Responsive design working
- [ ] Access control enforced

---

## Revenue Tracking

### Manual Calculation
- Student tier: $0 × count = $0
- Individual tier: $50 × count = MRR
- Family tier: $150 × count = MRR
- **Total MRR** = Individual MRR + Family MRR
- **ARR** = MRR × 12

### Automated (Admin Analytics)
- Visit `/admin/membership-analytics`
- View calculated MRR and ARR
- Check tier distribution
- Review recent activity

---

## Webhook Events

Stripe sends these events to webhook endpoint:
- `customer.subscription.updated` - Subscription status changes
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment (future enhancement)

**Webhook URL**: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/stripe-webhook`

---

## Next Steps After Testing

1. **Switch to Live Mode** (when ready for production)
   - Update Stripe keys to live mode
   - Reconfigure webhook with live endpoint
   - Update plans table with live price IDs

2. **Add Email Notifications**
   - Welcome emails for new subscribers
   - Payment receipt emails
   - Cancellation confirmations

3. **Marketing**
   - Promote membership on homepage
   - Email existing users
   - Social media announcements

4. **Analytics Enhancement**
   - Track conversion rates
   - Monitor churn
   - Analyze revenue trends

---

## Support Resources

**Testing Guide**: `/workspace/PHASE3E1_MANUAL_TESTING_GUIDE.md`
**Delivery Summary**: `/workspace/PHASE3E1_DELIVERY_SUMMARY.md`
**Memory**: `/memories/phase3e1_membership_foundation.md`

**Stripe Dashboard**: https://dashboard.stripe.com/test/subscriptions
**Supabase Dashboard**: https://supabase.com/dashboard/project/lsyimggqennkyxgajzvn

---

## Success Metrics

**Technical Success**:
- Zero console errors
- All pathways pass testing
- Webhook processing < 5 seconds
- Page load times < 3 seconds

**Business Success**:
- Year 1: 500 members ($37.5K annual)
- Year 2: 2,000 members ($150K annual)
- Year 3: 5,000 members ($375K annual)
- ROI: 400%+ on $180K investment

---

**System is ready for manual testing. Follow the testing guide to verify all features.**
