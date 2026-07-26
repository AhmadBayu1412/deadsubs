import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';
import { PlusCircle, Inbox, TrendingDown, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'subscriptions' | 'inbox' | 'savings' | 'search';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const icons: Record<string, ReactNode> = {
  subscriptions: <PlusCircle className="w-10 h-10 text-secondary/60" />,
  inbox: <Inbox className="w-10 h-10 text-secondary/60" />,
  savings: <TrendingDown className="w-10 h-10 text-accent-red/60" />,
  search: <Search className="w-10 h-10 text-secondary/60" />,
};

export function EmptyState({
  icon = 'subscriptions',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="mb-4">{icons[icon]}</div>
      <h3 className="text-base font-semibold text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-secondary max-w-xs mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
}
