// Phase 7 — Auth Model
// Domain types and validation schemas for the Auth page.
// Uses zod for input validation and firebase/auth error code mapping.
import { z } from 'zod';

// ── Validation schemas ────────────────────────────────────────────────────────

export const SignInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const SignUpSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;

// ── Firebase error map ────────────────────────────────────────────────────────

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

// ── UI state ──────────────────────────────────────────────────────────────────

export type AuthMode = 'signin' | 'signup';

export interface AuthState {
  mode: AuthMode;
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  isSubmitting: boolean;
}

export const INITIAL_AUTH_STATE: AuthState = {
  mode: 'signin',
  email: '',
  password: '',
  confirmPassword: '',
  error: null,
  isSubmitting: false,
};
