import Dexie, { type EntityTable } from 'dexie';
import type { Subscription } from '../models/subscription';

const db = new Dexie('DeadSubsDB') as Dexie & {
  subscriptions: EntityTable<Subscription, 'id'>;
};

db.version(1).stores({
  subscriptions: 'id, name, category, status, renewalDate, createdAt',
});

export { db };

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
