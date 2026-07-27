// MovieCard — derived state and helpers
// The View receives flat primitives; this module computes them from Subscription.
import type { Subscription } from '../../models/subscription';
import { differenceInDays, format } from 'date-fns';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  BILLING_CYCLE_LABELS,
  STATUS_LABELS,
} from '../../models/subscription';

// ── Derived card state ────────────────────────────────────────────────────────

export interface MovieCardState {
  name: string;
  formattedPrice: string;
  billingLabel: string;
  renewalLabel: string;
  daysUntilRenewal: number;
  isOverdue: boolean;
  categoryColor: string;
  categoryLabel: string;
  status: string;
  notes: string | null;
  renewalDate: Date;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}

export function deriveMovieCardState(sub: Subscription): MovieCardState {
  const renewalDate = new Date(sub.renewalDate);
  const daysUntilRenewal = differenceInDays(renewalDate, new Date());

  return {
    name: sub.name,
    formattedPrice: formatPrice(sub.cost),
    billingLabel: BILLING_CYCLE_LABELS[sub.billingCycle],
    renewalLabel: format(renewalDate, 'MMM d, yyyy'),
    daysUntilRenewal,
    isOverdue: daysUntilRenewal < 0,
    categoryColor: CATEGORY_COLORS[sub.category],
    categoryLabel: CATEGORY_LABELS[sub.category],
    status: STATUS_LABELS[sub.status],
    notes: sub.notes ?? null,
    renewalDate,
  };
}

// ── Mock data ────────────────────────────────────────────────────────────────

export const MOVIE_CARD_MOCK: Subscription = {
  id: 'mock-netflix',
  name: 'Netflix',
  cost: 1599,
  billingCycle: 'monthly',
  category: 'streaming',
  renewalDate: new Date(Date.now() + 12 * 86_400_000).toISOString(),
  status: 'active',
  notes: 'Shared plan — 4K UHD',
  cancelTargetDate: undefined,
  isFavourited: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const MOVIE_CARD_MOCK_OVERDUE: Subscription = {
  id: 'mock-spotify',
  name: 'Spotify',
  cost: 1099,
  billingCycle: 'monthly',
  category: 'music',
  renewalDate: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  status: 'active',
  notes: undefined,
  cancelTargetDate: undefined,
  isFavourited: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const MOVIE_CARD_MOCK_CANCELLED: Subscription = {
  id: 'mock-hulu',
  name: 'Hulu',
  cost: 1799,
  billingCycle: 'monthly',
  category: 'streaming',
  renewalDate: new Date(Date.now() + 5 * 86_400_000).toISOString(),
  status: 'cancelled',
  notes: undefined,
  cancelTargetDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  isFavourited: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};
