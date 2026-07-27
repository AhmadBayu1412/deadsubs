import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes/AppRouter';
import { useAuthStore } from './viewmodels/authStore';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { useNotificationStore } from './viewmodels/notificationStore';
import { checkAndGenerateRenewalNotifications } from './services/notificationService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);
  return <>{children}</>;
}

function NotificationInitializer({ children }: { children: React.ReactNode }) {
  const fetchAll = useNotificationStore((s) => s.fetchAll);
  useEffect(() => {
    checkAndGenerateRenewalNotifications();
    fetchAll();
  }, [fetchAll]);
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <AuthInitializer>
          <NotificationInitializer>
            <AppRouter />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1A1916',
                  color: '#F8F7F4',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
                success: {
                  iconTheme: {
                    primary: '#16A34A',
                    secondary: '#F8F7F4',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#DC2626',
                    secondary: '#F8F7F4',
                  },
                },
              }}
            />
          </NotificationInitializer>
        </AuthInitializer>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
