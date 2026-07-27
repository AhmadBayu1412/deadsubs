// Phase 10 — Subscription Store
// Uses favouriteService for all DB operations.
// Keeps optimistic UI pattern for toggleFavourite.
import { create } from 'zustand';
import type { Subscription } from '../models/subscription';
import * as favSvc from '../services/favouriteService';
import * as notificationSvc from '../services/notificationService';

const SEEDED_KEY = 'deadsubs_seeded_v1';

// ── Mock seed data (Phase 9) ─────────────────────────────────────────────────

function createMockSubscription(
  overrides: Partial<Subscription> & {
    name: string;
    cost: number;
    billingCycle: Subscription['billingCycle'];
    category: Subscription['category'];
    renewalDate: string;
  },
): Subscription {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: overrides.name,
    cost: overrides.cost,
    billingCycle: overrides.billingCycle,
    category: overrides.category,
    renewalDate: overrides.renewalDate,
    status: 'active',
    notes: undefined,
    cancelTargetDate: undefined,
    isFavourited: false,
    createdAt: now,
    updatedAt: now,
  };
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  createMockSubscription({
    name: 'Netflix',
    cost: 1599,
    billingCycle: 'monthly',
    category: 'streaming',
    renewalDate: new Date(Date.now() + 12 * 86_400_000).toISOString(),
    notes: 'Shared plan — 4K UHD',
    isFavourited: true,
  }),
  createMockSubscription({
    name: 'Spotify',
    cost: 1099,
    billingCycle: 'monthly',
    category: 'music',
    renewalDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    notes: 'Family plan',
    isFavourited: false,
  }),
  createMockSubscription({
    name: 'GitHub Copilot',
    cost: 1000,
    billingCycle: 'monthly',
    category: 'software',
    renewalDate: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    notes: 'Personal account',
    isFavourited: false,
  }),
  createMockSubscription({
    name: 'The New York Times',
    cost: 1700,
    billingCycle: 'monthly',
    category: 'news',
    renewalDate: new Date(Date.now() + 20 * 86_400_000).toISOString(),
    isFavourited: false,
  }),
  createMockSubscription({
    name: 'Adobe Creative Cloud',
    cost: 5999,
    billingCycle: 'monthly',
    category: 'software',
    renewalDate: new Date(Date.now() + 6 * 86_400_000).toISOString(),
    notes: 'Photography plan',
    isFavourited: false,
  }),
  createMockSubscription({
    name: 'iCloud+ 200GB',
    cost: 299,
    billingCycle: 'monthly',
    category: 'cloud',
    renewalDate: new Date(Date.now() + 1 * 86_400_000).toISOString(),
    isFavourited: false,
  }),
  createMockSubscription({
    name: 'YouTube Premium',
    cost: 1318,
    billingCycle: 'monthly',
    category: 'streaming',
    renewalDate: new Date(Date.now() + 18 * 86_400_000).toISOString(),
    notes: 'Individual plan',
    isFavourited: false,
  }),
];

async function seedIfEmpty(): Promise<void> {
  try {
    const allResult = await favSvc.getAllSubscriptions();
    if (!allResult.ok) return;
    if (allResult.data.length > 0) return;
    const seeded = localStorage.getItem(SEEDED_KEY);
    if (seeded !== null) return;
    await favSvc.importSubscriptions(MOCK_SUBSCRIPTIONS);
    localStorage.setItem(SEEDED_KEY, '1');
  } catch {
    // Silently skip seeding on error
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  addModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  fetchAll: () => Promise<void>;
  add: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  update: (id: string, data: Partial<Subscription>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  importData: (data: Subscription[]) => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  cancelSubscription: (id: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  loading: false,
  error: null,
  initialized: false,
  addModalOpen: false,
  openAddModal: () => set({ addModalOpen: true }),
  closeAddModal: () => set({ addModalOpen: false }),

  fetchAll: async () => {
    set({ loading: true, error: null });
    await seedIfEmpty();
    const result = await favSvc.getAllSubscriptions();
    if (result.ok) {
      set({ subscriptions: result.data, loading: false, initialized: true });
    } else {
      set({ error: result.error.message, loading: false, initialized: true });
    }
  },

  add: async (data) => {
    const result = await favSvc.addSubscription(data);
    if (!result.ok) {
      set({ error: result.error.message });
      throw result.error;
    }
    const { id } = result.data;
    notificationSvc.createNotification(
      notificationSvc.makeSubscriptionAddedNotification(id, data.name),
    );
    await get().fetchAll();
    return id;
  },

  update: async (id, data) => {
    const result = await favSvc.updateSubscription(id, data);
    if (!result.ok) {
      set({ error: result.error.message });
      throw result.error;
    }
    await get().fetchAll();
  },

  remove: async (id) => {
    const result = await favSvc.deleteSubscription(id);
    if (!result.ok) {
      set({ error: result.error.message });
      throw result.error;
    }
    await get().fetchAll();
  },

  clearAll: async () => {
    await favSvc.clearAllSubscriptions();
    set({ subscriptions: [] });
    localStorage.removeItem(SEEDED_KEY);
  },

  importData: async (data) => {
    const result = await favSvc.importSubscriptions(data);
    if (!result.ok) {
      set({ error: result.error.message });
      throw result.error;
    }
    await get().fetchAll();
  },

  toggleFavourite: async (id) => {
    const sub = get().subscriptions.find((s) => s.id === id);
    if (!sub) return;

    // Optimistic update
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, isFavourited: !s.isFavourited } : s,
      ),
    }));

    // Persist in background
    const result = await favSvc.toggleFavourite(id, !sub.isFavourited);
    if (!result.ok) {
      // Rollback on failure
      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id ? { ...s, isFavourited: !s.isFavourited } : s,
        ),
        error: result.error.message,
      }));
    }
  },

  cancelSubscription: async (id) => {
    const sub = get().subscriptions.find((s) => s.id === id);
    if (!sub) return;

    const now = new Date().toISOString();
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'cancelled',
              cancelTargetDate: now,
              updatedAt: now,
            }
          : s,
      ),
    }));

    const result = await favSvc.updateSubscription(id, {
      status: 'cancelled',
      cancelTargetDate: now,
    });
    if (result.ok) {
      notificationSvc.createNotification(
        notificationSvc.makeSubscriptionCancelledNotification(id, sub.name),
      );
    }
    if (!result.ok) {
      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id ? sub : s,
        ),
        error: result.error.message,
      }));
    }
  },
}));
