// Phase 11 — SubscriptionList View
// Full subscription list with search, filter, sort, and OMDb discovery.
import React, { useState, useCallback } from 'react';
import { Search, Plus, X, SlidersHorizontal } from 'lucide-react';
import { PageTitle } from '../../components/ui/PageTitle';
import { SubscriptionCard } from '../../views/components';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { type OMDbSearchResult } from '../../services/movieService';
import { useSubscriptionListViewModel } from './useSubscriptionListViewModel';
import { CATEGORY_LABELS } from '../../models/subscription';
import {
  type FilterCategory,
  type FilterStatus,
  type SortField,
  type SortDir,
} from './SubscriptionListModel';

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SubscriptionCardSkeleton() {
  return <Skeleton className="h-52 rounded-xl" />;
}

// ── OMDb discovery card ──────────────────────────────────────────────────────

function OmdbResultCard({
  result,
  onAdd,
}: {
  result: OMDbSearchResult;
  onAdd: (r: OMDbSearchResult) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border">
      {result.Poster !== 'N/A' ? (
        <img
          src={result.Poster}
          alt={result.Title}
          className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-16 bg-bg rounded-lg flex-shrink-0 flex items-center justify-center">
          <span className="text-xs text-secondary">N/A</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary truncate">{result.Title}</p>
        <p className="text-xs text-secondary mt-0.5">{result.Year}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAdd(result)}
        className="flex-shrink-0"
        aria-label={`Add ${result.Title}`}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  searchQuery,
  filterCategory,
  filterStatus,
  sortField,
  sortDir,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onSortChange,
  onToggleSort,
  onClearSearch,
}: {
  searchQuery: string;
  filterCategory: FilterCategory;
  filterStatus: FilterStatus;
  sortField: SortField;
  sortDir: SortDir;
  onSearchChange: (v: string) => void;
  onCategoryChange: (c: FilterCategory) => void;
  onStatusChange: (s: FilterStatus) => void;
  onSortChange: (f: SortField) => void;
  onToggleSort: () => void;
  onClearSearch: () => void;
}) {
  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];
  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'pending_cancel', label: 'Pending Cancel' },
  ];
  const sortOptions = [
    { value: 'renewalDate', label: 'Sort: Renewal' },
    { value: 'name', label: 'Sort: Name' },
    { value: 'cost', label: 'Sort: Cost' },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search subscriptions…"
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-surface focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-secondary hover:text-primary" />
          </button>
        )}
      </div>

      <Select
        options={categoryOptions}
        value={filterCategory}
        onChange={(e) => onCategoryChange(e.target.value as FilterCategory)}
        className="sm:w-44"
      />
      <Select
        options={statusOptions}
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value as FilterStatus)}
        className="sm:w-40"
      />
      <Select
        options={sortOptions}
        value={sortField}
        onChange={(e) => onSortChange(e.target.value as SortField)}
        className="sm:w-40"
      />
      <button
        onClick={onToggleSort}
        className="text-secondary hover:text-primary cursor-pointer text-xs font-medium px-2 py-2 border border-border rounded-lg bg-surface"
        aria-label={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
      >
        {sortDir === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
}

// ── SubscriptionList View ─────────────────────────────────────────────────────

export function SubscriptionListView() {
  const vm = useSubscriptionListViewModel();
  const { state } = vm;
  const [showOmdb, setShowOmdb] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setShowOmdb(true);
      vm.searchOmdb(localSearch.trim());
    }
  }, [localSearch, vm]);

  const handleOmdbAdd = useCallback((_result: OMDbSearchResult) => {
    setShowOmdb(false);
    setLocalSearch('');
    vm.clearOmdbResults();
  }, [vm]);

  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <PageTitle title="Subscriptions" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SubscriptionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Subscriptions"
        description={`${state.totalCount} total`}
        action={
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" />
            Add subscription
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchQuery={vm.searchQuery}
        filterCategory={vm.filterCategory}
        filterStatus={vm.filterStatus}
        sortField={vm.sortField}
        sortDir={vm.sortDir}
        onSearchChange={vm.setSearchQuery}
        onCategoryChange={vm.setFilterCategory}
        onStatusChange={vm.setFilterStatus}
        onSortChange={vm.setSortField}
        onToggleSort={vm.toggleSortDir}
        onClearSearch={() => vm.setSearchQuery('')}
      />

      {/* OMDb discovery panel */}
      {showOmdb && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">Discover movies &amp; shows</h2>
            <button
              onClick={() => { setShowOmdb(false); vm.clearOmdbResults(); }}
              className="text-secondary hover:text-primary cursor-pointer"
              aria-label="Close discovery"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search for a movie or show to track…"
              className="flex-1"
            />
            <Button type="submit" variant="primary" loading={vm.omdbLoading}>
              Search
            </Button>
          </form>

          {vm.omdbError && (
            <p className="text-sm text-accent-red">{vm.omdbError}</p>
          )}

          {vm.omdbResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {vm.omdbResults.map((r) => (
                <OmdbResultCard key={r.imdbID} result={r} onAdd={handleOmdbAdd} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Discover toggle */}
      {!showOmdb && (
        <button
          onClick={() => setShowOmdb(true)}
          className="flex items-center gap-2 text-sm text-accent-blue hover:underline cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Discover movies &amp; shows
        </button>
      )}

      {/* Subscription grid */}
      {state.isEmpty ? (
        <EmptyState
          icon="subscriptions"
          title={vm.searchQuery ? 'No results found' : 'No subscriptions yet'}
          description={
            vm.searchQuery
              ? 'Try a different search or clear the filters.'
              : 'Add your first subscription to start tracking.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.filteredSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onClick={vm.navigateToDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
