// Phase 7 — Dashboard Model
// Domain types and derived state for the Dashboard page.
// No side-effects here — pure transformations of Subscription data.
import type { Subscription } from '../../models/subscription';

// ── Derived aggregates ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalMonthly: number; // in cents
  totalYearly: number;  // in cents
  activeCount: number;
  upcomingRenewals: Subscription[];
  overdueCount: number;
}

export interface SpendingByCategory {
  category: string;
  amount: number; // monthly in cents
  percentage: number;
}

export interface DashboardState {
  stats: DashboardStats;
  spendingByCategory: SpendingByCategory[];
  isLoading: boolean;
  isEmpty: boolean;
}

// ── Pure derivation ───────────────────────────────────────────────────────────

export function deriveDashboardState(
  subscriptions: Subscription[],
  isLoading: boolean,
): DashboardState {
  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'pending_cancel',
  );

  const totalMonthly = active.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + s.cost;
    if (s.billingCycle === 'yearly') return sum + s.cost / 12;
    if (s.billingCycle === 'weekly') return sum + s.cost * 4.33;
    return sum;
  }, 0);

  const totalYearly = active.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + s.cost * 12;
    if (s.billingCycle === 'yearly') return sum + s.cost;
    if (s.billingCycle === 'weekly') return sum + s.cost * 52;
    return sum;
  }, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingRenewals = [...subscriptions]
    .filter((s) => s.status === 'active' || s.status === 'pending_cancel')
    .filter((s) => {
      const renewal = new Date(s.renewalDate);
      renewal.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(
        (renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort(
      (a, b) =>
        new Date(a.renewalDate).getTime() -
        new Date(b.renewalDate).getTime(),
    );

  const overdueCount = subscriptions.filter((s) => {
    const renewal = new Date(s.renewalDate);
    renewal.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays < 0;
  }).length;

  // Spending by category
  const categoryMap = new Map<string, number>();
  for (const s of active) {
    const monthly =
      s.billingCycle === 'monthly'
        ? s.cost
        : s.billingCycle === 'yearly'
          ? s.cost / 12
          : s.billingCycle === 'weekly'
            ? s.cost * 4.33
            : s.cost;
    categoryMap.set(s.category, (categoryMap.get(s.category) ?? 0) + monthly);
  }

  const spendingByCategory: SpendingByCategory[] = Array.from(
    categoryMap.entries(),
  )
    .map(([category, amount]) => ({ category, amount, percentage: 0 }))
    .sort((a, b) => b.amount - a.amount);

  if (totalMonthly > 0) {
    for (const cat of spendingByCategory) {
      cat.percentage = Math.round((cat.amount / totalMonthly) * 100);
    }
  }

  return {
    stats: {
      totalMonthly,
      totalYearly,
      activeCount: active.length,
      upcomingRenewals,
      overdueCount,
    },
    spendingByCategory,
    isLoading,
    isEmpty: subscriptions.length === 0,
  };
}

// ── Display helpers ────────────────────────────────────────────────────────────

export function formatCentsToDollar(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}
