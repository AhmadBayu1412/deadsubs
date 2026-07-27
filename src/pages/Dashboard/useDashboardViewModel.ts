// Phase 9 — Dashboard ViewModel
// Orchestrates data loading and exposes callbacks for the Dashboard View.
// Keeps all side-effects (DB reads, navigation) here — the View is pure JSX.
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import {
  type DashboardState,
  deriveDashboardState,
} from './DashboardModel';

export interface DashboardViewModel {
  // Derived display state
  state: DashboardState;
  searchQuery: string;
  // Callbacks
  navigateToSubscription: (id: string) => void;
  navigateToAddSubscription: () => void;
  refresh: () => void;
  setSearchQuery: (query: string) => void;
}

export function useDashboardViewModel(): DashboardViewModel {
  const navigate = useNavigate();
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const fetchAll = useSubscriptionStore((s) => s.fetchAll);
  const loading = useSubscriptionStore((s) => s.loading);

  // Load subscriptions on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const state = useMemo<DashboardState>(
    () => deriveDashboardState(subscriptions, loading),
    [subscriptions, loading],
  );

  const navigateToSubscription = useCallback(
    (id: string) => navigate(`/subscriptions/${id}`),
    [navigate],
  );

  const navigateToAddSubscription = useCallback(
    () => navigate('/subscriptions'),
    [navigate],
  );

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  // Search state lives here for easy testability
  const [searchQuery, setSearchQuery] = useState('');

  return {
    state,
    searchQuery,
    navigateToSubscription,
    navigateToAddSubscription,
    refresh,
    setSearchQuery,
  };
}
