// Phase 7 — Dashboard Model
// Derives dashboard state from shared analytics service + subscription data.
import type { Subscription } from '../../models/subscription';
import {
  computeAnalytics,
} from '../../services/analyticsService';

export interface DashboardStats {
  totalMonthly: number; // dollars
  totalYearly: number;  // dollars
  activeCount: number;
  upcomingRenewals: Subscription[];
  overdueCount: number;
}

export interface SpendingByCategory {
  category: string;
  amount: number; // dollars
  percentage: number;
}

export interface DashboardState {
  stats: DashboardStats;
  spendingByCategory: SpendingByCategory[];
  isLoading: boolean;
  isEmpty: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
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

export function deriveDashboardState(
  subscriptions: Subscription[],
  isLoading: boolean,
): DashboardState {
  const metrics = computeAnalytics(subscriptions);

  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'pending_cancel',
  );

  // Include pending_cancel in upcoming renewals (same as Dashboard's previous behavior)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingRenewals = [...active]
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

  const overdueCount = active.filter((s) => {
    const renewal = new Date(s.renewalDate);
    renewal.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays < 0;
  }).length;

  // Map analytics category data to dashboard format (dollars, not cents)
  const spendingByCategory: SpendingByCategory[] = metrics.byCategory
    .map((item) => ({
      category: CATEGORY_LABELS[item.category] ?? item.category,
      amount: item.monthlyTotal / 100,
      percentage: item.percentage,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    stats: {
      totalMonthly: metrics.totalMonthly / 100,
      totalYearly: metrics.totalYearly / 100,
      activeCount: active.length,
      upcomingRenewals,
      overdueCount,
    },
    spendingByCategory,
    isLoading,
    isEmpty: subscriptions.length === 0,
  };
}

export function formatCentsToDollar(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}
