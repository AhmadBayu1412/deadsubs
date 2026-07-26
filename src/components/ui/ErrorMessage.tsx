// Phase 4 — Shared UI: ErrorMessage
// Error display with optional retry action.
// Presentational component — no state, no model needed.
import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
  className,
  ...props
}: ErrorMessageProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-3 py-12 px-6 text-center',
        className
      )}
      {...props}
    >
      <div className="p-3 rounded-full bg-accent-red-light">
        <AlertCircle className="w-6 h-6 text-accent-red" />
      </div>
      <div>
        {title && <p className="text-sm font-semibold text-primary">{title}</p>}
        <p className="text-sm text-secondary mt-1">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
