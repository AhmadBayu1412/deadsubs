// Phase 7 — Dashboard View
// Top-level page. Uses the ViewModel hook and composes page sections.
// All data-display logic stays here; callbacks live in the ViewModel.
import { Grid, TrendingDown, CreditCard, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { PageTitle } from '../../components/ui/PageTitle';
import { SubscriptionCard } from '../../views/components';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { useDashboardViewModel } from './useDashboardViewModel';
import { formatCentsToDollar } from './DashboardModel';

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'danger';
}

function StatCard({ label, value, sub, icon, variant = 'default' }: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-4">
      <div
        className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          variant === 'danger'
            ? 'bg-accent-red/10 text-accent-red'
            : 'bg-accent-blue/10 text-accent-blue',
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-secondary uppercase tracking-wide">
          {label}
        </p>
        <p
          className={clsx(
            'text-2xl font-bold mt-0.5',
            variant === 'danger' ? 'text-accent-red' : 'text-primary',
          )}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-secondary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-4">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// ── Dashboard View ─────────────────────────────────────────────────────────────

export function DashboardView() {
  const vm = useDashboardViewModel();
  const { state } = vm;

  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <PageTitle title="Dashboard" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (state.isEmpty) {
    return (
      <div>
        <PageTitle title="Dashboard" />
        <EmptyState
          icon="subscriptions"
          title="No subscriptions yet"
          description="Start tracking your subscriptions to see spending insights."
          action={{
            label: 'Add subscription',
            onClick: vm.navigateToAddSubscription,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageTitle
        title="Dashboard"
        description="Your subscription overview"
      />

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly spend"
          value={formatCentsToDollar(state.stats.totalMonthly)}
          sub="renewing monthly"
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <StatCard
          label="Yearly spend"
          value={formatCentsToDollar(state.stats.totalYearly)}
          sub="projected annual"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard
          label="Active"
          value={String(state.stats.activeCount)}
          sub="subscriptions"
          icon={<Grid className="w-5 h-5" />}
        />
        <StatCard
          label="Overdue"
          value={String(state.stats.overdueCount)}
          variant={state.stats.overdueCount > 0 ? 'danger' : 'default'}
          sub={state.stats.overdueCount > 0 ? 'action needed' : 'all good'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Upcoming renewals */}
      {state.stats.upcomingRenewals.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-primary mb-4">
            Upcoming renewals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.stats.upcomingRenewals.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                onClick={vm.navigateToSubscription}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA to view all */}
      <div className="flex justify-center">
        <Button
          variant="secondary"
          size="md"
          onClick={vm.navigateToAddSubscription}
        >
          View all subscriptions
        </Button>
      </div>
    </div>
  );
}
