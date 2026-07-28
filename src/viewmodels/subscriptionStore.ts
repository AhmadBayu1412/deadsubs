// Phase 10 — Subscription Store
// All DB operations are scoped to the currently authenticated Firebase user (uid).
// Keeps optimistic UI pattern for toggleFavourite.
import { create } from 'zustand';
import type { Subscription } from '../models/subscription';
import { useAuthStore } from './authStore';
import * as favSvc from '../services/favouriteService';
import * as notificationSvc from '../services/notificationService';

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
  add: (data: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  update: (id: string, data: Partial<Subscription>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  importData: (data: Subscription[]) => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  cancelSubscription: (id: string) => Promise<void>;
  toggleRecurring: (id: string) => Promise<void>;
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
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) return;
    set({ loading: true, error: null });
    const result = await favSvc.getAllSubscriptions(userId);
    if (result.ok) {
      set({ subscriptions: result.data, loading: false, initialized: true });
    } else {
      set({ error: result.error.message, loading: false, initialized: true });
    }
  },

  add: async (data) => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) throw new Error('Not authenticated');
    const result = await favSvc.addSubscription(userId, data);
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
  },

  importData: async (data) => {
    const userId = useAuthStore.getState().user?.uid;
    if (!userId) throw new Error('Not authenticated');
    const result = await favSvc.importSubscriptions(userId, data);
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

  toggleRecurring: async (id) => {
    const sub = get().subscriptions.find((s) => s.id === id);
    if (!sub) return;

    // Optimistic update
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, isRecurring: !s.isRecurring } : s,
      ),
    }));

    // Persist in background
    const result = await favSvc.updateSubscription(id, {
      isRecurring: !sub.isRecurring,
    });
    if (!result.ok) {
      // Rollback on failure
      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id ? { ...s, isRecurring: sub.isRecurring } : s,
        ),
        error: result.error.message,
      }));
    }
  },
}));
