// Phase 13 — CancelAssistant View
// Shows cancelled subscriptions with reactivate and delete options.
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { PageTitle } from '../../components/ui/PageTitle';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CategoryBadge, StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCancelAssistantViewModel } from './useCancelAssistantViewModel';
export function CancelAssistantView() {
  const vm = useCancelAssistantViewModel();
  const { state } = vm;

  if (state.isLoading) {
    return (
      <div className="space-y-4">
        <PageTitle title="Cancel Assistant" description="Cancelled subscriptions" />
      </div>
    );
  }

  if (state.isEmpty) {
    return (
      <div>
        <PageTitle title="Cancel Assistant" description="Cancelled subscriptions" />
        <EmptyState
          icon="subscriptions"
          title="No cancelled subscriptions"
          description="Subscriptions you cancel will appear here for tracking."
          action={{ label: 'View subscriptions', onClick: vm.navigateBack }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Cancel Assistant"
        description={`${state.count} cancelled subscription${state.count !== 1 ? 's' : ''}`}
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-accent-red/5 border border-accent-red/20 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary">Cancellation tracking</p>
          <p className="text-xs text-secondary mt-0.5">
            Cancelled subscriptions are shown here. You can reactivate them if you change your mind,
            or permanently delete them.
          </p>
        </div>
      </div>

      {/* Cancelled list */}
      <div className="space-y-3">
        {state.cancelledSubscriptions.map((sub) => {
          const cancelledDate = sub.cancelTargetDate
            ? new Date(sub.cancelTargetDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown';

          return (
            <Card key={sub.id} padding="none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-sm font-semibold text-primary">{sub.name}</h3>
                      <CategoryBadge category={sub.category} />
                      <StatusBadge status={sub.status} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <AlertTriangle className="w-3 h-3" />
                      Cancelled on {cancelledDate}
                    </div>
                    {sub.notes && (
                      <p className="text-xs text-secondary mt-1">{sub.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => vm.reactivateSubscription(sub.id)}
                      className="gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reactivate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => vm.deleteSubscription(sub.id)}
                      className="text-accent-red hover:bg-accent-red-light"
                      aria-label={`Delete ${sub.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
