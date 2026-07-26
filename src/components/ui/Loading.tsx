// Phase 4 — Shared UI: Loading
// Full-page overlay spinner and inline spinner variants.
// Loading is a presentational component — no state, no model needed.
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({ label, className }: LoadingSpinnerProps) {
  return (
    <div className={clsx('flex flex-col items-center gap-3', className)}>
      <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
      {label && <p className="text-sm text-secondary">{label}</p>}
    </div>
  );
}

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ show, label, children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {show && (
        <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <LoadingSpinner label={label} />
        </div>
      )}
    </div>
  );
}

interface LoadingPageProps {
  label?: string;
}

export function LoadingPage({ label }: LoadingPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner label={label} />
    </div>
  );
}
