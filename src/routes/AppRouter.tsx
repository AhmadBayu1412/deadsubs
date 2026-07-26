import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardView } from '../pages/Dashboard';
import { SubscriptionListView } from '../pages/SubscriptionList';
import { SubscriptionDetailView } from '../pages/SubscriptionDetail';
import { FavouritesView } from '../pages/Favourites';
import { CancelAssistantView } from '../pages/CancelAssistant';
import { AnalyticsView } from '../pages/Analytics';
import { SettingsView } from '../pages/Settings';
import { AuthView } from '../pages/Auth';

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthView />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardView /> },
      { path: 'subscriptions', element: <SubscriptionListView /> },
      { path: 'subscriptions/:id', element: <SubscriptionDetailView /> },
      { path: 'favourites', element: <FavouritesView /> },
      { path: 'cancel-assistant', element: <CancelAssistantView /> },
      { path: 'analytics', element: <AnalyticsView /> },
      { path: 'settings', element: <SettingsView /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
