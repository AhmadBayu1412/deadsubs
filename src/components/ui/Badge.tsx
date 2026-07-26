import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import type { Category, Status } from '../../models/subscription';
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS } from '../../models/subscription';

type BadgeVariant = 'info' | 'danger' | 'success' | 'default';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<string, string> = {
  info: 'bg-blue-50 text-accent-blue border-blue-100',
  danger: 'bg-accent-red-light text-accent-red border-red-100',
  success: 'bg-accent-green-light text-accent-green border-green-100',
  default: 'bg-bg text-secondary border-border',
};

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusVariant: Record<Status, BadgeVariant> = {
  active: 'success',
  paused: 'info',
  cancelled: 'danger',
  pending_cancel: 'danger',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status]} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
