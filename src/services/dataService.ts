// Phase 14 — Data Service
// High-level operations that coordinate multiple stores/services.
// Safe to call from ViewModels.
import * as favSvc from './favouriteService';
import * as notifSvc from './notificationService';

const SEEDED_KEY = 'deadsubs_seeded_v1';

export async function clearAllAppData(): Promise<void> {
  // 1. Clear IndexedDB subscriptions
  await favSvc.clearAllSubscriptions();
  // 2. Clear IndexedDB notifications
  await notifSvc.clearAllNotifications();
  // 3. Remove seed marker so fresh data can re-seed on next load
  localStorage.removeItem(SEEDED_KEY);
}
