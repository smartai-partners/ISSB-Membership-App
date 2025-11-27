# Registration & Login Debug Report
**Date:** 2025-11-27
**Status:** 🔴 CRITICAL ISSUES IDENTIFIED
**Priority:** HIGH

## 📋 Executive Summary

After comprehensive code analysis, I've identified **5 critical issues** preventing users from completing the registration process. This report outlines each issue, its impact, and the recommended fix.

---

## 🔍 Issues Identified

### Issue #1: Supabase Email Confirmation Not Handled
**Severity:** 🔴 CRITICAL
**File:** `/issb-portal/src/contexts/AuthContext.tsx`
**Lines:** 165-231 (signUp function)

**Problem:**
- Supabase Auth by default requires email confirmation before users can login
- The current signup flow doesn't inform users about email confirmation
- Users try to login immediately after signup and fail with "Invalid credentials"
- No email verification status check or user guidance

**Evidence:**
```typescript
// Line 170-173: Auth signup without email confirmation handling
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
});
```

**Impact:**
- Users complete registration form
- Account is created but in "unconfirmed" state
- Login attempts fail with confusing error messages
- Users think registration failed

**Recommended Fix:**
1. Check Supabase Auth settings: disable email confirmation OR
2. Add email verification flow with proper UI messaging
3. Show "Check your email" message after successful signup
4. Prevent login until email is confirmed

---

### Issue #2: Silent Profile Creation Failures
**Severity:** 🔴 CRITICAL
**File:** `/issb-portal/src/contexts/AuthContext.tsx`
**Lines:** 184-199

**Problem:**
- Profile creation happens AFTER auth user is created
- If profile creation fails, user exists in auth but has no profile
- Subsequent logins fail because profile doesn't exist
- Error is logged but not propagated to user

**Evidence:**
```typescript
// Line 184-199: Profile creation can fail silently
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: authData.user.id,
    email,
    ...userData,
    role: 'applicant',
    status: 'pending',
   total_volunteer_hours: 0,
    membership_fee_waived: false,
  });

if (profileError) {
  console.log('[AUTH] Profile creation error:', profileError);
  throw profileError; // User already created in auth!
}
```

**Impact:**
- Orphaned auth users without profiles
- Login succeeds but app crashes due to missing profile data
- Users stuck in limbo state
- Database inconsistency

**Recommended Fix:**
1. Use Supabase database trigger to auto-create profile
2. OR: Create profile first, then link to auth user
3. Implement profile recovery logic for orphaned users
4. Add better error handling and user messaging

---

### Issue #3: Application Record Creation Can Fail
**Severity:** 🟡 MEDIUM
**File:** `/issb-portal/src/contexts/AuthContext.tsx`
**Lines:** 203-223

**Problem:**
- Application record created AFTER profile
- If this fails, user has auth + profile but no application
- Application may be required for membership workflows
- No rollback mechanism for partial failures

**Evidence:**
```typescript
// Line 204-218: Third sequential operation that can fail
const { error: applicationError } = await supabase
  .from('applications')
  .insert({
    user_id: authData.user.id,
    membership_tier: 'standard',
    status: 'pending',
    // ... more fields
  });

if (applicationError) {
  console.log('[AUTH] Application creation error:', applicationError);
  throw applicationError; // User + Profile already exist!
}
```

**Impact:**
- Users can't access membership features
- Admins can't process applications
- Incomplete user onboarding

**Recommended Fix:**
1. Use database transaction or trigger
2. Make application creation optional or async
3. Add application recovery flow
4. Implement proper error recovery

---

### Issue #4: Missing RLS Policies for Self-Registration
**Severity:** 🔴 CRITICAL
**Location:** Supabase Database

**Problem:**
- Row Level Security (RLS) may not allow users to INSERT their own profile
- Standard RLS only allows reading own profile: `auth.uid() = user_id`
- Profile creation during signup requires special INSERT policy
- Missing policy would cause "permission denied" error

**Required RLS Policies:**
```sql
-- Allow users to INSERT their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to INSERT their own application
CREATE POLICY "Users can insert own application"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Impact:**
- Signup fails with "permission denied"
- Users can't self-register
- Only admins can create profiles

**Recommended Fix:**
1. Add INSERT policies to profiles table
2. Add INSERT policies to applications table
3. Verify auth.uid() is available during signup
4. Test with actual user signup

---

### Issue #5: No Email Verification UI/UX
**Severity:** 🟡 MEDIUM
**File:** `/issb-portal/src/pages/SignUpPage.tsx`

**Problem:**
- After signup (line 106), immediately redirects to '/'
- No message about checking email
- No verification code entry page
- No resend verification email option

**Evidence:**
```typescript
// Line 106-107: Direct redirect without email verification flow
if (error) throw error;
navigate('/');
```

**Impact:**
- Users don't know to check email
- No way to resend verification email
- Confusing user experience

**Recommended Fix:**
1. Create EmailVerificationPage component
2. Show "Check your email" message after signup
3. Add resend verification button
4. Prevent auto-redirect until email confirmed

---

## 🔧 Recommended Fixes (Priority Order)

### **Fix #1 - IMMEDIATE: Add RLS Policies** ⭐
Run these SQL statements in Supabase SQL Editor:

```sql
-- Allow users to insert their own profile during signup
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own application
CREATE POLICY IF NOT EXISTS "Users can insert own application"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verify existing SELECT policies
-- Should have: Users can view own profile
```

### **Fix #2 - IMMEDIATE: Check Supabase Email Settings**
1. Go to Supabase Dashboard → Authentication → Settings
2. Check "Enable email confirmations"
3. **If enabled:** Users MUST confirm email before login
4. **Recommended:** DISABLE for now, or implement full email flow

### **Fix #3 - Code Fix: Use Database Trigger for Profile Creation**

Instead of creating profile in application code, use Supabase trigger:

```sql
-- Create function to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, total_volunteer_hours, membership_fee_waived)
  VALUES (
    NEW.id,
    NEW.email,
    'applicant',
    'pending',
    0,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### **Fix #4 - Code Fix: Update SignUp Function**

Modify `/issb-portal/src/contexts/AuthContext.tsx`:

```typescript
async function signUp(email: string, password: string, userData: Partial<Profile> & { volunteer_commitment?: boolean; donation_amount?: number }) {
  try {
    console.log('[AUTH] Starting signUp process...');

    // Sign up user - profile will be auto-created by database trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
        }
      }
    });

    if (authError) {
      console.log('[AUTH] Auth error:', authError);
      throw authError;
    }
    if (!authData.user) throw new Error('User creation failed');

    console.log('[AUTH] User created successfully');

    // Wait a moment for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update profile with additional data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.warn('[AUTH] Profile update warning:', updateError);
      // Don't throw - profile exists from trigger
    }

    // Create application record
    const { error: applicationError } = await supabase
      .from('applications')
      .insert({
        user_id: authData.user.id,
        membership_tier: 'standard',
        status: 'pending',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email,
        phone: userData.phone || '',
        volunteer_commitment: userData.volunteer_commitment || false,
        donation_amount: userData.donation_amount || 0,
        agreed_to_terms: true,
        agreed_to_code_of_conduct: true,
      });

    if (applicationError) {
      console.warn('[AUTH] Application creation warning:', applicationError);
      // Don't throw - user can still login
    }

    console.log('[AUTH] SignUp completed successfully');
    return { requiresEmailVerification: !authData.session };
  } catch (error) {
    console.log('[AUTH] SignUp error:', error);
    return { error: error as Error };
  }
}
```

### **Fix #5 - UX Fix: Add Email Verification Message**

Update `/issb-portal/src/pages/SignUpPage.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  // ... validation checks ...

  setLoading(true);

  try {
    const donationAmount = parseFloat(formData.initial_donation) || 0;

    const result = await signUp(formData.email, formData.password, {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      volunteer_commitment: formData.volunteer_commitment,
      donation_amount: donationAmount,
    });

    if (result.error) throw result.error;

    // Check if email verification is required
    if (result.requiresEmailVerification) {
      // Show verification message instead of redirecting
      setSuccess('Registration successful! Please check your email to verify your account before logging in.');
      // Don't navigate yet
    } else {
      // Auto-login successful
      navigate('/');
    }
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 Testing Checklist

After implementing fixes, test these scenarios:

### Scenario 1: New User Registration
- [ ] Fill out registration form with valid data
- [ ] Submit form
- [ ] Check for success message (not error)
- [ ] Verify email received (if email confirmation enabled)
- [ ] Check Supabase Auth users table - user should exist
- [ ] Check profiles table - profile should exist with correct data
- [ ] Check applications table - application should exist

### Scenario 2: Login After Registration
- [ ] Try to login immediately after registration
- [ ] If email confirmation disabled: should succeed
- [ ] If email confirmation enabled: should show "Please verify email" message
- [ ] After email verification: login should succeed
- [ ] Profile data should load correctly
- [ ] No console errors

### Scenario 3: Error Handling
- [ ] Try registering with existing email - should show friendly error
- [ ] Try weak password - should show validation error
- [ ] Try mismatched passwords - should show error before submission
- [ ] Network error simulation - should show appropriate message

---

## 📊 Root Cause Analysis

**Primary Issue:** Multi-step signup process with no atomic transaction
- Auth user creation
- Profile creation (can fail independently)
- Application creation (can fail independently)

**Secondary Issues:**
- Missing RLS INSERT policies
- No email verification flow
- Poor error handling and user feedback

**Why Users Can't Complete Registration:**
1. Email confirmation enabled but not communicated to users
2. Profile creation fails due to RLS policy restrictions
3. Silent failures in profile/application creation
4. Users try to login before email verification
5. Error messages are technical, not user-friendly

---

## ✅ Action Items

**Immediate (Do First):**
1. [ ] Check and add RLS INSERT policies
2. [ ] Check Supabase email confirmation setting
3. [ ] Implement database trigger for profile creation
4. [ ] Update signUp function error handling

**Short Term (This Week):**
5. [ ] Add email verification UI/UX
6. [ ] Improve error messages
7. [ ] Add user-friendly validation
8. [ ] Test all registration scenarios

**Long Term (Future Enhancement):**
9. [ ] Add profile recovery for orphaned users
10. [ ] Implement proper transaction handling
11. [ ] Add admin tools to fix broken registrations
12. [ ] Add registration analytics

---

## 📝 Notes for Developer

**Current System:**
- Deployed at: https://ngclt8fbwfb0.space.minimax.io
- Database: Supabase (lsyimggqennkyxgajzvn)
- Auth: Supabase Auth with JWT
- Active codebase: `/issb-portal/` (NOT `/apps/web/`)

**Common Errors Users Might See:**
- "Invalid credentials" → Email not verified
- "Permission denied" → Missing RLS INSERT policy
- "User creation failed" → Various profile creation errors
- Silent failure → Profile/application creation errors not shown to user

**Database Tables Involved:**
- `auth.users` - Supabase managed auth users
- `public.profiles` - User profile data
- `public.applications` - Membership applications

---

**Status:** Ready for implementation
**Estimated Fix Time:** 2-4 hours
**Testing Time:** 1-2 hours
**Total:** ~6 hours to full resolution
