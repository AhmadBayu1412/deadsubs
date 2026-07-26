import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { onAuthChange, signIn, signUp, logOut } from '../services/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => void;
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
    try {
      await signIn(email, password);
    } finally {
      set({ loading: false });
    }
  },

  register: async (email, password) => {
    set({ loading: true });
    try {
      await signUp(email, password);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await logOut();
  },
}));
