// Phase 10 — Auth Store
// Uses authService for all Firebase Auth operations.
// authService provides standardized ApiResult and user-friendly error messages.
import { create } from 'zustand';
import { type AuthUser, signIn as svcSignIn, signUp as svcSignUp, logOut as svcLogOut, onAuthChange } from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  init: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: () => {
    const unsubscribe = onAuthChange((user) => {
      set({ user, initialized: true });
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ loading: true });
    const result = await svcSignIn(email, password);
    set({ loading: false });
    if (!result.ok) {
      throw result.error;
    }
  },

  register: async (email, password) => {
    set({ loading: true });
    const result = await svcSignUp(email, password);
    set({ loading: false });
    if (!result.ok) {
      throw result.error;
    }
  },

  logout: async () => {
    await svcLogOut();
  },
}));
