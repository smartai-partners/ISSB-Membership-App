-- ===========================================================================
-- ISSB MEMBERSHIP APP - DATABASE FIXES AND RLS POLICIES
-- ===========================================================================
-- Purpose: Fix registration issues by adding proper RLS policies and triggers
-- Date: 2025-11-27
-- Priority: CRITICAL
--
-- INSTRUCTIONS:
-- 1. Login to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Run this entire file as a single query
-- 4. Verify "Success" message
-- ===========================================================================

-- ===========================================================================
-- FIX #1: ADD RLS INSERT POLICIES FOR USER SELF-REGISTRATION
-- ===========================================================================

-- Allow authenticated users to INSERT their own profile during signup
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to INSERT their own application
CREATE POLICY IF NOT EXISTS "Users can insert own application"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- FIX #2: CREATE AUTO-PROFILE TRIGGER (RECOMMENDED)
-- ===========================================================================
-- This trigger automatically creates a profile when a new auth user is created
-- This prevents the race condition in the application code

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with data from auth.users and user metadata
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    status,
    total_volunteer_hours,
    membership_fee_waived,
    membership_tier,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'applicant',  -- Default role for new users
    'pending',    -- Default status - pending approval
    0,            -- Start with 0 volunteer hours
    false,        -- Fee not waived by default
    'standard',   -- Default membership tier
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate inserts

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===========================================================================
-- FIX #3: VERIFY EXISTING RLS POLICIES
-- ===========================================================================
-- Check if basic SELECT policies exist for profiles and applications

-- Users can view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can UPDATE their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users can view their own applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'applications'
    AND policyname = 'Users can view own applications'
  ) THEN
    CREATE POLICY "Users can view own applications"
      ON public.applications
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ===========================================================================
-- FIX #4: ADMIN POLICIES FOR PROFILES AND APPLICATIONS
-- ===========================================================================

-- Admins can view all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'board')
        )
      );
  END IF;
END $$;

-- Admins can update all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'board')
        )
      );
  END IF;
END $$;

-- Admins can view all applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'applications'
    AND policyname = 'Admins can view all applications'
  ) THEN
    CREATE POLICY "Admins can view all applications"
      ON public.applications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'board')
        )
      );
  END IF;
END $$;

-- Admins can update all applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'applications'
    AND policyname = 'Admins can update all applications'
  ) THEN
    CREATE POLICY "Admins can update all applications"
      ON public.applications
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'board')
        )
      );
  END IF;
END $$;

-- ===========================================================================
-- FIX #5: DATA RECOVERY - FIX ORPHANED AUTH USERS
-- ===========================================================================
-- This finds auth users who don't have a profile and creates one for them

DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- Count orphaned users
  SELECT COUNT(*)
  INTO orphan_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;

  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % orphaned auth users. Creating profiles...', orphan_count;

    -- Create profiles for orphaned users
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      role,
      status,
      total_volunteer_hours,
      membership_fee_waived,
      membership_tier,
      created_at,
      updated_at
    )
    SELECT
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
      COALESCE(au.raw_user_meta_data->>'last_name', ''),
      'applicant',
      'pending',
      0,
      false,
      'standard',
      au.created_at,
      NOW()
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL;

    RAISE NOTICE 'Created % profiles for orphaned users', orphan_count;
  ELSE
    RAISE NOTICE 'No orphaned auth users found. Database is clean.';
  END IF;
END $$;

-- ===========================================================================
-- VERIFICATION QUERIES
-- ===========================================================================

-- Verify RLS is enabled on both tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on profiles table!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'applications'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on applications table!';
  END IF;

  RAISE NOTICE 'RLS verification passed!';
END $$;

-- Show all policies for profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'applications')
ORDER BY tablename, policyname;

-- ===========================================================================
-- SUCCESS MESSAGE
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '1. ✅ Added RLS INSERT policies for profiles and applications';
  RAISE NOTICE '2. ✅ Created auto-profile trigger for new auth users';
  RAISE NOTICE '3. ✅ Verified/created SELECT and UPDATE policies';
  RAISE NOTICE '4. ✅ Added admin access policies';
  RAISE NOTICE '5. ✅ Fixed orphaned auth users (if any)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '- Deploy updated frontend code';
  RAISE NOTICE '- Test user registration flow';
  RAISE NOTICE '- Monitor for any errors';
  RAISE NOTICE '';
  RAISE NOTICE 'For issues, check the REGISTRATION_LOGIN_DEBUG_REPORT.md';
  RAISE NOTICE '========================================';
END $$;
