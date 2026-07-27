// Phase 11 — Settings Model
// Domain types and derived state for the Settings page.
import type { AuthUser } from '../../services/authService';

export interface SettingsState {
  user: AuthUser | null;
  isClearing: boolean;
}
