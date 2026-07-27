// Phase 7 — Favourites ViewModel
// Orchestrates data loading and exposes callbacks for the Favourites View.
import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
    fetchAll();
  }, [fetchAll]);

  return { state, navigateToSubscription, navigateToSubscriptions, refresh };
}
