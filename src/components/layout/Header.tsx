// Phase 6 — Header
// Global top bar: logo, search, action buttons, profile menu, mobile hamburger.
// Nav links stay in Sidebar (desktop) and BottomNav (mobile).
import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Search,
  Plus,
  Bell,
  ChevronDown,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../viewmodels/authStore';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';

// ── Logo ─────────────────────────────────────────────────────────────────────

function DeadSubsLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
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

// ── Search bar ────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

function SearchBar({ value, onChange, onClear }: Readonly<SearchBarProps>) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
      <input
        type="search"
        placeholder="Search subscriptions…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full pl-9 pr-8 py-2 text-sm rounded-lg',
          'bg-bg border border-border',
          'text-primary placeholder:text-secondary/60',
          'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
          'transition-colors duration-150',
        )}
        aria-label="Search subscriptions"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── User avatar ──────────────────────────────────────────────────────────────

interface UserAvatarProps {
  email: string;
  onClick: () => void;
}

function UserAvatar({ email, onClick }: Readonly<UserAvatarProps>) {
  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full',
        'bg-accent-blue/10 text-accent-blue',
        'hover:bg-accent-blue/20 transition-colors duration-150 cursor-pointer',
      )}
      aria-label="Open user menu"
      aria-haspopup="true"
    >
      <div className="w-7 h-7 rounded-full bg-accent-blue text-white text-xs font-semibold flex items-center justify-center">
        {initials}
      </div>
      <span className="text-xs font-medium hidden sm:block">{email ?? 'User'}</span>
      <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
    </button>
  );
}

// ── Profile dropdown ──────────────────────────────────────────────────────────

interface ProfileMenuProps {
  email: string | null;
  onSignOut: () => void;
  setProfileOpen: (open: boolean) => void;
}

function ProfileMenu({ email, onSignOut, setProfileOpen }: Readonly<ProfileMenuProps>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setProfileOpen]);

  return (
    <div
      ref={ref}
      className={clsx(
        'absolute right-0 top-full mt-2 w-52 rounded-xl',
        'bg-surface border border-border shadow-lg',
        'overflow-hidden z-50',
      )}
      role="menu"
      aria-label="User menu"
    >
      {/* User info */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs text-secondary">Signed in as</p>
        <p className="text-sm font-medium text-primary truncate mt-0.5">
          {email ?? 'Unknown'}
        </p>
      </div>

      {/* Actions */}
      <div className="py-1">
        <NavLink
          to="/settings"
          onClick={() => setProfileOpen(false)}
          className={clsx(
            'flex items-center gap-3 w-full px-4 py-2.5 text-sm',
            'text-secondary hover:bg-bg hover:text-primary',
            'transition-colors duration-150 cursor-pointer',
          )}
          role="menuitem"
        >
          <User className="w-4 h-4" />
          Profile &amp; Settings
        </NavLink>
        <button
          onClick={() => {
            onSignOut();
            setProfileOpen(false);
          }}
          className={clsx(
            'flex items-center gap-3 w-full px-4 py-2.5 text-sm',
            'text-accent-red hover:bg-accent-red-light',
            'transition-colors duration-150 cursor-pointer',
          )}
          role="menuitem"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Notification bell ────────────────────────────────────────────────────────

interface NotificationBellProps {
  onClick?: () => void;
}

function NotificationBell({ onClick }: Readonly<NotificationBellProps>) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative p-2 rounded-lg text-secondary',
        'hover:bg-border/50 hover:text-primary',
        'transition-colors duration-150 cursor-pointer',
      )}
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {/* Badge — future: dynamic count */}
      <span
        className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-red"
        aria-hidden="true"
      />
    </button>
  );
}

// ── Header props ──────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuToggle?: () => void;
}

// ── Header ───────────────────────────────────────────────────────────────────

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const openAddModal = useSubscriptionStore((s) => s.openAddModal);
  const [searchValue, setSearchValue] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const clearSearch = useCallback(() => {
    setSearchValue('');
  }, []);

  const handleSignOut = useCallback(() => {
    logout();
    setProfileOpen(false);
  }, [logout]);

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border">
      <div className="flex items-center justify-between gap-3 px-4 h-14">
        {/* Left: Logo + mobile hamburger */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <DeadSubsLogo />
          <span className="text-sm font-bold text-primary hidden sm:block">
            DeadSubs
          </span>
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className={clsx(
                'p-2 -m-2 rounded-lg text-secondary',
                'hover:bg-border/50 hover:text-primary',
                'transition-colors duration-150 cursor-pointer lg:hidden',
              )}
              aria-label="Open navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Center: Search — desktop */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            onClear={clearSearch}
          />
        </div>

        {/* Right: Add button + notifications + avatar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Add Subscription — desktop */}
          <div className="hidden lg:block">
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={openAddModal}
              aria-label="Add new subscription"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen((v) => !v)}
            className={clsx(
              'p-2 rounded-lg lg:hidden',
              mobileSearchOpen ? 'text-accent-blue' : 'text-secondary hover:text-primary',
              'hover:bg-border/50 transition-colors duration-150 cursor-pointer',
            )}
            aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
          >
            {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Profile avatar + dropdown */}
          <div className="relative">
            <UserAvatar
              email={user?.email ?? ''}
              onClick={() => setProfileOpen((v) => !v)}
            />
            {profileOpen && (
              <ProfileMenu
                email={user?.email ?? null}
                onSignOut={handleSignOut}
                setProfileOpen={setProfileOpen}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar — shown when toggled open */}
      <div
        className={clsx(
          'px-4 pb-3 lg:hidden',
          mobileSearchOpen ? 'block' : 'hidden',
        )}
      >
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onClear={clearSearch}
        />
      </div>
    </header>
  );
}
