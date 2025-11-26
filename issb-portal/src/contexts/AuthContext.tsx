import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string, userData: Partial<Profile> & { volunteer_commitment?: boolean; donation_amount?: number }) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load user on mount
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(currentUser);
          
          if (currentUser) {
            await loadProfile(currentUser.id);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          const newUser = session?.user || null;
          setUser(newUser);
          if (newUser && !profileLoading) {
            // Only load profile if not already loading
            loadProfile(newUser.id).catch(err => {
              console.error('[AUTH] Profile loading error in listener:', err);
            });
          } else if (!newUser) {
            setProfile(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [profileLoading]);

  async function loadProfile(userId: string) {
    // Prevent concurrent profile loading
    if (profileLoading) {
      console.log('[AUTH] Profile loading already in progress, skipping');
      return;
    }

    try {
      setProfileLoading(true);
      console.log('[AUTH] Loading profile for user:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timeout')), 10000);
      });

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      console.log('[AUTH] Profile query result:', { data: !!data, error: !!error });

      if (error) throw error;
      setProfile(data);
      console.log('[AUTH] Profile set successfully:', data?.email);
    } catch (error) {
      console.error('[AUTH] Error loading profile:', error);
      // Don't throw - set a basic profile to prevent auth issues
      if (error instanceof Error && error.message === 'Profile loading timeout') {
        console.log('[AUTH] Profile loading timed out, using basic profile');
        setProfile({
          id: userId,
          email: user?.email || '',
          first_name: 'User',
          last_name: '',
          role: 'member',
          status: 'active',
          membership_tier: 'standard',
          total_volunteer_hours: 0,
          membership_fee_waived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Profile);
      }
    } finally {
      setProfileLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      console.log('[AUTH] Starting signIn process...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[AUTH] Supabase response received');

      if (error) {
        console.log('[AUTH] Login error:', error);
        throw error;
      }
      
      if (!data.user) {
        console.log('[AUTH] No user in response');
        throw new Error('No user returned from login');
      }

      console.log('[AUTH] Login successful, user ID:', data.user.id);
      
      // Set user immediately
      setUser(data.user);
      
      // Load profile - don't await to prevent hanging, but use the guarded function
      loadProfile(data.user.id).catch(err => {
        console.error('[AUTH] Profile loading error:', err);
      });
      
      console.log('[AUTH] signIn process completed');
      return {};
    } catch (error) {
      console.log('[AUTH] signIn error:', error);
      return { error: error as Error };
    }
  }

  async function signUp(email: string, password: string, userData: Partial<Profile> & { volunteer_commitment?: boolean; donation_amount?: number }) {
    try {
      console.log('[AUTH] Starting signUp process...');
      
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.log('[AUTH] Auth error:', authError);
        throw authError;
      }
      if (!authData.user) throw new Error('User creation failed');

      console.log('[AUTH] User created, creating profile...');

      // Create profile
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
        })
        .select()
        .single();

      // PGRST204 means insert succeeded but RLS prevented reading back the row
      // This is OK since we don't need the returned data
      if (profileError && profileError.code !== 'PGRST204') {
        console.log('[AUTH] Profile creation error:', profileError);
        throw profileError;
      }

      console.log('[AUTH] Profile created, creating application...');

      // Create application record for membership tracking
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
        })
        .select()
        .single();

      // PGRST204 means insert succeeded but RLS prevented reading back the row
      if (applicationError && applicationError.code !== 'PGRST204') {
        console.log('[AUTH] Application creation error:', applicationError);
        throw applicationError;
      }

      console.log('[AUTH] SignUp completed successfully');
      return {};
    } catch (error) {
      console.log('[AUTH] SignUp error:', error);
      return { error: error as Error };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (user && !profileLoading) {
      await loadProfile(user.id);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
