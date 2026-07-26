import { type ReactNode, useState } from 'react';
import { NavLink, useLocation, useOutlet } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  CreditCard,
  Heart,
  XCircle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../viewmodels/authStore';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Subscriptions', to: '/subscriptions', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Favourites', to: '/favourites', icon: <Heart className="w-5 h-5" /> },
  { label: 'Cancel Assistant', to: '/cancel-assistant', icon: <XCircle className="w-5 h-5" /> },
  { label: 'Analytics', to: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Settings', to: '/settings', icon: <Settings className="w-5 h-5" /> },
];

function DeadSubsLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="8" fill="#DC2626" />
      <path
        d="M8 10L14 16L20 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 18L14 12L20 18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-40 w-60 bg-surface border-r border-border flex flex-col',
          'transform transition-transform duration-250 lg:transform-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <DeadSubsLogo />
          <div>
            <h1 className="text-sm font-bold text-primary leading-none">DeadSubs</h1>
            <p className="text-xs text-secondary mt-0.5">Kill unwanted subs</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1 rounded-lg text-secondary hover:bg-border/50 cursor-pointer"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-secondary hover:bg-border/50 hover:text-primary'
                )}
              >
                {item.icon}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-primary truncate">
              {user?.email ?? 'Guest'}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-secondary hover:bg-border/50 hover:text-primary transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

interface BottomNavProps {
  onMenuToggle: () => void;
}

function BottomNav({ onMenuToggle }: BottomNavProps) {
  const location = useLocation();

  const items = [
    { label: 'Home', to: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Subs', to: '/subscriptions', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Favs', to: '/favourites', icon: <Heart className="w-5 h-5" /> },
    { label: 'Analytics', to: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Settings', to: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border lg:hidden">
      <div className="flex items-center">
        <button
          onClick={onMenuToggle}
          className="flex flex-col items-center justify-center px-4 py-3 text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        {items.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors',
                isActive ? 'text-accent-blue' : 'text-secondary'
              )}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const outlet = useOutlet();

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-auto">
          <div className="max-w-5xl mx-auto">{outlet}</div>
        </main>
      </div>
      <BottomNav onMenuToggle={() => setSidebarOpen(true)} />
    </div>
  );
}
