// Phase 13 — CancelAssistant ViewModel
// Shows cancelled subscriptions with reactivation option.
import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import {
  type CancelAssistantState,
  deriveCancelAssistantState,
} from './CancelAssistantModel';

export interface CancelAssistantViewModel {
  state: CancelAssistantState;
  reactivateSubscription: (id: string) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  navigateToDetail: (id: string) => void;
  navigateBack: () => void;
}

export function useCancelAssistantViewModel(): CancelAssistantViewModel {
  const navigate = useNavigate();
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const fetchAll = useSubscriptionStore((s) => s.fetchAll);
  const update = useSubscriptionStore((s) => s.update);
  const remove = useSubscriptionStore((s) => s.remove);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const state = useMemo<CancelAssistantState>(
    () => deriveCancelAssistantState(subscriptions, false),
    [subscriptions],
  );

  const reactivateSubscription = useCallback(
    async (id: string) => {
      await update(id, { status: 'active', cancelTargetDate: undefined });
    },
    [update],
  );

  const deleteSubscription = useCallback(
    async (id: string) => {
      await remove(id);
    },
    [remove],
  );

  const navigateToDetail = useCallback(
    (id: string) => navigate(`/subscriptions/${id}`),
    [navigate],
  );

  const navigateBack = useCallback(() => navigate('/subscriptions'), [navigate]);

  return {
    state,
    reactivateSubscription,
    deleteSubscription,
    navigateToDetail,
    navigateBack,
  };
}
