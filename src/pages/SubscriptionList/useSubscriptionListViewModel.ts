// Phase 11 — SubscriptionList ViewModel
// Orchestrates data loading, filtering, sorting, and subscription management.
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { searchMovies, type OMDbSearchResult } from '../../services/movieService';
import {
  type SubscriptionListState,
  type FilterCategory,
  type FilterStatus,
  type SortField,
  type SortDir,
  deriveSubscriptionListState,
} from './SubscriptionListModel';

export interface SubscriptionListViewModel {
  state: SubscriptionListState;
  searchQuery: string;
  filterCategory: FilterCategory;
  filterStatus: FilterStatus;
  sortField: SortField;
  sortDir: SortDir;
  omdbResults: OMDbSearchResult[];
  omdbLoading: boolean;
  omdbError: string | null;
  setSearchQuery: (q: string) => void;
  setFilterCategory: (c: FilterCategory) => void;
  setFilterStatus: (s: FilterStatus) => void;
  setSortField: (f: SortField) => void;
  toggleSortDir: () => void;
  searchOmdb: (query: string) => Promise<void>;
  clearOmdbResults: () => void;
  removeSubscription: (id: string) => void;
  navigateToDetail: (id: string) => void;
}

export function useSubscriptionListViewModel(): SubscriptionListViewModel {
  const navigate = useNavigate();

  // Store data
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const fetchAll = useSubscriptionStore((s) => s.fetchAll);
  const loading = useSubscriptionStore((s) => s.loading);
  const remove = useSubscriptionStore((s) => s.remove);

  // Load on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Filter/sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('renewalDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // OMDb search state
  const [omdbResults, setOmdbResults] = useState<OMDbSearchResult[]>([]);
  const [omdbLoading, setOmdbLoading] = useState(false);
  const [omdbError, setOmdbError] = useState<string | null>(null);

  // Derive filtered/sorted list
  const state = useMemo<SubscriptionListState>(
    () =>
      deriveSubscriptionListState(
        subscriptions,
        loading,
        searchQuery,
        filterCategory,
        filterStatus,
        sortField,
        sortDir,
      ),
    [subscriptions, loading, searchQuery, filterCategory, filterStatus, sortField, sortDir],
  );

  const toggleSortDir = useCallback(
    () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')),
    [],
  );

  const searchOmdb = useCallback(async (query: string) => {
    if (!query.trim()) {
      setOmdbResults([]);
      return;
    }
    setOmdbLoading(true);
    setOmdbError(null);
    const result = await searchMovies({ query: query.trim(), type: 'movie' });
    setOmdbLoading(false);
    if (result.ok) {
      setOmdbResults(result.data.results);
    } else {
      setOmdbError(result.error.message);
      setOmdbResults([]);
    }
  }, []);

  const clearOmdbResults = useCallback(() => {
    setOmdbResults([]);
    setOmdbError(null);
  }, []);

  const removeSubscription = useCallback(
    async (id: string) => {
      try {
        await remove(id);
      } catch (err) {
        // Error is surfaced via store.error
      }
    },
    [remove],
  );

  const navigateToDetail = useCallback(
    (id: string) => navigate(`/subscriptions/${id}`),
    [navigate],
  );

  return {
    state,
    searchQuery,
    filterCategory,
    filterStatus,
    sortField,
    sortDir,
    omdbResults,
    omdbLoading,
    omdbError,
    setSearchQuery,
    setFilterCategory,
    setFilterStatus,
    setSortField,
    toggleSortDir,
    searchOmdb,
    clearOmdbResults,
    removeSubscription,
    navigateToDetail,
  };
}
