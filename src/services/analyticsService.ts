// Phase 13 — Analytics Service
// Reusable pure computation layer for subscription analytics.
// No side-effects, no store coupling — input is Subscription[], output is metrics.
// Safe to use in ViewModels, or anywhere analytics are needed.
import type { Subscription, Category, Status, BillingCycle } from '../types/subscription';
import { startOfDay, addDays, format } from 'date-fns';

// ── Billing cycle helpers ─────────────────────────────────────────────────────

export const BILLING_MULTIPLIER: Record<BillingCycle, number> = {
  weekly: 4.33,   // weeks per month
  monthly: 1,
  yearly: 1 / 12,
};

export function toMonthlyEquivalent(costCents: number, billingCycle: BillingCycle): number {
  return Math.round(costCents * BILLING_MULTIPLIER[billingCycle]);
}

export function toYearlyEquivalent(costCents: number, billingCycle: BillingCycle): number {
  return Math.round(costCents * BILLING_MULTIPLIER[billingCycle] * 12);
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}

// ── Core metrics ──────────────────────────────────────────────────────────────

export interface CategoryMetric {
  category: Category;
  label: string;
  count: number;
  monthlyTotal: number;
  yearlyTotal: number;
  percentage: number;
}

export interface RenewalTimelineEntry {
  label: string;       // e.g. "Jul 27" or "Week 31"
  date: string;        // ISO
  count: number;
  totalCost: number;   // monthly equivalent cents
}

export interface AnalyticsMetrics {
  // Counts
  totalCount: number;
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  pendingCancelCount: number;

  // Spending
  totalMonthly: number;   // monthly equivalent cents (active only)
  totalYearly: number;    // yearly equivalent cents (active only)
  averageMonthly: number;  // average monthly equivalent (active only)

  // Most expensive
  mostExpensive: Subscription | null;
  leastExpensive: Subscription | null;

  // Renewals
  upcomingRenewals: Subscription[];     // active, next 30 days
  overdueRenewals: Subscription[];      // active, past renewal date
  renewalsToday: Subscription[];
  renewalsThisWeek: Subscription[];
  renewalTimeline: RenewalTimelineEntry[]; // by day, next 30 days

  // Breakdown
  byCategory: CategoryMetric[];
  byStatus: { status: Status; label: string; count: number }[];
}

const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  pending_cancel: 'Pending Cancel',
};

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

export function computeAnalytics(subscriptions: Subscription[]): AnalyticsMetrics {
  if (subscriptions.length === 0) {
    return emptyMetrics();
  }

  const now = startOfDay(new Date());
  const weekEnd = addDays(now, 7);
  const monthEnd = addDays(now, 30);

  const active = subscriptions.filter((s) => s.status === 'active');
  const paused = subscriptions.filter((s) => s.status === 'paused');
  const cancelled = subscriptions.filter((s) => s.status === 'cancelled');
  const pendingCancel = subscriptions.filter((s) => s.status === 'pending_cancel');

  // Spending — active subscriptions with isRecurring enabled only
  // Only count subscriptions that will actually renew in the future
  const recurringActive = active.filter((s) => s.isRecurring);
  const totalMonthly = recurringActive.reduce(
    (sum, s) => sum + toMonthlyEquivalent(s.cost, s.billingCycle),
    0,
  );
  const totalYearly = recurringActive.reduce(
    (sum, s) => sum + toYearlyEquivalent(s.cost, s.billingCycle),
    0,
  );
  const averageMonthly = active.length > 0
    ? Math.round(totalMonthly / active.length)
    : 0;

  // Most/least expensive — based on recurring active subscriptions only
  const sorted = [...recurringActive].sort(
    (a, b) =>
      toMonthlyEquivalent(b.cost, b.billingCycle) -
      toMonthlyEquivalent(a.cost, a.billingCycle),
  );
  const mostExpensive = sorted[0] ?? null;
  const leastExpensive = sorted[sorted.length - 1] ?? null;

  // Renewal helpers
  const isRenewedIn = (sub: Subscription, from: Date, to: Date) => {
    const d = startOfDay(new Date(sub.renewalDate));
    return d >= startOfDay(from) && d <= startOfDay(to);
  };

  const overdueRenewals = active.filter((s) => {
    const d = startOfDay(new Date(s.renewalDate));
    return d < now;
  });

  const renewalsToday = active.filter((s) =>
    isSameDay(new Date(s.renewalDate), now),
  );

  const renewalsThisWeek = active.filter((s) =>
    isRenewedIn(s, now, weekEnd),
  );

  const upcomingRenewals = active.filter((s) =>
    isRenewedIn(s, now, monthEnd),
  );

  // Timeline — group by day for next 30 days
  const timelineMap = new Map<string, { count: number; total: number }>();
  for (let i = 0; i < 30; i++) {
    const d = addDays(now, i);
    const key = format(d, 'yyyy-MM-dd');
    timelineMap.set(key, { count: 0, total: 0 });
  }

  upcomingRenewals.forEach((s) => {
    const key = format(new Date(s.renewalDate), 'yyyy-MM-dd');
    const entry = timelineMap.get(key);
    if (entry) {
      entry.count += 1;
      entry.total += toMonthlyEquivalent(s.cost, s.billingCycle);
    }
  });

  const renewalTimeline: RenewalTimelineEntry[] = Array.from(timelineMap.entries()).map(
    ([date, { count, total }]) => ({
      label: format(new Date(date), 'MMM d'),
      date,
      count,
      totalCost: total,
    }),
  );

  // Category breakdown
  const categoryMap = new Map<Category, { count: number; monthly: number; yearly: number }>();
  recurringActive.forEach((s) => {
    const existing = categoryMap.get(s.category) ?? { count: 0, monthly: 0, yearly: 0 };
    categoryMap.set(s.category, {
      count: existing.count + 1,
      monthly: existing.monthly + toMonthlyEquivalent(s.cost, s.billingCycle),
      yearly: existing.yearly + toYearlyEquivalent(s.cost, s.billingCycle),
    });
  });

  const byCategory: CategoryMetric[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      label: CATEGORY_LABELS[category],
      count: data.count,
      monthlyTotal: data.monthly,
      yearlyTotal: data.yearly,
      percentage: totalMonthly > 0
        ? Math.round((data.monthly / totalMonthly) * 100)
        : 0,
    }))
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

  // Status breakdown
  const byStatus = [
    { status: 'active' as Status, label: STATUS_LABELS.active, count: active.length },
    { status: 'paused' as Status, label: STATUS_LABELS.paused, count: paused.length },
    { status: 'cancelled' as Status, label: STATUS_LABELS.cancelled, count: cancelled.length },
    { status: 'pending_cancel' as Status, label: STATUS_LABELS.pending_cancel, count: pendingCancel.length },
  ];

  return {
    totalCount: subscriptions.length,
    activeCount: active.length,
    pausedCount: paused.length,
    cancelledCount: cancelled.length,
    pendingCancelCount: pendingCancel.length,
    totalMonthly,
    totalYearly,
    averageMonthly,
    mostExpensive,
    leastExpensive,
    upcomingRenewals,
    overdueRenewals,
    renewalsToday,
    renewalsThisWeek,
    renewalTimeline,
    byCategory,
    byStatus,
  };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function emptyMetrics(): AnalyticsMetrics {
  return {
    totalCount: 0,
    activeCount: 0,
    pausedCount: 0,
    cancelledCount: 0,
    pendingCancelCount: 0,
    totalMonthly: 0,
    totalYearly: 0,
    averageMonthly: 0,
    mostExpensive: null,
    leastExpensive: null,
    upcomingRenewals: [],
    overdueRenewals: [],
    renewalsToday: [],
    renewalsThisWeek: [],
    renewalTimeline: [],
    byCategory: [],
    byStatus: [
      { status: 'active', label: 'Active', count: 0 },
      { status: 'paused', label: 'Paused', count: 0 },
      { status: 'cancelled', label: 'Cancelled', count: 0 },
      { status: 'pending_cancel', label: 'Pending Cancel', count: 0 },
    ],
  };
}
