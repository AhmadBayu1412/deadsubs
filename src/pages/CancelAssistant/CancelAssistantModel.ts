// Phase 13 — CancelAssistant Model
// Pure derived state: cancelled subscriptions are shown here for tracking.
import type { Subscription } from '../../types/subscription';

export interface CancelAssistantState {
  cancelledSubscriptions: Subscription[];
  count: number;
  isLoading: boolean;
  isEmpty: boolean;
}

export function deriveCancelAssistantState(
  subscriptions: Subscription[],
  loading: boolean,
): CancelAssistantState {
  const cancelledSubscriptions = subscriptions
    .filter((s) => s.status === 'cancelled')
    .sort((a, b) => {
      const aDate = a.cancelTargetDate ?? a.updatedAt;
      const bDate = b.cancelTargetDate ?? b.updatedAt;
      return bDate.localeCompare(aDate);
    });

  return {
    cancelledSubscriptions,
    count: cancelledSubscriptions.length,
    isLoading: loading,
    isEmpty: !loading && cancelledSubscriptions.length === 0,
  };
}
