// Phase 13 — SubscriptionDetail Model
// Pure derived state from a single subscription.
import type { Subscription } from '../../types/subscription';

export interface SubscriptionDetailState {
  subscription: Subscription | null;
  isLoading: boolean;
  notFound: boolean;
}

export function deriveSubscriptionDetailState(
  subscription: Subscription | null,
  loading: boolean,
): SubscriptionDetailState {
  if (loading) return { subscription: null, isLoading: true, notFound: false };
  if (!subscription) return { subscription: null, isLoading: false, notFound: true };
  return { subscription, isLoading: false, notFound: false };
}
