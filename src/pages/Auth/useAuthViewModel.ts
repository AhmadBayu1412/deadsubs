// Phase 9 — Auth ViewModel
// Handles sign-in / sign-up flow via useAuthStore.
// Uses react-hook-form for validation; zod schema + error map live in AuthModel.
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../viewmodels/authStore';
import {
  type AuthMode,
  type AuthState,
  AUTH_ERROR_MESSAGES,
  SignInSchema,
  SignUpSchema,
  type SignInInput,
  type SignUpInput,
} from './AuthModel';

export type { SignInInput, SignUpInput };

// ── Public shape ───────────────────────────────────────────────────────────────

export interface AuthViewModel {
  state: AuthState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (...args: any[]) => any;
  formError: string | null;
  setMode: (mode: AuthMode) => void;
  // Wires RHF handleSubmit to our onSubmit + any additional success handler from the View
  handleSubmit: (
    onSuccess: (data: SignInInput | SignUpInput) => Promise<void>,
  ) => (e: React.SubmitEvent) => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuthViewModel(): AuthViewModel {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const [mode, setModeState] = useState<AuthMode>('signin');
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, watch, handleSubmit, formState: { errors } } =
    useForm<SignInInput | SignUpInput>({
      resolver: zodResolver(mode === 'signin' ? SignInSchema : SignUpSchema),
      defaultValues:
        mode === 'signin'
          ? { email: '', password: '' }
          : { email: '', password: '', confirmPassword: '' },
      mode: 'onBlur',
    });

  const onSubmit: SubmitHandler<SignInInput | SignUpInput> = useCallback(
    async (data) => {
      setServerError(null);
      try {
        if (mode === 'signin') {
          await authStore.login((data as SignInInput).email, (data as SignInInput).password);
        } else {
          await authStore.register((data as SignUpInput).email, (data as SignUpInput).password);
        }
        navigate('/', { replace: true });
      } catch (err: unknown) {
        const code = (err as { code?: string }).code ?? '';
        setServerError(
          AUTH_ERROR_MESSAGES[code] ??
            (mode === 'signin'
              ? 'Sign in failed. Please try again.'
              : 'Sign up failed. Please try again.'),
        );
      }
    },
    [mode, authStore, navigate],
  );

  const setMode = useCallback(
    (newMode: AuthMode) => {
      setModeState(newMode);
      setServerError(null);
    },
    [],
  );

  const state: AuthState = {
    mode,
    email: watch('email') as string,
    password: '',
    confirmPassword: '',
    error: serverError,
    isSubmitting: authStore.loading,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errs = errors as any;
  const formError =
    (errs.email?.message as string | undefined) ??
    (errs.password?.message as string | undefined) ??
    (errs.confirmPassword?.message as string | undefined) ??
    null;

  return {
    state,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: register as any,
    formError,
    setMode,
    handleSubmit: (onSuccess) =>
      handleSubmit(async (data) => {
        await onSubmit(data);
        await onSuccess(data as SignInInput | SignUpInput);
      }),
  };
}
