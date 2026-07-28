// Phase 11 — SubscriptionList Model
// Pure derived state for the subscription list page.
// No side-effects here — only transformations of Subscription data.
import type { Subscription } from '../../models/subscription';

// ── Derived state ──────────────────────────────────────────────────────────────

export type FilterCategory = Subscription['category'] | 'all';
export type FilterStatus = Subscription['status'] | 'all';
export type SortField = 'name' | 'cost' | 'renewalDate';
export type SortDir = 'asc' | 'desc';

export interface SubscriptionListState {
  filteredSubscriptions: Subscription[];
  totalCount: number;
  isLoading: boolean;
  isEmpty: boolean;
  searchQuery: string;
  filterCategory: FilterCategory;
  filterStatus: FilterStatus;
  sortField: SortField;
  sortDir: SortDir;
}

// ── Pure derivation ────────────────────────────────────────────────────────────

export function deriveSubscriptionListState(
  subscriptions: Subscription[],
  isLoading: boolean,
  searchQuery: string,
  filterCategory: FilterCategory,
  filterStatus: FilterStatus,
  sortField: SortField,
  sortDir: SortDir,
): SubscriptionListState {
  const query = searchQuery.toLowerCase().trim();

  // Exclude cancelled subscriptions from the main list (they go to Cancel Assistant)
  const activeSubscriptions = subscriptions.filter((s) => s.status !== 'cancelled');

  const filtered = activeSubscriptions.filter((s) => {
    const matchesSearch =
      !query ||
      s.name.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query) ||
      (s.notes ?? '').toLowerCase().includes(query);

    const matchesCategory =
      filterCategory === 'all' || s.category === filterCategory;

    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortField === 'cost') cmp = a.cost - b.cost;
    else if (sortField === 'renewalDate') {
      cmp =
        new Date(a.renewalDate).getTime() -
        new Date(b.renewalDate).getTime();
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return {
    filteredSubscriptions: filtered,
    totalCount: activeSubscriptions.length,
    isLoading,
    isEmpty: filtered.length === 0,
    searchQuery,
    filterCategory,
    filterStatus,
    sortField,
    sortDir,
  };
}
