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

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'fixed lg:sticky inset-y-0 left-0 z-40 w-60 bg-surface border-r border-border flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          'lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ top: 0, height: '100vh' }}
        aria-label="Mobile navigation"
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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

      {/* Desktop Sidebar (collapsible) */}
      <aside
        className={clsx(
          'hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-surface border-r border-border',
          'transition-all duration-300 ease-in-out',
          open ? 'w-60' : 'w-0',
        )}
        style={{ top: 0, height: '100vh' }}
        aria-label="Desktop navigation"
      >
        {/* Inner content with opacity transition */}
        <div
          className={clsx(
            'flex flex-col w-60 h-full',
            'transition-opacity duration-200',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
        >
          {/* Logo — clickable to Dashboard */}
          <NavLink
            to="/"
            className="flex items-center gap-3 px-5 py-5 border-b border-border hover:opacity-80 transition-opacity"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#DC2626" />
              <path d="M8 10L14 16L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 18L14 12L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </svg>
            <div>
              <p className="text-sm font-bold text-primary leading-none">DeadSubs</p>
              <p className="text-xs text-secondary mt-0.5">Kill unwanted subs</p>
            </div>
          </NavLink>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
        </div>
      </aside>
    </>
  );
}

// ── Toggle Button ────────────────────────────────────────────────────────────

function SidebarToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50',
        'w-6 h-12 items-center justify-center',
        'bg-surface border border-border rounded-r-lg shadow-md',
        'text-secondary hover:text-primary hover:bg-border/50 transition-colors duration-200 cursor-pointer',
      )}
      style={{
        left: open ? '232px' : '0px',
        transition: 'left 0.3s ease-in-out, background-color 0.2s, color 0.2s',
      }}
      aria-label={open ? 'Close sidebar' : 'Open sidebar'}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        style={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease-in-out' }}
      >
        <path
          d="M8 2L4 6L8 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <SidebarToggle open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div
        className={clsx(
          'flex-1 flex flex-col min-w-0',
          'transition-all duration-300 ease-in-out',
        )}
        style={{
          marginLeft: sidebarOpen ? '240px' : '0px',
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <Header onMenuToggle={() => setSidebarOpen(true)} sidebarOpen={sidebarOpen} />
        <Main />
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
