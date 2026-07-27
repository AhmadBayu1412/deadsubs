// Phase 7 — Auth View
// Full-page auth screen with sign-in / sign-up toggle.
// Unauthenticated users only — redirects handled by ProtectedRoute.
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthViewModel } from './useAuthViewModel';

// ── Sub-components ────────────────────────────────────────────────────────────

function DeadSubsWordmark() {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="8" fill="#DC2626" />
        <path
          d="M8 10L14 16L20 10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 18L14 12L20 18"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
      </svg>
      <span className="text-2xl font-bold text-primary">DeadSubs</span>
    </div>
  );
}

function ModeToggle({
  mode,
  onToggle,
}: {
  mode: 'signin' | 'signup';
  onToggle: (m: 'signin' | 'signup') => void;
}) {
  return (
    <div className="flex items-center justify-center mb-6 bg-bg rounded-lg p-1">
      <button
        type="button"
        onClick={() => onToggle('signin')}
        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150 cursor-pointer ${
          mode === 'signin'
            ? 'bg-surface text-primary shadow-sm'
            : 'text-secondary hover:text-primary'
        }`}
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => onToggle('signup')}
        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150 cursor-pointer ${
          mode === 'signup'
            ? 'bg-surface text-primary shadow-sm'
            : 'text-secondary hover:text-primary'
        }`}
      >
        Create account
      </button>
    </div>
  );
}

function AuthForm() {
  const vm = useAuthViewModel();

  return (
    <form
      onSubmit={vm.handleSubmit(async () => {
        // On successful validation, authStore.login/register fires in the ViewModel.
        // Additional post-submit logic (e.g. redirect) can go here.
      })}
      noValidate
      className="space-y-4"
    >
      <Input
        {...vm.register('email')}
        type="email"
        label="Email address"
        placeholder="you@example.com"
        autoComplete="email"
        error={vm.formError ?? undefined}
      />

      <Input
        {...vm.register('password')}
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete={vm.state.mode === 'signin' ? 'current-password' : 'new-password'}
      />

      {vm.state.mode === 'signup' && (
        <Input
          {...vm.register('confirmPassword')}
          type="password"
          label="Confirm password"
          placeholder="••••••••"
          autoComplete="new-password"
        />
      )}

      {vm.state.error && (
        <p className="text-sm text-accent-red bg-accent-red-light rounded-lg px-3 py-2 border border-red-100">
          {vm.state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={vm.state.isSubmitting}
        disabled={vm.state.isSubmitting}
      >
        {vm.state.mode === 'signin' ? 'Sign in' : 'Create account'}
      </Button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AuthView() {
  const vm = useAuthViewModel();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <DeadSubsWordmark />
        <Card padding="lg">
          <CardContent className="p-0">
            <ModeToggle mode={vm.state.mode} onToggle={vm.setMode} />
            <AuthForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
