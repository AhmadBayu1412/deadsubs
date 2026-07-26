import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-border',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
