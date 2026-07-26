import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../views/components/AppShell';
import { DashboardPage } from '../views/pages/DashboardPage';
import { SubscriptionListPage } from '../views/pages/SubscriptionListPage';
import { SubscriptionDetailPage } from '../views/pages/SubscriptionDetailPage';
import { CancelAssistantPage } from '../views/pages/CancelAssistantPage';
import { AnalyticsPage } from '../views/pages/AnalyticsPage';
import { SettingsPage } from '../views/pages/SettingsPage';
import { AuthPage } from '../views/pages/AuthPage';
import { ProtectedRoute } from './ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'subscriptions', element: <SubscriptionListPage /> },
      { path: 'subscriptions/:id', element: <SubscriptionDetailPage /> },
      { path: 'cancel-assistant', element: <CancelAssistantPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
