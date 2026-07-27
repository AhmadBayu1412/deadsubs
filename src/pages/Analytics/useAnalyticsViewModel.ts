// Phase 13 — Analytics ViewModel
// Reads subscription data from the store and derives analytics.
import { useEffect, useMemo } from 'react';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { type AnalyticsState, deriveAnalyticsState } from './AnalyticsModel';

export interface AnalyticsViewModel {
  state: AnalyticsState;
}

export function useAnalyticsViewModel(): AnalyticsViewModel {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const fetchAll = useSubscriptionStore((s) => s.fetchAll);
  const loading = useSubscriptionStore((s) => s.loading);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const state = useMemo<AnalyticsState>(
    () => deriveAnalyticsState(subscriptions, loading),
    [subscriptions, loading],
  );

  return { state };
}
