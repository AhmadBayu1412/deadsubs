// Phase 1: barrel re-export for page-level components
// Each page is self-contained with its own MVVM triple
// Canonical location: pages/<Feature>/index.ts
export { DashboardView } from '../../pages/Dashboard';
export { SubscriptionListView } from '../../pages/SubscriptionList';
export { SubscriptionDetailView } from '../../pages/SubscriptionDetail';
export { CancelAssistantView } from '../../pages/CancelAssistant';
export { AnalyticsView } from '../../pages/Analytics';
export { SettingsView } from '../../pages/Settings';
export { AuthView } from '../../pages/Auth';
