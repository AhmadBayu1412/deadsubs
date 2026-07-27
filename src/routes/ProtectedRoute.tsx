// Phase 9 — ProtectedRoute
// Redirects unauthenticated users to /auth.
// Auth init is handled once in App.tsx via AuthInitializer.
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../viewmodels/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    // Auth is still being checked — show nothing to avoid flash of protected content
    return <></>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
