// Phase 13 — Analytics ViewModel
// Derives analytics state from the subscription store.
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
