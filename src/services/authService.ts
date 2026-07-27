// Phase 10 — Auth Service
// Wraps Firebase Auth with standardized ApiResult and user-friendly error messages.
// All callers should use this service rather than importing firebase.ts directly.
import {
  type User,
  type AuthError,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';
import { AppError, type ApiResult } from './errors';

// ── Firebase error code → user-friendly message ─────────────────────────────────

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 8 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  'auth/keyboard-interactive': 'Sign-in cancelled.',
};

function mapFirebaseError(err: AuthError): AppError {
  const message = AUTH_ERROR_MESSAGES[err.code] ?? 'Something went wrong. Please try again.';
  return new AppError('unauthorized', message);
}

// ── Service functions ────────────────────────────────────────────────────────────

export interface AuthUser {
  uid: string;
  email: string | null;
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email };
}

export async function signIn(
  email: string,
  password: string,
): Promise<ApiResult<AuthUser>> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return AppError.ok(toAuthUser(result.user));
  } catch (err) {
    const firebaseErr = err as AuthError;
    return mapFirebaseError(firebaseErr).toResult<AuthUser>();
  }
}

export async function signUp(
  email: string,
  password: string,
): Promise<ApiResult<AuthUser>> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return AppError.ok(toAuthUser(result.user));
  } catch (err) {
    const firebaseErr = err as AuthError;
    return mapFirebaseError(firebaseErr).toResult<AuthUser>();
  }
}

export async function logOut(): Promise<ApiResult<void>> {
  try {
    await signOut(auth);
    return AppError.ok(undefined);
  } catch (err) {
    const firebaseErr = err as AuthError;
    return mapFirebaseError(firebaseErr).toResult<void>();
  }
}

export type AuthChangeCallback = (user: AuthUser | null) => void;

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback: AuthChangeCallback): () => void {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? toAuthUser(user) : null);
  });
}
