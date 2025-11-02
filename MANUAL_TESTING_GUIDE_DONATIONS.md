# Manual Testing Guide - Donation Infrastructure

## Test Environment
**Production URL**: https://35a49r8q3n1o.space.minimax.io
**Stripe Mode**: Live (requires real cards or Stripe test mode setup)
**Test Date**: November 2, 2025

## Edge Function Testing Results

### create-payment-intent Function
**Status**: ✅ PASSED

**Test Details**:
- **URL**: https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/create-payment-intent
- **Test Payload**: 
  ```json
  {
    "amount": 50,
    "currency": "usd",
    "donorEmail": "test@example.com",
    "donorName": "Test Donor",
    "isAnonymous": false,
    "message": "Test donation"
  }
  ```
- **Response**: HTTP 200 OK
  ```json
  {
    "data": {
      "clientSecret": "pi_3SP2mhA18JUWxzG30LZoQmOp_secret_...",
      "paymentIntentId": "pi_3SP2mhA18JUWxzG30LZoQmOp",
      "donationId": "bad5ccba-82c1-48e0-9103-63003703ca16",
      "amount": 50,
      "currency": "usd",
      "status": "pending"
    }
  }
  ```
- **Database Verification**: ✅ Record created successfully
  - Donation ID: bad5ccba-82c1-48e0-9103-63003703ca16
  - Amount: $50.00 USD
  - Status: pending
  - All fields correctly populated

## Frontend Testing Checklist

### Pre-Testing Setup
1. Ensure you have a valid payment method for testing
2. Consider using Stripe test mode (requires updating publishable key in code)
3. Open browser developer console to monitor for errors

### Test Pathways

#### Pathway 1: Basic Donation Flow
**URL**: https://35a49r8q3n1o.space.minimax.io/donate

**Steps**:
1. [ ] Navigate to /donate page
2. [ ] Verify page loads without errors
3. [ ] Verify hero section displays with "Make a Difference" heading
4. [ ] Click "Donate Now" button
5. [ ] Verify donation form modal opens
6. [ ] Verify all form elements are visible:
   - [ ] Currency buttons (USD, EUR, GBP, CAD)
   - [ ] Quick amount buttons ($25, $50, $100, $250, $500, $1000)
   - [ ] Custom amount input
   - [ ] Anonymous checkbox
   - [ ] Email field
   - [ ] Message textarea
   - [ ] Dedication dropdown
   - [ ] Stripe card element (secure iframe)
7. [ ] Select USD currency
8. [ ] Click $100 quick amount button
9. [ ] Verify amount populates in donate button: "Donate $100"
10. [ ] Enter your email address
11. [ ] Enter test card information (see Stripe test cards below)
12. [ ] Click "Donate $100" button
13. [ ] Wait for processing
14. [ ] Verify success modal appears
15. [ ] Verify "Thank you" message displays
16. [ ] Close success modal

**Expected Results**:
- All UI elements render correctly
- Form validation works
- Payment processes without errors
- Success confirmation appears
- Donation recorded in database

#### Pathway 2: Multi-Currency Donation
**Steps**:
1. [ ] Open donation form
2. [ ] Click EUR currency button
3. [ ] Click €50 quick amount
4. [ ] Verify currency symbol changes to €
5. [ ] Verify button shows "Donate €50"
6. [ ] Complete payment with test card
7. [ ] Verify success modal shows EUR currency

**Expected Results**:
- Currency symbols update correctly
- Payment processes in selected currency

#### Pathway 3: Anonymous Donation
**Steps**:
1. [ ] Open donation form
2. [ ] Check "Make this an anonymous donation" checkbox
3. [ ] Verify "Your Name" field disappears
4. [ ] Enter amount and email
5. [ ] Complete payment
6. [ ] Check database: verify `is_anonymous = true`

**Expected Results**:
- Name field hides when anonymous checked
- Donation recorded as anonymous

#### Pathway 4: Dedication Donation
**Steps**:
1. [ ] Open donation form
2. [ ] Select "In honor of someone" from dedication dropdown
3. [ ] Verify "Dedication Name" field appears
4. [ ] Verify "Notify someone?" email field appears
5. [ ] Enter dedication name
6. [ ] Enter notification email (optional)
7. [ ] Complete payment
8. [ ] Check database: verify `donation_metadata` record created

**Expected Results**:
- Additional fields appear based on dedication type
- Metadata record created with dedication information

#### Pathway 5: Form Validation
**Steps**:
1. [ ] Open donation form
2. [ ] Try submitting without amount: verify error appears
3. [ ] Try submitting without email: verify error appears
4. [ ] Try submitting without card details: verify error appears
5. [ ] Try entering invalid email format: verify validation error
6. [ ] Try entering amount less than $1: verify error appears

**Expected Results**:
- All validation rules enforce correctly
- Clear error messages display

#### Pathway 6: Payment Failure Handling
**Steps**:
1. [ ] Open donation form
2. [ ] Enter amount and email
3. [ ] Use declined test card: `4000 0000 0000 0002`
4. [ ] Try to submit payment
5. [ ] Verify error message displays
6. [ ] Verify donation status in database remains 'pending' or changes to 'failed'

**Expected Results**:
- Failed payment shows clear error message
- User can retry with different card
- Database reflects failure

### Stripe Test Cards

**For testing only** (requires Stripe test mode):

**Successful Payment**:
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/26)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

**Payment Declined**:
- Card Number: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**3D Secure Required**:
- Card Number: `4000 0027 6000 3184`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Note**: Live mode requires real card numbers. Use test mode for testing.

### Database Verification Queries

**Check recent donations**:
```sql
SELECT 
  id,
  donor_name,
  donor_email,
  amount,
  currency,
  payment_status,
  is_anonymous,
  created_at
FROM donations
ORDER BY created_at DESC
LIMIT 10;
```

**Check donation with metadata**:
```sql
SELECT 
  d.*,
  dm.dedication_type,
  dm.dedication_name,
  dm.notification_email
FROM donations d
LEFT JOIN donation_metadata dm ON dm.donation_id = d.id
WHERE d.stripe_payment_intent_id = 'YOUR_PAYMENT_INTENT_ID';
```

### Webhook Testing

**Note**: Webhook testing requires actual Stripe events

**Steps**:
1. Make a successful donation
2. Log into Stripe Dashboard: https://dashboard.stripe.com
3. Navigate to Developers > Webhooks
4. Find your endpoint: `https://lsyimggqennkyxgajzvn.supabase.co/functions/v1/stripe-webhook`
5. View recent webhook deliveries
6. Verify `payment_intent.succeeded` event was sent
7. Check response code: should be 200 OK
8. Query database to verify donation status updated to 'completed'

**Expected webhook flow**:
1. Payment completes in Stripe
2. Stripe sends webhook event
3. Edge function receives and validates signature
4. Database updates donation status to 'completed'
5. Webhook responds with 200 OK

## Console Error Monitoring

**Critical checks**:
- [ ] No JavaScript errors in console
- [ ] No network request failures
- [ ] Stripe Elements loads successfully
- [ ] No CORS errors
- [ ] Supabase client initializes

## Browser Compatibility Testing

**Test in these browsers**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome (Android)

## Responsive Design Testing

**Test on these viewport sizes**:
- [ ] Desktop: 1920x1080
- [ ] Laptop: 1366x768
- [ ] Tablet: 768x1024
- [ ] Mobile: 375x667

## Security Verification

**Checks**:
- [ ] Card details entered in Stripe iframe (not directly on page)
- [ ] HTTPS connection enforced
- [ ] No card data visible in network requests
- [ ] No sensitive data logged to console
- [ ] Webhook signature verification enabled

## Performance Testing

**Metrics to check**:
- [ ] Page load time < 3 seconds
- [ ] Form submission response < 5 seconds
- [ ] No visible lag when interacting with UI
- [ ] Stripe Elements load smoothly

## Known Limitations

1. **Email Notifications**: Donation receipts not sent automatically (requires email service integration)
2. **Recurring Donations**: Only one-time donations supported currently
3. **PDF Receipts**: Tax receipts not generated automatically
4. **Admin Dashboard**: No admin interface for donation management yet

## Troubleshooting Guide

### Issue: Payment Intent Creation Fails
**Symptoms**: Error message when clicking donate button
**Checks**:
- Open browser console for error details
- Verify network request to edge function succeeds
- Check Stripe secret key is configured
**Solution**: Contact administrator if Stripe not configured

### Issue: Stripe Elements Not Loading
**Symptoms**: Card input field doesn't appear
**Checks**:
- Check browser console for Stripe.js errors
- Verify publishable key is correct
- Check network connectivity
**Solution**: Refresh page or try different browser

### Issue: Webhook Not Updating Status
**Symptoms**: Donations stay in 'pending' status
**Checks**:
- Log into Stripe Dashboard
- Check webhook endpoint is configured
- View webhook delivery logs
- Check for webhook signature errors
**Solution**: Configure webhook secret in Supabase

### Issue: Database RLS Policy Error
**Symptoms**: "new row violates row-level security policy" error
**Checks**:
- Verify RLS policies allow anonymous inserts
- Check Supabase logs
**Solution**: Update RLS policies to include 'anon' role

## Test Results Summary

### Automated Tests
- [x] Edge Function: create-payment-intent - **PASSED**
- [x] Database: Record creation - **PASSED**
- [x] Database: Data integrity - **PASSED**

### Manual Tests Required
- [ ] Frontend: UI rendering
- [ ] Frontend: Form interactions
- [ ] Frontend: Payment submission
- [ ] Frontend: Success flow
- [ ] Frontend: Error handling
- [ ] Webhook: Event processing
- [ ] Multi-currency: All currencies
- [ ] Anonymous donations
- [ ] Dedication donations
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness

## Next Steps

1. **Complete manual testing** following pathways above
2. **Configure webhook secret** in Stripe Dashboard
3. **Test webhook processing** with real payment
4. **Document any issues** found during testing
5. **Create bug reports** for any failures
6. **Verify fixes** and re-test affected areas

## Contact

For questions or issues during testing:
- **Admin**: yjrchfcr@minimax.com
- **Documentation**: /workspace/PHASE3D1_DONATION_INFRASTRUCTURE_COMPLETE.md

---

**Testing Guide Version**: 1.0
**Last Updated**: November 2, 2025
