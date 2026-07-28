// Phase 13 — SubscriptionDetail View
// Shows full subscription details with edit/delete/cancel actions.
import { useState } from 'react';
import { Calendar, FileText, Heart, AlertTriangle, Repeat, ArrowLeft } from 'lucide-react';
import { PageTitle } from '../../components/ui/PageTitle';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CategoryBadge, StatusBadge } from '../../components/ui/Badge';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { SubscriptionForm } from '../../components/ui/SubscriptionForm';
import { EmptyState } from '../../components/ui/EmptyState';
import { useSubscriptionDetailViewModel } from './useSubscriptionDetailViewModel';
import {
  CATEGORY_LABELS,
  BILLING_CYCLE_LABELS,
  STATUS_LABELS,
  CATEGORY_COLORS,
} from '../../types/subscription';

function DetailRow({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 px-3 border-b border-border last:border-0">
      <Icon className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-secondary">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-bg rounded-xl p-4">
      <p className="text-xs text-secondary">{label}</p>
      <p className={`text-base font-semibold mt-0.5 ${accent ? 'text-accent-red' : 'text-primary'}`}>{value}</p>
    </div>
  );
}

export function SubscriptionDetailView() {
  const vm = useSubscriptionDetailViewModel();
  const { state } = vm;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <PageTitle title="Loading…" />
      </div>
    );
  }

  if (state.notFound) {
    return (
      <div>
        <PageTitle title="Not found" />
        <EmptyState
          icon="subscriptions"
          title="Subscription not found"
          description="This subscription may have been deleted."
          action={{ label: 'Back to subscriptions', onClick: vm.navigateBack }}
        />
      </div>
    );
  }

  const sub = state.subscription!;
  const renewalDate = new Date(sub.renewalDate);
  const cancelDate = sub.cancelTargetDate ? new Date(sub.cancelTargetDate) : null;
  const canCancel = sub.status === 'active';
  const categoryColor = CATEGORY_COLORS[sub.category] || '#60A5FA';

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={vm.navigateBack}
            className="mt-1 p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-border/50 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <PageTitle title={sub.name} />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={() => vm.setOpenEdit(true)}>
            Edit
          </Button>
          {canCancel && (
            <Button variant="danger" size="sm" onClick={vm.cancelSubscription}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap items-center">
        <CategoryBadge category={sub.category} />
        <StatusBadge status={sub.status} />
        {sub.isFavourited && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red">
            <Heart className="w-3 h-3 fill-accent-red" />
            Favourited
          </span>
        )}
      </div>

      {/* Hero section with category color accent */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-border p-5">
        <div
          className="absolute top-0 left-0 w-2 h-full"
          style={{ backgroundColor: categoryColor }}
        />
        <div className="pl-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: categoryColor }}
            >
              {sub.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">{sub.name}</h2>
              <p className="text-sm text-secondary">{CATEGORY_LABELS[sub.category]}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InfoCard
              label="Cost"
              value={`$${(sub.cost / 100).toFixed(2)}`}
              accent
            />
            <InfoCard
              label="Billing Cycle"
              value={BILLING_CYCLE_LABELS[sub.billingCycle]}
            />
            <InfoCard
              label="Status"
              value={STATUS_LABELS[sub.status]}
            />
          </div>
        </div>
      </div>

      {/* Details card */}
      <Card padding="none" className="overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          <DetailRow icon={Calendar} label="Next Renewal Date">
            <p className="text-sm text-primary font-medium">
              {renewalDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </DetailRow>

          {sub.notes && (
            <DetailRow icon={FileText} label="Notes">
              <p className="text-sm text-secondary">{sub.notes}</p>
            </DetailRow>
          )}

          {cancelDate && (
            <DetailRow icon={AlertTriangle} label="Cancelled on">
              <p className="text-sm text-accent-red font-medium">
                {cancelDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </DetailRow>
          )}

          <DetailRow icon={Repeat} label="Billing Cycle">
            <p className="text-sm text-primary font-medium">{BILLING_CYCLE_LABELS[sub.billingCycle]}</p>
          </DetailRow>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-end pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-accent-red hover:bg-accent-red/10"
        >
          Delete subscription
        </Button>
      </div>

      {/* Edit modal */}
      <Modal open={vm.openEdit} onClose={() => vm.setOpenEdit(false)} title="Edit subscription" size="md">
        <SubscriptionForm
          subscription={sub}
          onSubmit={vm.editSubscription}
          onCancel={() => vm.setOpenEdit(false)}
        />
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          await vm.deleteSubscription();
          setShowDeleteConfirm(false);
        }}
        title="Delete Subscription"
        message={`Are you sure you want to permanently delete ${sub.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        confirmText="delete"
      />
    </div>
  );
}
