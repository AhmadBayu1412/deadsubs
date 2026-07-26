import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { CategoryBadge, StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { SubscriptionForm } from '../components/SubscriptionForm';
import { SkeletonRow } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  formatCurrency,
  daysUntil,
  getMonthlyEquivalent,
  formatDateShort,
} from '../../utils';
import {
  Plus,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import type { Subscription, Category, Status, NewSubscription } from '../../models/subscription';
import { CATEGORY_LABELS } from '../../models/subscription';
import toast from 'react-hot-toast';

type SortKey = 'name' | 'cost' | 'renewalDate' | 'status' | 'category';
type SortDir = 'asc' | 'desc';

export function SubscriptionListPage() {
  const { subscriptions, loading, fetchAll, add, update, remove } = useSubscriptionStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | ''>('');
  const [filterStatus, setFilterStatus] = useState<Status | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('renewalDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = subscriptions
    .filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory && s.category !== filterCategory) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'cost':
          cmp = getMonthlyEquivalent(a.cost, a.billingCycle) - getMonthlyEquivalent(b.cost, b.billingCycle);
          break;
        case 'renewalDate':
          cmp = new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleAdd = useCallback(async (data: NewSubscription) => {
    setSubmitting(true);
    try {
      await add(data);
      setShowAddModal(false);
      toast.success(`${data.name} added`);
    } catch {
      toast.error('Failed to add subscription');
    } finally {
      setSubmitting(false);
    }
  }, [add]);

  const handleEdit = useCallback(async (data: NewSubscription) => {
    if (!editingSub) return;
    setSubmitting(true);
    try {
      await update(editingSub.id, data);
      setEditingSub(null);
      toast.success(`${data.name} updated`);
    } catch {
      toast.error('Failed to update subscription');
    } finally {
      setSubmitting(false);
    }
  }, [editingSub, update]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await remove(id);
      setDeleteConfirm(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Subscription deleted');
    } catch {
      toast.error('Failed to delete');
    }
  }, [remove]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-secondary/40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-accent-blue" />
      : <ChevronDown className="w-3.5 h-3.5 text-accent-blue" />;
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'pending_cancel', label: 'Pending Cancel' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Subscriptions</h1>
          <p className="text-sm text-secondary mt-1">
            {subscriptions.length} total
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscriptions..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-bg placeholder:text-secondary/60 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-colors"
            />
          </div>
          <Select
            options={categoryOptions}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | '')}
            className="sm:w-44"
          />
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | '')}
            className="sm:w-40"
          />
        </div>
      </Card>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg">
          <span className="text-sm text-accent-blue font-medium">{selectedIds.size} selected</span>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              selectedIds.forEach((id) => remove(id));
              setSelectedIds(new Set());
              toast.success('Selected subscriptions deleted');
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      )}

      {loading && subscriptions.length === 0 ? (
        <Card padding="none">
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={search || filterCategory || filterStatus ? 'search' : 'subscriptions'}
            title={search || filterCategory || filterStatus ? 'No matches found' : 'No subscriptions yet'}
            description={
              search || filterCategory || filterStatus
                ? 'Try adjusting your search or filters.'
                : 'Add your first subscription to start tracking your spending.'
            }
            action={
              !search && !filterCategory && !filterStatus
                ? { label: 'Add Subscription', onClick: () => setShowAddModal(true) }
                : undefined
            }
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 border-b border-border bg-bg text-xs font-medium text-secondary uppercase tracking-wider">
            <div className="col-span-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-border cursor-pointer accent-accent-blue"
              />
              <button onClick={() => handleSort('name')} className="flex items-center gap-1 cursor-pointer">
                Name <SortIcon col="name" />
              </button>
            </div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">
              <button onClick={() => handleSort('cost')} className="flex items-center gap-1 cursor-pointer">
                Cost <SortIcon col="cost" />
              </button>
            </div>
            <div className="col-span-2">
              <button onClick={() => handleSort('renewalDate')} className="flex items-center gap-1 cursor-pointer">
                Renewal <SortIcon col="renewalDate" />
              </button>
            </div>
            <div className="col-span-2">
              <button onClick={() => handleSort('status')} className="flex items-center gap-1 cursor-pointer">
                Status <SortIcon col="status" />
              </button>
            </div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-bg/50 transition-colors group"
              >
                <div className="col-span-12 md:col-span-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(sub.id)}
                    onChange={() => toggleSelect(sub.id)}
                    className="w-4 h-4 rounded border-border cursor-pointer accent-accent-blue"
                  />
                  <Link to={`/subscriptions/${sub.id}`} className="font-medium text-primary hover:text-accent-blue transition-colors truncate">
                    {sub.name}
                  </Link>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <CategoryBadge category={sub.category} />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {formatCurrency(getMonthlyEquivalent(sub.cost, sub.billingCycle))}
                  </span>
                  <span className="text-xs text-secondary ml-1">/mo</span>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <span className="text-sm text-primary">{formatDateShort(sub.renewalDate)}</span>
                  {sub.status === 'active' && (
                    <span className="ml-2 text-xs text-secondary">
                      ({daysUntil(sub.renewalDate)}d)
                    </span>
                  )}
                </div>
                <div className="col-span-6 md:col-span-2">
                  <StatusBadge status={sub.status} />
                </div>
                <div className="col-span-6 md:col-span-3 flex items-center justify-end gap-1 opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSub(sub)}
                    className="text-secondary"
                  >
                    Edit
                  </Button>
                  <Link to={`/subscriptions/${sub.id}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(sub.id)}
                    className="text-accent-red hover:text-accent-red"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(null)} title="Delete Subscription" size="sm">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-secondary">
              Are you sure you want to delete{' '}
              <strong className="text-primary">
                {subscriptions.find((s) => s.id === deleteConfirm)?.name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Subscription"
        size="md"
      >
        <SubscriptionForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
          loading={submitting}
        />
      </Modal>

      <Modal
        open={!!editingSub}
        onClose={() => setEditingSub(null)}
        title="Edit Subscription"
        size="md"
      >
        {editingSub && (
          <SubscriptionForm
            subscription={editingSub}
            onSubmit={handleEdit}
            onCancel={() => setEditingSub(null)}
            loading={submitting}
          />
        )}
      </Modal>
    </div>
  );
}
