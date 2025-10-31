/**
 * Auth Slice - Session Management
 * Manages user authentication state using Redux Toolkit
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<{ session: Session | null; user: User | null }>) => {
      state.session = action.payload.session;
      state.user = action.payload.user;
      state.loading = false;
      state.initialized = true;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    signOut: (state) => {
      state.session = null;
      state.user = null;
      state.loading = false;
      state.initialized = true;
    },
    clearAuth: () => initialState,
  },
});

export const { setSession, setLoading, signOut, clearAuth } = authSlice.actions;
export default authSlice.reducer;
