import { useState } from 'react';
import { useAuthStore } from '../../viewmodels/authStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

function DeadSubsLogo() {
  return (
    <div className="flex items-center gap-3 justify-center mb-8">
      <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="8" fill="#DC2626" />
        <path d="M8 10L14 16L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 18L14 12L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </svg>
      <div>
        <h1 className="text-2xl font-bold text-primary">DeadSubs</h1>
        <p className="text-sm text-secondary">Kill your unwanted subscriptions</p>
      </div>
    </div>
  );
}

export function AuthPage() {
  const { login, register } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(email, password);
        toast.success('Account created!');
      }
    } catch (err: unknown) {
      const error = err as { code?: string };
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      toast.error(messages[error.code ?? ''] ?? 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <DeadSubsLogo />

        <Card className="shadow-md">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-primary">
              {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
            </h2>
            <p className="text-sm text-secondary mt-1">
              {mode === 'signin'
                ? "Don't have an account?"
                : 'Already have an account?'}{' '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-accent-blue font-medium hover:underline cursor-pointer"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-bg placeholder:text-secondary/60 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-border bg-bg placeholder:text-secondary/60 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" fullWidth loading={loading} className="mt-2">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="text-xs text-center text-secondary mt-4">
            Your data is stored locally on this device. Firebase Auth is used only for account management.
          </p>
        </Card>
      </div>
    </div>
  );
}
