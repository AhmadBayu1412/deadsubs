// Phase 11 — Settings Model
// Domain types for the Settings page.
import type { AuthUser } from '../../services/authService';

export interface SettingsState {
  user: AuthUser | null;
}

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
