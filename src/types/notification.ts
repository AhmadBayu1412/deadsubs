// Phase 13 — Notification domain types
export type NotificationType =
  | 'renewal_today'
  | 'renewal_tomorrow'
  | 'payment_overdue'
  | 'subscription_cancelled'
  | 'subscription_added'
  | 'subscription_cancelled_auto';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  subscriptionId?: string;
  subscriptionName?: string;
  read: boolean;
  createdAt: string; // ISO
}

export type NewNotification = Omit<AppNotification, 'id' | 'createdAt' | 'read'>;
