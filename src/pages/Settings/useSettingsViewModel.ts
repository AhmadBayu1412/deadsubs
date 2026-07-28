// Phase 14 — Settings ViewModel
// Manages account info, clear-data dialog, and the full clear-data flow.
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../viewmodels/authStore';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { useNotificationStore } from '../../viewmodels/notificationStore';
import { clearAllAppData } from '../../services/dataService';
import { useDisclosure } from '../../hooks/useDisclosure';
import type { SettingsState } from './SettingsModel';

export interface SettingsViewModel {
  state: SettingsState;
  logout: () => Promise<void>;
  clearDialog: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
  };
  handleClearAllData: () => Promise<void>;
}

export function useSettingsViewModel(): SettingsViewModel {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const fetchAllSubscriptions = useSubscriptionStore((s) => s.fetchAll);
  const fetchAllNotifications = useNotificationStore((s) => s.fetchAll);
  const clearSubscriptions = useSubscriptionStore((s) => s.clearAll);
  const clearNotifications = useNotificationStore((s) => s.clearAll);

  const clearDialog = useDisclosure(false);
  const dialogState = clearDialog;

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth');
  }, [logout, navigate]);

  const handleClearAllData = useCallback(async () => {
    const userId = user?.uid;
    // 1. Persist the clears to IndexedDB
    await clearAllAppData();

    // 2. Reset both stores to empty state
    clearSubscriptions();
    clearNotifications();

    // 3. Reload subscription data for this user
    if (userId) await fetchAllSubscriptions();
    // 4. Reload notification data
    await fetchAllNotifications();

    // 5. Close dialog
    dialogState.onClose();
  }, [user, clearSubscriptions, clearNotifications, fetchAllSubscriptions, fetchAllNotifications, dialogState]);

  const state: SettingsState = {
    user,
  };

  return {
    state,
    logout: handleLogout,
    clearDialog: {
      isOpen: dialogState.open,
      onOpen: dialogState.onOpen,
      onClose: dialogState.onClose,
    },
    handleClearAllData,
  };
}
