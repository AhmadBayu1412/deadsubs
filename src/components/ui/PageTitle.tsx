// Phase 4 — Shared UI: PageTitle
// Consistent <h1> heading with optional description subtitle.
// Used at the top of every page.
// Presentational component — no state, no model needed.
import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface PageTitleProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageTitle({
  title,
  description,
  action,
  className,
  ...props
}: PageTitleProps) {
  return (
    <div
      className={clsx('flex items-start justify-between gap-4 mb-6', className)}
      {...props}
    >
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        {description && (
          <p className="text-sm text-secondary mt-1">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  );
}
