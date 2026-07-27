// Phase 13 — Analytics Model
// Thin wrapper around analyticsService for the Analytics page.
// Exposes only what the View needs; all computation lives in analyticsService.
import type { Subscription } from '../../types/subscription';
import { computeAnalytics, type AnalyticsMetrics } from '../../services/analyticsService';

export { type AnalyticsMetrics };

export type { CategoryMetric } from '../../services/analyticsService';

export interface AnalyticsState {
  metrics: AnalyticsMetrics;
  isLoading: boolean;
  isEmpty: boolean;
}

export function deriveAnalyticsState(
  subscriptions: Subscription[],
  loading: boolean,
): AnalyticsState {
  const metrics = computeAnalytics(subscriptions);
  return {
    metrics,
    isLoading: loading,
    isEmpty: !loading && subscriptions.length === 0,
  };
}
