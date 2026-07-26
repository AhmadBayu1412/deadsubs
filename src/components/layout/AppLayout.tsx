// Phase 5 — Layout: AppLayout
// Composes Header (mobile), Sidebar (desktop), Main, Footer, and BottomNav (mobile)
// into a single responsive shell that wraps all authenticated routes.
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  CreditCard,
  Heart,
  XCircle,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Main } from './Main';
import { useAuthStore } from '../../viewmodels/authStore';

// ── Sidebar ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Subscriptions', to: '/subscriptions', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Favourites', to: '/favourites', icon: <Heart className="w-5 h-5" /> },
  { label: 'Cancel Assistant', to: '/cancel-assistant', icon: <XCircle className="w-5 h-5" /> },
  { label: 'Analytics', to: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Settings', to: '/settings', icon: <Settings className="w-5 h-5" /> },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-40 w-60 bg-surface border-r border-border flex flex-col',
          'hidden lg:flex',
          // Transitions handled by visibility — avoids animation jank during SSR
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#DC2626" />
            <path d="M8 10L14 16L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 18L14 12L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
          <div>
            <p className="text-sm font-bold text-primary leading-none">DeadSubs</p>
            <p className="text-xs text-secondary mt-0.5">Kill unwanted subs</p>
          </div>
        </div>

        {/* Nav links */}
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
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-secondary hover:bg-border/50 hover:text-primary',
                )}
              >
                {item.icon}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User / sign out */}
        <div className="px-3 py-4 border-t border-border">
          <p className="px-3 py-2 text-xs font-medium text-primary truncate">
            {user?.email ?? 'Guest'}
          </p>
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

// ── Bottom Nav (mobile only) ────────────────────────────────────────────────

function BottomNav() {
  const location = useLocation();

  const items = [
    { label: 'Home', to: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Subs', to: '/subscriptions', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Favs', to: '/favourites', icon: <Heart className="w-5 h-5" /> },
    { label: 'Analytics', to: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Settings', to: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center">
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
                'flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors',
                isActive ? 'text-accent-blue' : 'text-secondary',
              )}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// ── AppLayout ────────────────────────────────────────────────────────────────

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <Main />
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
