import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { CategoryBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import {
  formatCurrency,
  formatDate,
  getMonthlyEquivalent,
  getYearlyEquivalent,
} from '../../utils';
import {
  CheckCircle2,
  ExternalLink,
  Phone,
  ListChecks,
  AlertTriangle,
  ChevronRight,
  SkipForward,
} from 'lucide-react';
import type { Subscription } from '../../models/subscription';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3;

const STEP_LABELS = ['Identify', 'Prepare', 'Execute'] as const;

export function CancelAssistantPage() {
  const { subscriptions, fetchAll, update } = useSubscriptionStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [cancelMethod, setCancelMethod] = useState<'link' | 'phone' | 'inapp' | null>(null);
  const [targetDate, setTargetDate] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const subId = searchParams.get('subscriptionId');
    if (subId && subscriptions.length > 0) {
      const found = subscriptions.find((s) => s.id === subId);
      if (found) {
        setSelected(found);
        setStep(2);
      }
    }
  }, [searchParams, subscriptions]);

  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'pending_cancel'
  );

  const monthly = selected ? getMonthlyEquivalent(selected.cost, selected.billingCycle) : 0;
  const yearly = selected ? getYearlyEquivalent(selected.cost, selected.billingCycle) : 0;

  const handleSelect = (sub: Subscription) => {
    setSelected(sub);
    setStep(2);
    setSearchParams({});
  };

  const handleSkip = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await update(selected.id, { status: 'cancelled' });
      toast.success(`${selected.name} marked as cancelled`);
      navigate('/subscriptions');
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleExecute = async () => {
    if (!selected || !cancelMethod || !targetDate) return;
    setUpdating(true);
    try {
      await update(selected.id, {
        status: 'pending_cancel',
        cancelTargetDate: new Date(targetDate).toISOString(),
      });
      toast.success(`Cancel scheduled for ${selected.name}`);
      navigate('/subscriptions');
    } catch {
      toast.error('Failed to schedule cancellation');
    } finally {
      setUpdating(false);
    }
  };

  const cancelMethods = [
    {
      id: 'link' as const,
      label: 'Cancellation link',
      icon: <ExternalLink className="w-5 h-5" />,
      description: 'Log into your account and find the cancellation link in settings.',
    },
    {
      id: 'phone' as const,
      label: 'Phone call',
      icon: <Phone className="w-5 h-5" />,
      description: "Call the service's support line and request cancellation.",
    },
    {
      id: 'inapp' as const,
      label: 'In-app chat / support',
      icon: <ListChecks className="w-5 h-5" />,
      description: 'Use the live chat or support ticket in the app.',
    },
  ];

  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Cancel Assistant</h1>
          <p className="text-sm text-secondary mt-1">
            Step {step} of 3 — {STEP_LABELS[step - 1]}
          </p>
        </div>
        <EmptyState
          icon="subscriptions"
          title="No subscriptions to cancel"
          description="Add subscriptions first to use the Cancel Assistant."
          action={{ label: 'Add Subscription', onClick: () => navigate('/subscriptions?add=true') }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Cancel Assistant</h1>
          <p className="text-sm text-secondary mt-1">
            Step {step} of 3 — {STEP_LABELS[step - 1]}
          </p>
        </div>
        {step > 1 && (
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => (s - 1) as Step)}>
            Back
          </Button>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step === s
                  ? 'bg-accent-blue text-white'
                  : step > s
                  ? 'bg-accent-green text-white'
                  : 'bg-border text-secondary'
              }`}
            >
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                step === s ? 'text-primary' : 'text-secondary'
              }`}
            >
              {STEP_LABELS[s - 1]}
            </span>
            {s < 3 && (
              <div className={`w-8 h-0.5 ${step > s ? 'bg-accent-green' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Identify */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Which subscription do you want to cancel?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0 ? (
              <p className="text-sm text-secondary py-4 text-center">
                No active subscriptions to cancel.
              </p>
            ) : (
              active.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSelect(sub)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-accent-red/50 hover:bg-accent-red-light/30 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <CategoryBadge category={sub.category} />
                    <div>
                      <p className="font-medium text-primary">{sub.name}</p>
                      <p className="text-xs text-secondary">
                        Renews {formatDate(sub.renewalDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums text-primary">
                      {formatCurrency(getMonthlyEquivalent(sub.cost, sub.billingCycle))}
                      <span className="text-xs text-secondary font-normal">/mo</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-secondary" />
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Prepare */}
      {step === 2 && selected && (
        <>
          <Card className="border-accent-red/20 bg-accent-red-light/20">
            <CardContent>
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-accent-red flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-primary">
                    You're cancelling {selected.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-secondary">
                      Monthly cost:{' '}
                      <strong className="text-primary">
                        {formatCurrency(monthly)}
                      </strong>
                    </p>
                    <p className="text-sm text-secondary">
                      Yearly cost:{' '}
                      <strong className="text-primary">
                        {formatCurrency(yearly)}
                      </strong>
                    </p>
                    <p className="text-sm text-secondary">
                      Renewal date:{' '}
                      <strong className="text-primary">
                        {formatDate(selected.renewalDate)}
                      </strong>
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-accent-red">
                    Potential annual savings: {formatCurrency(yearly)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Before you cancel — check if you need it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                `Have you used ${selected.name} in the last 30 days?`,
                'Is there a cheaper plan available?',
                'Could you pause instead of cancel?',
                'Do you have any annual commitments or refunds owed?',
              ].map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-secondary">{q}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              loading={updating}
              className="flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              I already cancelled
            </Button>
            <Button variant="danger" onClick={() => setStep(3)} className="flex-1">
              Continue to Cancel
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Execute */}
      {step === 3 && selected && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>How will you cancel?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cancelMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setCancelMethod(method.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer text-left ${
                    cancelMethod === method.id
                      ? 'border-accent-red bg-accent-red-light/20'
                      : 'border-border hover:border-accent-red/30'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      cancelMethod === method.id ? 'bg-accent-red/10' : 'bg-bg'
                    }`}
                  >
                    <span
                      className={
                        cancelMethod === method.id ? 'text-accent-red' : 'text-secondary'
                      }
                    >
                      {method.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-primary">{method.label}</p>
                    <p className="text-xs text-secondary mt-0.5">{method.description}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {cancelMethod && (
            <Card className="bg-accent-blue/5 border-accent-blue/20">
              <CardHeader>
                <CardTitle>Script / Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    `Go to ${selected.name} website or app`,
                    'Navigate to Account or Subscription settings',
                    'Find the cancellation option',
                    'Select your reason (e.g., "Too expensive", "Not using it")',
                    'Confirm cancellation',
                    'Save confirmation email or screenshot',
                  ].map((stepText, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent-blue text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-primary">{stepText}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>When do you want to cancel?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary">
                Schedule a reminder to cancel before your next renewal date (
                {formatDate(selected.renewalDate)}).
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-primary">
                  Target cancellation date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-colors"
                />
              </div>
              <Button
                variant="danger"
                fullWidth
                disabled={!cancelMethod || !targetDate}
                loading={updating}
                onClick={handleExecute}
              >
                <CheckCircle2 className="w-4 h-4" />
                Schedule Cancellation
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
