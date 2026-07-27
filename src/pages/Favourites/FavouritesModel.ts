// Phase 7 — Favourites Model
// Domain types and derived state for the Favourites page.
import type { Subscription } from '../../models/subscription';

// ── State ─────────────────────────────────────────────────────────────────────

export interface FavouritesState {
  favouritedSubscriptions: Subscription[];
  isLoading: boolean;
  isEmpty: boolean;
}

// ── Pure derivation ───────────────────────────────────────────────────────────

export function deriveFavouritesState(
  subscriptions: Subscription[],
  isLoading: boolean,
): FavouritesState {
  const favouritedSubscriptions = subscriptions.filter((s) => s.isFavourited);
  return {
    favouritedSubscriptions,
    isLoading,
    isEmpty: favouritedSubscriptions.length === 0,
  };
}
