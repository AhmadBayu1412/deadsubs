// Phase 14 — Header View
// Presentation-only. All business logic lives in useHeaderViewModel.
// No direct store access, no IndexedDB calls.
import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Search,
  Plus,
  ChevronDown,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SubscriptionForm } from '../ui/SubscriptionForm';
import { NotificationDropdown } from '../NotificationDropdown';
import { useHeaderViewModel } from './useHeaderViewModel';

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
  onChange: (v: string) => void;
  onClear: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

function SearchBar({ value, onChange, onClear, onKeyDown, inputRef }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search subscriptions…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={clsx(
          'w-full pl-9 pr-8 py-2 text-sm rounded-lg',
          'bg-bg border border-border',
          'text-primary placeholder:text-secondary/60',
          'focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
          'transition-colors duration-150',
        )}
        aria-label="Search subscriptions"
        aria-autocomplete="list"
        autoComplete="off"
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

// ── Search results dropdown ────────────────────────────────────────────────────

interface SearchResultsProps {
  results: { subscription: { id: string; name: string; category: string; cost: number }; highlightedName: string }[];
  selectedIndex: number;
  onSelect: (id: string) => void;
  onFocus: (index: number) => void;
}

function SearchResults({ results, selectedIndex, onSelect, onFocus }: SearchResultsProps) {
  return (
    <div
      className={clsx(
        'absolute left-0 right-0 top-full mt-1.5 rounded-xl',
        'bg-surface border border-border shadow-xl z-50 overflow-hidden',
      )}
      role="listbox"
      aria-label="Search results"
    >
      {results.map((item, i) => (
        <button
          key={item.subscription.id}
          role="option"
          aria-selected={i === selectedIndex}
          tabIndex={-1}
          onClick={() => onSelect(item.subscription.id)}
          onMouseEnter={() => onFocus(i)}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-2.5 text-left',
            'hover:bg-bg transition-colors cursor-pointer',
            i === selectedIndex && 'bg-bg',
          )}
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium text-primary truncate [&_mark]:bg-accent-blue/30 [&_mark]:rounded [&_mark]:px-0.5"
              dangerouslySetInnerHTML={{ __html: item.highlightedName }}
            />
            <p className="text-xs text-secondary capitalize">{item.subscription.category}</p>
          </div>
          <p className="text-xs text-secondary flex-shrink-0">
            ${(item.subscription.cost / 100).toFixed(2)}
          </p>
        </button>
      ))}
    </div>
  );
}

// ── User avatar ──────────────────────────────────────────────────────────────

interface UserAvatarProps {
  email: string | null;
  onClick: () => void;
  isOpen: boolean;
}

function UserAvatar({ email, onClick, isOpen }: UserAvatarProps) {
  const initials = email ? email.slice(0, 2).toUpperCase() : 'U';

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-colors duration-150 cursor-pointer',
        isOpen
          ? 'bg-accent-blue/20 text-accent-blue'
          : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20',
      )}
      aria-label="Open user menu"
      aria-haspopup="true"
      aria-expanded={isOpen}
    >
      <div className="w-7 h-7 rounded-full bg-accent-blue text-white text-xs font-semibold flex items-center justify-center">
        {initials}
      </div>
      <span className="text-xs font-medium hidden sm:block">{email ?? 'User'}</span>
      <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
    </button>
  );
}

// ── User menu dropdown ────────────────────────────────────────────────────────

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

function UserMenu({ isOpen, onClose, onLogout }: UserMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
      <NavLink
        to="/settings"
        onClick={onClose}
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
        onClick={onLogout}
        className={clsx(
          'flex items-center gap-3 w-full px-4 py-2.5 text-sm',
          'text-accent-red hover:bg-accent-red/5',
          'transition-colors duration-150 cursor-pointer',
        )}
        role="menuitem"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}

// ── Add subscription modal ─────────────────────────────────────────────────────

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    cost: number;
    billingCycle: 'monthly' | 'yearly' | 'weekly';
    category: 'streaming' | 'software' | 'fitness' | 'news' | 'gaming' | 'music' | 'cloud' | 'food' | 'other';
    renewalDate: string;
    notes?: string;
  }) => Promise<void>;
}

function AddModal({ isOpen, onClose, onSubmit }: AddModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Add subscription" size="md">
      <SubscriptionForm onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const vm = useHeaderViewModel();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border">
      <div className="flex items-center justify-between gap-3 px-4 h-14">
        {/* Left: Logo + mobile hamburger */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <DeadSubsLogo />
          <span className="text-sm font-bold text-primary hidden sm:block">DeadSubs</span>
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
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Center: Search — desktop */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          <div className="relative w-full max-w-sm">
            <SearchBar
              inputRef={searchInputRef}
              value={vm.search.query}
              onChange={vm.search.onChange}
              onClear={vm.search.onClear}
              onKeyDown={vm.search.onKeyDown}
            />
            {vm.search.showResults && (
              <SearchResults
                results={vm.search.results}
                selectedIndex={vm.search.selectedIndex}
                onSelect={vm.search.onSelect}
                onFocus={vm.search.onFocus}
              />
            )}
          </div>
        </div>

        {/* Right: Add button + notifications + avatar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Add Subscription — desktop */}
          <div className="hidden lg:block">
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={vm.addModal.onOpen}
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
          <NotificationDropdown />

          {/* User avatar + dropdown */}
          <div className="relative">
            <UserAvatar
              email={vm.userMenu.email}
              onClick={vm.userMenu.onOpen}
              isOpen={vm.userMenu.isOpen}
            />
            <UserMenu
              isOpen={vm.userMenu.isOpen}
              onClose={vm.userMenu.onClose}
              onLogout={vm.userMenu.onLogout}
            />
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className={clsx('px-4 pb-3 lg:hidden', mobileSearchOpen ? 'block' : 'hidden')}>
        <div className="relative w-full">
          <SearchBar
            value={vm.search.query}
            onChange={vm.search.onChange}
            onClear={vm.search.onClear}
            onKeyDown={vm.search.onKeyDown}
          />
          {vm.search.showResults && (
            <SearchResults
              results={vm.search.results}
              selectedIndex={vm.search.selectedIndex}
              onSelect={vm.search.onSelect}
              onFocus={vm.search.onFocus}
            />
          )}
        </div>
      </div>

      {/* Add subscription modal */}
      <AddModal
        isOpen={vm.addModal.isOpen}
        onClose={vm.addModal.onClose}
        onSubmit={vm.onAddSubmit}
      />
    </header>
  );
}
