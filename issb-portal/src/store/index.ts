/**
 * Redux Store Configuration
 * Centralized state management with Redux Toolkit and RTK Query
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { memberApi } from './api/memberApi';
import authReducer from './slices/authSlice';

/**
 * Configure Redux store with:
 * - Auth slice for session management
 * - Member API slice for data fetching and caching
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [memberApi.reducerPath]: memberApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from serializability checks
        ignoredActions: [
          'auth/setSession',
          'memberApi/executeQuery/fulfilled',
          'memberApi/executeMutation/fulfilled',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.session',
          'payload.user',
          'meta.baseQueryMeta',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.session',
          'auth.user',
          'memberApi.queries',
          'memberApi.mutations',
        ],
      },
    }).concat(memberApi.middleware),
  devTools: import.meta.env.DEV,
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
