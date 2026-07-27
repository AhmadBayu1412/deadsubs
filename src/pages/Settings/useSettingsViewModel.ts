// Phase 11 — Settings ViewModel
// Manages user account info and subscription data management.
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../viewmodels/authStore';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import type { SettingsState } from './SettingsModel';

export interface SettingsViewModel {
  state: SettingsState;
  logout: () => Promise<void>;
  clearAllSubscriptions: () => Promise<void>;
}

export function useSettingsViewModel(): SettingsViewModel {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const clearAllSubscriptions = useSubscriptionStore((s) => s.clearAll);
  const [isClearing, setIsClearing] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth');
  }, [logout, navigate]);

  const handleClearAllSubscriptions = useCallback(async () => {
    setIsClearing(true);
    try {
      await clearAllSubscriptions();
    } finally {
      setIsClearing(false);
    }
  }, [clearAllSubscriptions]);

  const state: SettingsState = {
    user,
    isClearing,
  };

  return {
    state,
    logout: handleLogout,
    clearAllSubscriptions: handleClearAllSubscriptions,
  };
}
