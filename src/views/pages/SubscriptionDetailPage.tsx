import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { CategoryBadge, StatusBadge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import {
  formatCurrency,
  formatDate,
  daysUntil,
  getMonthlyEquivalent,
  getYearlyEquivalent,
} from '../../utils';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { NewSubscription } from '../../models/subscription';
import { BILLING_CYCLE_LABELS } from '../../models/subscription';
import toast from 'react-hot-toast';
import { SubscriptionForm } from '../components/SubscriptionForm';
import { Modal } from '../components/Modal';

export function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscriptions, fetchAll, update, remove } = useSubscriptionStore();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const subscription = subscriptions.find((s) => s.id === id);

  const handleUpdate = async (data: NewSubscription) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await update(id, data);
      setEditing(false);
      toast.success('Subscription updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await remove(id);
      toast.success('Subscription deleted');
      navigate('/subscriptions');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/subscriptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <div className="py-12 text-center">
            <p className="text-secondary">Subscription not found.</p>
            <Link to="/subscriptions">
              <Button variant="secondary" className="mt-4">
                Back to Subscriptions
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const monthly = getMonthlyEquivalent(subscription.cost, subscription.billingCycle);
  const yearly = getYearlyEquivalent(subscription.cost, subscription.billingCycle);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/subscriptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">{subscription.name}</h1>
              <StatusBadge status={subscription.status} />
            </div>
            <CategoryBadge category={subscription.category} className="mt-1.5" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Link to={`/cancel-assistant?subscriptionId=${subscription.id}`}>
            <Button variant="danger" size="sm">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      {/* Cost Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent-blue/10">
              <DollarSign className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-xs font-medium text-secondary uppercase tracking-wide">
                Per {subscription.billingCycle === 'weekly' ? 'Week' : subscription.billingCycle === 'yearly' ? 'Year' : 'Month'}
              </p>
              <p className="text-2xl font-bold tabular-nums text-primary mt-0.5">
                {formatCurrency(subscription.cost)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent-green/10">
              <RefreshCw className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <p className="text-xs font-medium text-secondary uppercase tracking-wide">Monthly</p>
              <p className="text-2xl font-bold tabular-nums text-primary mt-0.5">
                {formatCurrency(monthly)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-secondary uppercase tracking-wide">Yearly</p>
              <p className="text-2xl font-bold tabular-nums text-primary mt-0.5">
                {formatCurrency(yearly)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-secondary mt-0.5" />
              <div>
                <p className="text-xs text-secondary">Next Renewal</p>
                <p className="text-sm font-medium text-primary">
                  {formatDate(subscription.renewalDate)}
                  {subscription.status === 'active' && (
                    <span className="text-secondary ml-1">
                      ({daysUntil(subscription.renewalDate)} days)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="w-4 h-4 text-secondary mt-0.5" />
              <div>
                <p className="text-xs text-secondary">Billing Cycle</p>
                <p className="text-sm font-medium text-primary">
                  {BILLING_CYCLE_LABELS[subscription.billingCycle]}
                </p>
              </div>
            </div>
            {subscription.notes && (
              <div className="flex items-start gap-3 sm:col-span-2">
                <FileText className="w-4 h-4 text-secondary mt-0.5" />
                <div>
                  <p className="text-xs text-secondary">Notes</p>
                  <p className="text-sm text-primary">{subscription.notes}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-accent-red/20">
        <CardHeader>
          <CardTitle className="text-accent-red">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Delete this subscription</p>
              <p className="text-xs text-secondary">This action cannot be undone.</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit Subscription"
        size="md"
      >
        <SubscriptionForm
          subscription={subscription}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
}
