// Phase 13 — Notification Store
// Zustand store for notification state.
import { create } from 'zustand';
import type { AppNotification, NewNotification } from '../types/notification';
import * as notifSvc from '../services/notificationService';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  dropdownOpen: boolean;
  initialized: boolean;
  fetchAll: () => Promise<void>;
  addNotification: (data: NewNotification) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  openDropdown: () => void;
  closeDropdown: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  dropdownOpen: false,
  initialized: false,

  fetchAll: async () => {
    const result = await notifSvc.getAllNotifications();
    if (result.ok) {
      const unreadCount = result.data.filter((n) => !n.read).length;
      set({ notifications: result.data, unreadCount, initialized: true });
    }
  },

  addNotification: async (data) => {
    const result = await notifSvc.createNotification(data);
    if (result.ok) {
      // Optimistic prepend
      const newNotif: AppNotification = {
        ...data,
        id: result.data,
        read: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    }
  },

  markRead: async (id) => {
    const notif = get().notifications.find((n) => n.id === id);
    if (!notif || notif.read) return;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    await notifSvc.markRead(id);
  },

  markAllRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    await notifSvc.markAllRead();
  },

  deleteNotification: async (id) => {
    const notif = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: notif && !notif.read
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));
    await notifSvc.deleteNotification(id);
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 });
    await notifSvc.clearAllNotifications();
  },

  openDropdown: () => set({ dropdownOpen: true }),
  closeDropdown: () => set({ dropdownOpen: false }),
}));
