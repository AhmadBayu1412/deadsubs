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
  isRecurring: boolean;
  isExpired: boolean;
  toggleFavourite: () => void;
  toggleRecurring: () => void;
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
  const storeRecurring = useSubscriptionStore((s) =>
    s.subscriptions.find((x) => x.id === subscription.id)?.isRecurring,
  );
  const effectiveFavourited = storeFavourited ?? isFavourited;
  const effectiveRecurring = storeRecurring ?? subscription.isRecurring;

  // Check if subscription is expired (overdue and active)
  const renewalDate = new Date(subscription.renewalDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isExpired = renewalDate < now && subscription.status === 'active';

  const toggleFavourite = useCallback(async () => {
    await useSubscriptionStore.getState().toggleFavourite(subscription.id);
  }, [subscription.id]);

  const toggleRecurring = useCallback(async () => {
    await useSubscriptionStore.getState().toggleRecurring(subscription.id);
  }, [subscription.id]);

  const handleClick = useCallback(() => {
    onClick?.(subscription);
  }, [onClick, subscription]);

  const handleCancel = useCallback(async () => {
    // Call the onCancel callback if provided
    onCancel?.(subscription);
    // Directly cancel the subscription
    await useSubscriptionStore.getState().cancelSubscription(subscription.id);
  }, [onCancel, subscription.id, subscription]);

  const cardState = deriveMovieCardState(subscription);

  return {
    cardState,
    isFavourited: effectiveFavourited,
    isRecurring: effectiveRecurring,
    isExpired,
    toggleFavourite,
    toggleRecurring,
    handleClick,
    handleCancel,
  };
}
