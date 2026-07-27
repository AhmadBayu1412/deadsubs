// Phase 13 — Analytics Model
// Pure derived state from all subscriptions.
import type { Subscription, Category, Status } from '../../types/subscription';

export interface CategoryBreakdown {
  category: Category;
  label: string;
  count: number;
  totalCost: number; // monthly equivalent in cents
}

export interface StatusBreakdown {
  status: Status;
  label: string;
  count: number;
}

export interface AnalyticsState {
  totalMonthly: number;       // sum of active monthly-equivalent spend in cents
  totalYearly: number;        // totalMonthly * 12
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  categoryBreakdown: CategoryBreakdown[];
  statusBreakdown: StatusBreakdown[];
  mostExpensive: Subscription | null;
  upcomingRenewals: Subscription[]; // active, next 7 days
  isLoading: boolean;
}

const BILLING_MULTIPLIER: Record<Subscription['billingCycle'], number> = {
  weekly: 4.33,
  monthly: 1,
  yearly: 1 / 12,
};

const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  pending_cancel: 'Pending Cancel',
};

export function deriveAnalyticsState(
  subscriptions: Subscription[],
  loading: boolean,
): AnalyticsState {
  if (loading || subscriptions.length === 0) {
    return {
      totalMonthly: 0,
      totalYearly: 0,
      activeCount: 0,
      pausedCount: 0,
      cancelledCount: 0,
      categoryBreakdown: [],
      statusBreakdown: [],
      mostExpensive: null,
      upcomingRenewals: [],
      isLoading: loading,
    };
  }

  const active = subscriptions.filter((s) => s.status === 'active');
  const paused = subscriptions.filter((s) => s.status === 'paused');
  const cancelled = subscriptions.filter((s) => s.status === 'cancelled');

  const totalMonthly = active.reduce((sum, s) => {
    return sum + Math.round(s.cost * BILLING_MULTIPLIER[s.billingCycle]);
  }, 0);

  // Category breakdown
  const categoryMap = new Map<Category, { count: number; totalCost: number }>();
  active.forEach((s) => {
    const existing = categoryMap.get(s.category) ?? { count: 0, totalCost: 0 };
    categoryMap.set(s.category, {
      count: existing.count + 1,
      totalCost: existing.totalCost + Math.round(s.cost * BILLING_MULTIPLIER[s.billingCycle]),
    });
  });

  const CATEGORY_LABELS: Record<Category, string> = {
    streaming: 'Streaming',
    software: 'Software',
    fitness: 'Fitness',
    news: 'News',
    gaming: 'Gaming',
    music: 'Music',
    cloud: 'Cloud',
    food: 'Food',
    other: 'Other',
  };

  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      label: CATEGORY_LABELS[category],
      count: data.count,
      totalCost: data.totalCost,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  // Status breakdown
  const statusBreakdown: StatusBreakdown[] = [
    { status: 'active', label: STATUS_LABELS.active, count: active.length },
    { status: 'paused', label: STATUS_LABELS.paused, count: paused.length },
    { status: 'cancelled', label: STATUS_LABELS.cancelled, count: cancelled.length },
  ];

  // Most expensive
  const mostExpensive = active.reduce<Subscription | null>((max, s) => {
    const sMonthly = Math.round(s.cost * BILLING_MULTIPLIER[s.billingCycle]);
    const maxMonthly = max ? Math.round(max.cost * BILLING_MULTIPLIER[max.billingCycle]) : 0;
    return sMonthly > maxMonthly ? s : max;
  }, null);

  // Upcoming renewals — next 7 days
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const upcomingRenewals = active
    .filter((s) => {
      const d = new Date(s.renewalDate);
      return d >= now && d <= weekAhead;
    })
    .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));

  return {
    totalMonthly,
    totalYearly: totalMonthly * 12,
    activeCount: active.length,
    pausedCount: paused.length,
    cancelledCount: cancelled.length,
    categoryBreakdown,
    statusBreakdown,
    mostExpensive,
    upcomingRenewals,
    isLoading: false,
  };
}
