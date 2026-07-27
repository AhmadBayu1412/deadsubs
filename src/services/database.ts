import Dexie, { type EntityTable } from 'dexie';
import type { Subscription } from '../models/subscription';
import type { AppNotification } from '../types/notification';

const db = new Dexie('DeadSubsDB') as Dexie & {
  subscriptions: EntityTable<Subscription, 'id'>;
  notifications: EntityTable<AppNotification, 'id'>;
};

db.version(1).stores({
  subscriptions: 'id, name, category, status, renewalDate, createdAt',
});

db.version(2).stores({
  subscriptions: 'id, name, category, status, renewalDate, createdAt',
  notifications: 'id, type, subscriptionId, read, createdAt',
});

export { db };

// ── Subscriptions ──────────────────────────────────────────────────────────────

export async function getAllSubscriptions(): Promise<Subscription[]> {
  return db.subscriptions.orderBy('renewalDate').toArray();
}

export async function getSubscriptionById(
  id: string
): Promise<Subscription | undefined> {
  return db.subscriptions.get(id);
}

export async function addSubscription(
  data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.subscriptions.add({ ...data, id, createdAt: now, updatedAt: now });
  return id;
}

export async function updateSubscription(
  id: string,
  data: Partial<Omit<Subscription, 'id' | 'createdAt'>>
): Promise<void> {
  await db.subscriptions.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteSubscription(id: string): Promise<void> {
  await db.subscriptions.delete(id);
}

export async function getUpcomingSubscriptions(
  daysAhead: number
): Promise<Subscription[]> {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const all = await db.subscriptions
    .filter((s) => s.status === 'active')
    .toArray();
  return all.filter((s) => {
    const renewal = new Date(s.renewalDate);
    return renewal >= now && renewal <= future;
  });
}

export async function clearAllSubscriptions(): Promise<void> {
  await db.subscriptions.clear();
}

export async function exportAllData(): Promise<Subscription[]> {
  return db.subscriptions.toArray();
}

export async function importData(subscriptions: Subscription[]): Promise<void> {
  await db.subscriptions.bulkPut(subscriptions);
}

// ── Notifications ────────────────────────────────────────────────────────────────

export async function getAllNotifications(): Promise<AppNotification[]> {
  return db.notifications.orderBy('createdAt').reverse().toArray();
}

export async function addNotification(
  data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.notifications.add({ ...data, id, read: false, createdAt: now });
  return id;
}

export async function markNotificationRead(id: string): Promise<void> {
  await db.notifications.update(id, { read: true });
}

export async function markAllNotificationsRead(): Promise<void> {
  await db.notifications.where('read').equals(0).modify({ read: true });
}

export async function deleteNotification(id: string): Promise<void> {
  await db.notifications.delete(id);
}

export async function clearAllNotifications(): Promise<void> {
  await db.notifications.clear();
}
