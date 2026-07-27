// Phase 14 — Header ViewModel
// All business logic lives here. The View is pure JSX.
import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { useAuthStore } from '../../viewmodels/authStore';
import { useDisclosure } from '../../hooks/useDisclosure';
import type { Subscription } from '../../types/subscription';

const DEBOUNCE_MS = 200;
const MAX_RESULTS = 5;

// ── Pure helpers ──────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(name: string, query: string): string {
  if (!query.trim()) return name;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return name.replace(regex, '<mark>$1</mark>');
}

function filterSubscriptions(
  subs: Subscription[],
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return subs
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    )
    .slice(0, MAX_RESULTS)
    .map((s) => ({
      subscription: s,
      highlightedName: highlightMatch(s.name, q),
    }));
}

// ── ViewModel ─────────────────────────────────────────────────────────────────

export function useHeaderViewModel() {
  const navigate = useNavigate();
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const addSubscription = useSubscriptionStore((s) => s.add);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // ── User menu ──────────────────────────────────────────────────────────────
  const userMenu = useDisclosure(false);

  const handleLogout = useCallback(async () => {
    userMenu.onClose();
    await logout();
    navigate('/auth');
  }, [logout, navigate, userMenu]);

  // ── Add modal ─────────────────────────────────────────────────────────────
  const addModal = useDisclosure(false);

  const handleAddSubmit = useCallback(
    async (data: {
      name: string;
      cost: number;
      billingCycle: Subscription['billingCycle'];
      category: Subscription['category'];
      renewalDate: string;
      notes?: string;
    }) => {
      await addSubscription({
        ...data,
        renewalDate: new Date(data.renewalDate).toISOString(),
        status: 'active',
        isFavourited: false,
      });
      addModal.onClose();
    },
    [addSubscription, addModal],
  );

  // ── Search ─────────────────────────────────────────────────────────────────
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSearchChange = useCallback((query: string) => {
    setRawQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(-1);
    }, DEBOUNCE_MS);
  }, []);

  const onSearchClear = useCallback(() => {
    setRawQuery('');
    setDebouncedQuery('');
    setSelectedIndex(-1);
  }, []);

  const searchResults = useMemo(
    () => filterSubscriptions(subscriptions, debouncedQuery),
    [subscriptions, debouncedQuery],
  );

  // Arrow/Escape/Enter key handler for the search input
  const onSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          const { id } = searchResults[selectedIndex].subscription;
          navigate(`/subscriptions/${id}`);
          onSearchClear();
        }
      } else if (e.key === 'Escape') {
        onSearchClear();
        (e.target as HTMLInputElement).blur();
      }
    },
    [searchResults, selectedIndex, navigate, onSearchClear],
  );

  const onSearchSelect = useCallback(
    (id: string) => {
      navigate(`/subscriptions/${id}`);
      onSearchClear();
    },
    [navigate, onSearchClear],
  );

  const onSearchFocus = useCallback(
    (index: number) => {
      setSelectedIndex(index);
    },
    [],
  );

  return {
    search: {
      query: rawQuery,
      results: searchResults,
      selectedIndex,
      showResults: rawQuery.trim().length > 0,
      onChange: onSearchChange,
      onClear: onSearchClear,
      onKeyDown: onSearchKeyDown,
      onSelect: onSearchSelect,
      onFocus: onSearchFocus,
    },
    userMenu: {
      isOpen: userMenu.open,
      email: user?.email ?? null,
      onOpen: userMenu.onOpen,
      onClose: userMenu.onClose,
      onLogout: handleLogout,
    },
    addModal: {
      isOpen: addModal.open,
      onOpen: addModal.onOpen,
      onClose: addModal.onClose,
    },
    onAddSubmit: handleAddSubmit,
  };
}
