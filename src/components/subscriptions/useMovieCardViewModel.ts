// Phase 11 — MovieCard ViewModel
// Encapsulates interaction state for the subscription card.
// Calls the subscription store directly for favourite toggle — ViewModels MAY call stores.
import { useCallback } from 'react';
import type { Subscription } from '../../models/subscription';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import {
  deriveMovieCardState,
  type MovieCardState,
} from './MovieCardModel';

export interface MovieCardViewModel {
  cardState: MovieCardState;
  isFavourited: boolean;
  toggleFavourite: () => void;
  handleClick: () => void;
  handleCancel: () => void;
}

interface UseMovieCardViewModelOptions {
  subscription: Subscription;
  isFavourited?: boolean;
  onClick?: (sub: Subscription) => void;
  onCancel?: (sub: Subscription) => void;
}

export function useMovieCardViewModel({
  subscription,
  isFavourited = false,
  onClick,
  onCancel,
}: UseMovieCardViewModelOptions): MovieCardViewModel {
  // Injected favourite state from the parent subscription
  const storeFavourited = useSubscriptionStore((s) =>
    s.subscriptions.find((x) => x.id === subscription.id)?.isFavourited,
  );
  const effectiveFavourited = storeFavourited ?? isFavourited;

  const toggleFavourite = useCallback(async () => {
    await useSubscriptionStore.getState().toggleFavourite(subscription.id);
  }, [subscription.id]);

  const handleClick = useCallback(() => {
    onClick?.(subscription);
  }, [onClick, subscription]);

  const handleCancel = useCallback(() => {
    onCancel?.(subscription);
  }, [onCancel, subscription]);

  const cardState = deriveMovieCardState(subscription);

  return {
    cardState,
    isFavourited: effectiveFavourited,
    toggleFavourite,
    handleClick,
    handleCancel,
  };
}
