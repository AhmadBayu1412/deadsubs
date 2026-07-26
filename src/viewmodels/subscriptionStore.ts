import { create } from 'zustand';
import type { Subscription, NewSubscription } from '../models/subscription';
import * as db from '../services/database';

interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  add: (data: NewSubscription) => Promise<string>;
  update: (id: string, data: Partial<Subscription>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  importData: (data: Subscription[]) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const subscriptions = await db.getAllSubscriptions();
      set({ subscriptions, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  add: async (data) => {
    const id = await db.addSubscription(data);
    await get().fetchAll();
    return id;
  },

  update: async (id, data) => {
    await db.updateSubscription(id, data);
    await get().fetchAll();
  },

  remove: async (id) => {
    await db.deleteSubscription(id);
    await get().fetchAll();
  },

  clearAll: async () => {
    await db.clearAllSubscriptions();
    set({ subscriptions: [] });
  },

  importData: async (data) => {
    await db.importData(data);
    await get().fetchAll();
  },
}));
