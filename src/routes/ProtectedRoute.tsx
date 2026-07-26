// Phase 2 — ProtectedRoute
// Auth logic is deferred to Phase 4.
// This stub passes all children through without guard.
export function ProtectedRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
