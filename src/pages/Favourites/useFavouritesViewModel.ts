// Phase 7 — Favourites ViewModel
// Orchestrates data loading and exposes callbacks for the Favourites View.
import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { useAuthStore } from '../../viewmodels/authStore';
import {
  type FavouritesState,
  deriveFavouritesState,
} from './FavouritesModel';

export interface FavouritesViewModel {
  state: FavouritesState;
  navigateToSubscription: (id: string) => void;
  navigateToSubscriptions: () => void;
  refresh: () => void;
}

export function useFavouritesViewModel(): FavouritesViewModel {
  const navigate = useNavigate();
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const fetchAll = useSubscriptionStore((s) => s.fetchAll);
  const loading = useSubscriptionStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  const state = useMemo<FavouritesState>(
    () => deriveFavouritesState(subscriptions, loading),
    [subscriptions, loading],
  );

  const navigateToSubscription = useCallback(
    (id: string) => navigate(`/subscriptions/${id}`),
    [navigate],
  );

  const navigateToSubscriptions = useCallback(
    () => navigate('/subscriptions'),
    [navigate],
  );

  const refresh = useCallback(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  return { state, navigateToSubscription, navigateToSubscriptions, refresh };
}
