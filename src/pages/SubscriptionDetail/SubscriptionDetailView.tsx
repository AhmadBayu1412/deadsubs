// Phase 13 — SubscriptionDetail View
// Shows full subscription details with edit/delete/cancel actions.
import { Calendar, FileText, Heart, AlertTriangle, Repeat } from 'lucide-react';
import { PageTitle } from '../../components/ui/PageTitle';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CategoryBadge, StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SubscriptionForm } from '../../components/ui/SubscriptionForm';
import { EmptyState } from '../../components/ui/EmptyState';
import { useSubscriptionDetailViewModel } from './useSubscriptionDetailViewModel';
import {
  CATEGORY_LABELS,
  BILLING_CYCLE_LABELS,
  STATUS_LABELS,
} from '../../types/subscription';

function DetailRow({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Icon className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-secondary">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg rounded-lg p-3">
      <p className="text-xs text-secondary">{label}</p>
      <p className="text-sm font-semibold text-primary mt-0.5">{value}</p>
    </div>
  );
}

export function SubscriptionDetailView() {
  const vm = useSubscriptionDetailViewModel();
  const { state } = vm;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageTitle title={sub.name} />
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
      <div className="flex gap-2 flex-wrap">
        <CategoryBadge category={sub.category} />
        <StatusBadge status={sub.status} />
        {sub.isFavourited && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red">
            <Heart className="w-3 h-3 fill-accent-red" />
            Favourited
          </span>
        )}
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InfoCard
          label="Cost"
          value={`$${(sub.cost / 100).toFixed(2)} / ${BILLING_CYCLE_LABELS[sub.billingCycle].toLowerCase()}`}
        />
        <InfoCard
          label="Category"
          value={CATEGORY_LABELS[sub.category]}
        />
        <InfoCard
          label="Status"
          value={STATUS_LABELS[sub.status]}
        />
      </div>

      {/* Details card */}
      <Card padding="none">
        <CardContent className="p-0 divide-y divide-border">
          <DetailRow icon={Calendar} label="Renewal date">
            <p className="text-sm text-primary">
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
              <p className="text-sm text-accent-red">
                {cancelDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </DetailRow>
          )}

          <DetailRow icon={Repeat} label="Billing cycle">
            <p className="text-sm text-primary">{BILLING_CYCLE_LABELS[sub.billingCycle]}</p>
          </DetailRow>
        </CardContent>
      </Card>

      {/* Delete */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={vm.deleteSubscription} className="text-accent-red hover:bg-accent-red-light">
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
    </div>
  );
}
