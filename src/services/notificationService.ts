// Phase 13 — Notification Service
// IndexedDB persistence for notifications + factory methods for generating
// notifications from subscription events.
import { differenceInDays, startOfDay, isSameDay } from 'date-fns';
import type { AppNotification, NewNotification, NotificationType } from '../types/notification';
import { AppError, type ApiResult } from './errors';
import * as db from './database';

// ── Internal mapper ────────────────────────────────────────────────────────────

function mapDbError(err: unknown, context: string): AppError {
  const msg = err instanceof Error ? err.message : String(err);
  return new AppError('server', `Failed to ${context}: ${msg}`);
}

// ── Notification factory ───────────────────────────────────────────────────────

function makeNotification(
  type: NotificationType,
  title: string,
  body: string,
  subscriptionId?: string,
  subscriptionName?: string,
): NewNotification {
  return { type, title, body, subscriptionId, subscriptionName };
}

export function makeRenewalTodayNotification(
  subscriptionId: string,
  subscriptionName: string,
): NewNotification {
  return makeNotification(
    'renewal_today',
    'Renews today',
    `"${subscriptionName}" renews today.`,
    subscriptionId,
    subscriptionName,
  );
}

export function makeRenewalTomorrowNotification(
  subscriptionId: string,
  subscriptionName: string,
): NewNotification {
  return makeNotification(
    'renewal_tomorrow',
    'Renews tomorrow',
    `"${subscriptionName}" renews tomorrow.`,
    subscriptionId,
    subscriptionName,
  );
}

export function makeOverdueNotification(
  subscriptionId: string,
  subscriptionName: string,
): NewNotification {
  return makeNotification(
    'payment_overdue',
    'Payment overdue',
    `"${subscriptionName}" is overdue for renewal.`,
    subscriptionId,
    subscriptionName,
  );
}

export function makeSubscriptionAddedNotification(
  subscriptionId: string,
  subscriptionName: string,
): NewNotification {
  return makeNotification(
    'subscription_added',
    'Subscription added',
    `"${subscriptionName}" has been added to your subscriptions.`,
    subscriptionId,
    subscriptionName,
  );
}

export function makeSubscriptionCancelledNotification(
  subscriptionId: string,
  subscriptionName: string,
): NewNotification {
  return makeNotification(
    'subscription_cancelled',
    'Subscription cancelled',
    `"${subscriptionName}" has been cancelled.`,
    subscriptionId,
    subscriptionName,
  );
}

// ── CRUD ────────────────────────────────────────────────────────────────────────

export async function getAllNotifications(): Promise<ApiResult<AppNotification[]>> {
  try {
    const result = await db.getAllNotifications();
    return AppError.ok(result);
  } catch (err) {
    return mapDbError(err, 'load notifications').toResult<AppNotification[]>();
  }
}

export async function createNotification(
  data: NewNotification,
): Promise<ApiResult<string>> {
  try {
    const id = await db.addNotification(data);
    return AppError.ok(id);
  } catch (err) {
    return mapDbError(err, 'create notification').toResult<string>();
  }
}

export async function markRead(id: string): Promise<ApiResult<void>> {
  try {
    await db.markNotificationRead(id);
    return AppError.ok(undefined);
  } catch (err) {
    return mapDbError(err, 'mark notification read').toResult<void>();
  }
}

export async function markAllRead(): Promise<ApiResult<void>> {
  try {
    await db.markAllNotificationsRead();
    return AppError.ok(undefined);
  } catch (err) {
    return mapDbError(err, 'mark all notifications read').toResult<void>();
  }
}

export async function deleteNotification(id: string): Promise<ApiResult<void>> {
  try {
    await db.deleteNotification(id);
    return AppError.ok(undefined);
  } catch (err) {
    return mapDbError(err, 'delete notification').toResult<void>();
  }
}

export async function clearAllNotifications(): Promise<ApiResult<void>> {
  try {
    await db.clearAllNotifications();
    return AppError.ok(undefined);
  } catch (err) {
    return mapDbError(err, 'clear notifications').toResult<void>();
  }
}

// ── Renewal check ─────────────────────────────────────────────────────────────
// Called on app load to generate renewal/overdue notifications.

export async function checkAndGenerateRenewalNotifications(): Promise<void> {
  const subsResult = await db.getAllSubscriptions();
  if (!subsResult.length) return;

  const notificationsResult = await db.getAllNotifications();
  const existingRenewalToday = new Set(
    notificationsResult
      .filter((n) => n.type === 'renewal_today' || n.type === 'renewal_tomorrow')
      .map((n) => n.subscriptionId),
  );

  const now = startOfDay(new Date());

  for (const sub of subsResult) {
    if (sub.status !== 'active') continue;

    const renewal = startOfDay(new Date(sub.renewalDate));
    const daysUntil = differenceInDays(renewal, now);

    // Overdue
    if (daysUntil < 0 && !existingRenewalToday.has(sub.id)) {
      const existing = notificationsResult.find(
        (n) => n.subscriptionId === sub.id && n.type === 'payment_overdue',
      );
      if (!existing) {
        await db.addNotification(
          makeOverdueNotification(sub.id, sub.name),
        );
      }
    }

    // Today
    if (isSameDay(renewal, now) && !existingRenewalToday.has(sub.id)) {
      await db.addNotification(
        makeRenewalTodayNotification(sub.id, sub.name),
      );
    }

    // Tomorrow
    if (daysUntil === 1 && !existingRenewalToday.has(sub.id)) {
      await db.addNotification(
        makeRenewalTomorrowNotification(sub.id, sub.name),
      );
    }
  }
}
