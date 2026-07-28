// Phase 11 — MovieCard ViewModel
// Encapsulates interaction state for the subscription card.
// Calls the subscription store directly for favourite toggle — ViewModels MAY call stores.
import { useCallback } from 'react';
import type { Subscription } from '../../models/subscription';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { addMonths } from 'date-fns';
import {
  deriveMovieCardState,
  type MovieCardState,
} from './MovieCardModel';

export interface MovieCardViewModel {
  cardState: MovieCardState;
  isFavourited: boolean;
  isRecurring: boolean;
  isExpired: boolean;
  displayRenewalDate: Date;
  daysUntilRenewal: number;
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

  // Parse renewalDate as UTC midnight (the date stored in ISO format)
  const renewalUTC = Date.UTC(
    Number(subscription.renewalDate.slice(0, 4)),
    Number(subscription.renewalDate.slice(5, 7)) - 1,
    Number(subscription.renewalDate.slice(8, 10)),
  );

  // Today's date as UTC midnight
  const nowUTC = Date.now();
  const todayUTC = Date.UTC(
    new Date(nowUTC).getUTCFullYear(),
    new Date(nowUTC).getUTCMonth(),
    new Date(nowUTC).getUTCDate(),
  );

  // displayRenewalDate: if recurring and past, push to next cycle
  // Use UTC epoch milliseconds for clean math
  let displayUTC = renewalUTC;
  while (displayUTC <= todayUTC && effectiveRecurring) {
    switch (subscription.billingCycle) {
      case 'weekly':
        displayUTC += 7 * 24 * 60 * 60 * 1000;
        break;
      case 'yearly':
        displayUTC += 365 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
      default: {
        const d = new Date(displayUTC);
        const next = addMonths(d, 1);
        displayUTC = Date.UTC(next.getFullYear(), next.getMonth(), next.getDate());
        break;
      }
    }
  }

  const displayRenewalDate = new Date(displayUTC);
  const daysUntilRenewal = Math.round((displayUTC - todayUTC) / (24 * 60 * 60 * 1000));

  // isExpired: only if past AND NOT recurring (recurring auto-renews, so never "expired")
  const isExpired = renewalUTC < todayUTC && subscription.status === 'active' && !effectiveRecurring;

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
    displayRenewalDate,
    daysUntilRenewal,
    toggleFavourite,
    toggleRecurring,
    handleClick,
    handleCancel,
  };
}
