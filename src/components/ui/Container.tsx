// Phase 4 — Shared UI: Container
// Constrained-width layout wrapper used on every page.
// Presentational component — no state, no model needed.
import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
};

export function Container({
  size = 'lg',
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={clsx(
        'mx-auto px-4 lg:px-8',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
