// Phase 7 — Dashboard View
// Top-level page. Uses the ViewModel hook and composes page sections.
// All data-display logic stays here; callbacks live in the ViewModel.
import { useNavigate } from 'react-router-dom';
import { Grid, TrendingDown, CreditCard, AlertTriangle, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { PageTitle } from '../../components/ui/PageTitle';
import { SubscriptionCard } from '../../views/components';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useDashboardViewModel } from './useDashboardViewModel';
import { useAuthStore } from '../../viewmodels/authStore';

function formatDollars(dollars: number): string {
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}

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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-accent-blue/10 text-accent-blue flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-primary mb-1">{title}</h3>
        <p className="text-xs text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ── Dashboard View ─────────────────────────────────────────────────────────────

export function DashboardView() {
  const vm = useDashboardViewModel();
  const { state } = vm;
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const getGreeting = () => {
    const firstName = user?.email?.split('@')[0]?.replace(/[._]/g, ' ') ?? 'there';
    const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    return displayName === 'There' ? '' : `, ${displayName}`;
  };

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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12">
        {/* Hero */}
        <div className="text-center max-w-lg mx-auto mb-14">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent-red flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path
                  d="M8 10L14 16L20 10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 18L14 12L20 18"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.5"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-3">
            Welcome{getGreeting()}!
          </h1>
          <p className="text-base text-secondary leading-relaxed mb-8">
            DeadSubs helps you track, manage, and cancel unwanted subscriptions — so you stop paying for what you don&apos;t use.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={vm.navigateToAddSubscription}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Add your first subscription
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          <FeatureCard
            icon={<TrendingDown className="w-5 h-5" />}
            title="Track Spending"
            description="See exactly how much you pay monthly and yearly across all subscriptions."
          />
          <FeatureCard
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Get Renewed Alerts"
            description="Never miss a renewal date — we remind you before charges hit your card."
          />
          <FeatureCard
            icon={<CreditCard className="w-5 h-5" />}
            title="Analytics & Insights"
            description="Visualize your subscription trends and find opportunities to cut costs."
          />
          <FeatureCard
            icon={<Grid className="w-5 h-5" />}
            title="Cancel Assistant"
            description="Step-by-step guides to cancel any subscription without the headache."
          />
        </div>

        <p className="text-sm text-secondary mt-8 text-center">
          Already have subscriptions?{' '}
          <button
            onClick={() => navigate('/subscriptions')}
            className="text-accent-blue hover:text-blue-700 font-medium underline-offset-2 hover:underline cursor-pointer transition-colors"
          >
            Browse them
          </button>
        </p>
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
          value={formatDollars(state.stats.totalMonthly)}
          sub="renewing monthly"
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <StatCard
          label="Yearly spend"
          value={formatDollars(state.stats.totalYearly)}
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
