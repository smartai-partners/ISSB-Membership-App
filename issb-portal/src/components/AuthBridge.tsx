/**
 * Auth Bridge Component
 * Syncs AuthContext state with Redux store
 * Enables gradual migration from Context API to Redux
 */

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppDispatch } from '../hooks/redux';
import { setSession, signOut as reduxSignOut } from '../store/slices/authSlice';
import { supabase } from '../lib/supabase';

export function AuthBridge() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Sync initial session to Redux
    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && user) {
        dispatch(setSession({ session, user: session.user }));
      } else {
        dispatch(reduxSignOut());
      }
    };

    syncSession();

    // Listen for auth changes and sync to Redux
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          dispatch(setSession({ session, user: session.user }));
        } else {
          dispatch(reduxSignOut());
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, dispatch]);

  return null; // This is a logic-only component
}
