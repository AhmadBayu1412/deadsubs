import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { SkeletonCard } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  formatCurrency,
  daysUntil,
  getMonthlyEquivalent,
  formatDateShort,
} from '../../utils';
import { CalendarDays, TrendingUp, TrendingDown, Plus, XCircle } from 'lucide-react';
import type { Subscription } from '../../models/subscription';

function BurnRateCard({ subscriptions }: { subscriptions: Subscription[] }) {
  const active = subscriptions.filter((s) => s.status === 'active');
  const monthlyTotal = active.reduce(
    (sum, s) => sum + getMonthlyEquivalent(s.cost, s.billingCycle),
    0
  );
  const isHigh = monthlyTotal > 10000;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-secondary">Monthly Burn Rate</p>
          <p
            className={`text-4xl font-bold mt-1 tabular-nums ${isHigh ? 'text-accent-red' : 'text-primary'}`}
          >
            {formatCurrency(monthlyTotal)}
          </p>
          <p className="text-xs text-secondary mt-1">
            {active.length} active subscription{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div
          className={`p-3 rounded-xl ${isHigh ? 'bg-accent-red-light' : 'bg-accent-green-light'}`}
        >
          {isHigh ? (
            <TrendingUp className={`w-6 h-6 ${isHigh ? 'text-accent-red' : 'text-accent-green'}`} />
          ) : (
            <TrendingDown className="w-6 h-6 text-accent-green" />
          )}
        </div>
      </div>
      {isHigh && (
        <p className="mt-3 text-xs text-accent-red font-medium">
          Consider reviewing your subscriptions to reduce spending.
        </p>
      )}
    </Card>
  );
}

function UpcomingRenewals({ subscriptions }: { subscriptions: Subscription[] }) {
  const active = subscriptions.filter((s) => s.status === 'active');
  const upcoming = active
    .map((s) => ({ ...s, days: daysUntil(s.renewalDate) }))
    .filter((s) => s.days >= 0 && s.days <= 7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Renewals</CardTitle>
          <CalendarDays className="w-5 h-5 text-secondary" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-secondary py-4 text-center">
            No renewals in the next 7 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Renewals</CardTitle>
        <CalendarDays className="w-5 h-5 text-secondary" />
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.map((sub) => (
          <Link
            key={sub.id}
            to={`/subscriptions/${sub.id}`}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-bg transition-colors -mx-1"
          >
            <div>
              <p className="text-sm font-medium text-primary">{sub.name}</p>
              <p className="text-xs text-secondary">{formatDateShort(sub.renewalDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(getMonthlyEquivalent(sub.cost, sub.billingCycle))}
              </span>
              <Badge variant={sub.days <= 2 ? 'danger' : 'info'}>
                {sub.days === 0 ? 'Today' : sub.days === 1 ? 'Tomorrow' : `${sub.days}d`}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Link to="/subscriptions?add=true">
          <Button variant="primary" fullWidth className="justify-start">
            <Plus className="w-4 h-4" />
            Add Subscription
          </Button>
        </Link>
        <Link to="/cancel-assistant">
          <Button variant="secondary" fullWidth className="justify-start">
            <XCircle className="w-4 h-4" />
            Cancel Assistant
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function SavingsCard({ subscriptions }: { subscriptions: Subscription[] }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const cancelled = subscriptions.filter(
    (s) => s.status === 'cancelled' && s.updatedAt.startsWith(currentMonth)
  );
  const totalSaved = cancelled.reduce(
    (sum, s) => sum + getMonthlyEquivalent(s.cost, s.billingCycle),
    0
  );

  return (
    <Card className="bg-accent-green-light border-green-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-accent-green">Saved This Month</p>
          <p className="text-3xl font-bold mt-1 tabular-nums text-accent-green">
            {formatCurrency(totalSaved)}
          </p>
          <p className="text-xs text-accent-green/70 mt-1">
            {cancelled.length} subscription{cancelled.length !== 1 ? 's' : ''} cancelled
          </p>
        </div>
        <div className="p-3 rounded-xl bg-white/50">
          <TrendingDown className="w-6 h-6 text-accent-green" />
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { subscriptions, loading, fetchAll } = useSubscriptionStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading && subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-secondary mt-1">Your subscription overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-secondary mt-1">Your subscription overview</p>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon="subscriptions"
          title="No subscriptions yet"
          description="Start tracking your subscriptions to see your burn rate and upcoming renewals."
          action={{
            label: 'Add your first subscription',
            onClick: () => (window.location.href = '/subscriptions?add=true'),
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <BurnRateCard subscriptions={subscriptions} />
            <SavingsCard subscriptions={subscriptions} />
            <QuickActions />
          </div>
          <UpcomingRenewals subscriptions={subscriptions} />
        </>
      )}
    </div>
  );
}
