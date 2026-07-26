// Phase 5 — Layout: Header
// Presentational top bar stub.
// Logo + mobile hamburger trigger — nav links are in Sidebar (desktop) and BottomNav (mobile).
// Active nav state and logic will be implemented when Header connects to Router/Context.
import { clsx } from 'clsx';

function DeadSubsLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#DC2626" />
      <path d="M8 10L14 16L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 18L14 12L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-2">
          <DeadSubsLogo />
          <span className="text-sm font-bold text-primary">DeadSubs</span>
        </div>

        {/* Mobile hamburger trigger — opens sidebar */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className={clsx(
              'p-2 rounded-lg text-secondary hover:bg-border/50 hover:text-primary',
              'transition-colors duration-150 cursor-pointer lg:hidden',
            )}
            aria-label="Open navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
