import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthResponse } from '@issb/types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, rememberMe = false) => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.post<AuthResponse>('/auth/login', {
            email,
            password,
            rememberMe,
          });

          if (response.data.success) {
            const { user, token, refreshToken } = response.data.data!;
            
            // Set token in API client
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return true;
          } else {
            set({
              isLoading: false,
              error: response.data.message || 'Login failed',
            });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      register: async (userData: any) => {
        try {
          set({ isLoading: true, error: null });

          const response = await api.post<AuthResponse>('/auth/register', userData);

          if (response.data.success) {
            const { user, token, refreshToken } = response.data.data!;
            
            // Set token in API client
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            set({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return true;
          } else {
            set({
              isLoading: false,
              error: response.data.message || 'Registration failed',
            });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      logout: () => {
        try {
          // Call logout endpoint to invalidate server-side session
          api.post('/auth/logout', {
            refreshToken: get().refreshToken,
          }).catch(() => {
            // Ignore errors during logout
          });
        } catch (error) {
          // Ignore logout errors
        }
        
        // Clear local storage
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
        
        // Remove token from API client
        delete api.defaults.headers.common['Authorization'];
      },

      refreshToken: async () => {
        try {
          const { refreshToken } = get();
          
          if (!refreshToken) {
            get().logout();
            return false;
          }

          const response = await api.post<{ data: { token: string; refreshToken: string } }>(
            '/auth/refresh',
            { refreshToken }
          );

          if (response.data.success) {
            const { token, refreshToken: newRefreshToken } = response.data.data!;
            
            // Update tokens
            set({ token, refreshToken: newRefreshToken });
            
            // Update API client
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            return true;
          } else {
            get().logout();
            return false;
          }
        } catch (error) {
          get().logout();
          return false;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initializeAuth: async () => {
        try {
          const { token, user, refreshToken } = get();
          
          if (token && user && refreshToken) {
            // Set token in API client
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Verify token is still valid by fetching user data
            const response = await api.get<{ data: { user: User } }>('/auth/me');
            
            if (response.data.success) {
              set({
                user: response.data.data!.user,
                isAuthenticated: true,
              });
            } else {
              // Token is invalid, try to refresh
              const refreshSuccess = await get().refreshToken();
              if (!refreshSuccess) {
                get().logout();
              }
            }
          }
        } catch (error) {
          // Token might be expired, try to refresh
          const refreshSuccess = await get().refreshToken();
          if (!refreshSuccess) {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // This runs after the state is rehydrated
        if (state?.token) {
          // Set token in API client for subsequent requests
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);

// Initialize auth when the app starts
if (typeof window !== 'undefined') {
  useAuthStore.getState().initializeAuth();
}