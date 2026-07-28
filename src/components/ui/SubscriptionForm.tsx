import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import type { Subscription, BillingCycle, NewSubscription } from '../../models/subscription';
import { CATEGORY_LABELS, BILLING_CYCLE_LABELS } from '../../models/subscription';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  cost: z.coerce.number().min(0, 'Cost must be positive'),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly']),
  category: z.enum([
    'streaming', 'software', 'fitness', 'news', 'gaming',
    'music', 'cloud', 'food', 'other',
  ]),
  renewalDate: z.string().min(1, 'Renewal date is required'),
  notes: z.string().optional(),
  isRecurring: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface SubscriptionFormProps {
  subscription?: Subscription;
  onSubmit: (data: NewSubscription) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function SubscriptionForm({
  subscription,
  onSubmit,
  onCancel,
  loading,
}: SubscriptionFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: subscription?.name ?? '',
      cost: subscription ? subscription.cost / 100 : 0,
      billingCycle: subscription?.billingCycle ?? 'monthly',
      category: subscription?.category ?? 'other',
      renewalDate: subscription?.renewalDate?.split('T')[0] ?? '',
      notes: subscription?.notes ?? '',
      isRecurring: subscription?.isRecurring ?? true,
    },
  });

  const billingCycle = watch('billingCycle');
  const isRecurring = watch('isRecurring');

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit({
      name: data.name,
      cost: Math.round(data.cost * 100),
      billingCycle: data.billingCycle,
      category: data.category,
      renewalDate: new Date(data.renewalDate).toISOString(),
      status: subscription?.status ?? 'active',
      notes: data.notes,
      isFavourited: subscription?.isFavourited ?? false,
      isRecurring: data.isRecurring,
    });
  });

  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const cycleOptions = Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      <Input
        label="Subscription Name"
        placeholder="e.g. Netflix, Spotify"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Cost ($)"
          type="number"
          step="0.01"
          min="0"
          placeholder="9.99"
          error={errors.cost?.message}
          {...register('cost')}
        />
        <Select
          label="Billing Cycle"
          options={cycleOptions}
          value={billingCycle}
          onChange={(e) => setValue('billingCycle', e.target.value as BillingCycle)}
          error={errors.billingCycle?.message}
        />
      </div>

      <Select
        label="Category"
        options={categoryOptions}
        error={errors.category?.message}
        {...register('category')}
      />

      <Input
        label="Next Renewal Date"
        type="date"
        error={errors.renewalDate?.message}
        {...register('renewalDate')}
      />

      {/* Auto-renew toggle */}
      <div className="flex items-center justify-between py-2 border border-border rounded-lg px-3 bg-bg">
        <div className="flex items-center gap-2">
          {isRecurring ? (
            <RefreshCw className="w-4 h-4 text-accent-blue" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-secondary" />
          )}
          <div>
            <p className="text-sm font-medium text-primary">Auto-renew</p>
            <p className="text-xs text-secondary">
              {isRecurring ? 'Subscription will renew automatically' : 'One-time purchase — no auto-renewal'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setValue('isRecurring', !isRecurring)}
          className={clsx(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer flex-shrink-0',
            isRecurring ? 'bg-accent-blue' : 'bg-border',
          )}
          aria-label={isRecurring ? 'Disable auto-renew' : 'Enable auto-renew'}
        >
          <span
            className={clsx(
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm',
              isRecurring ? 'translate-x-4' : 'translate-x-1',
            )}
          />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-primary">Notes (optional)</label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Any notes about this subscription..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface resize-none transition-colors focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 placeholder:text-secondary/60"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {subscription ? 'Save Changes' : 'Add Subscription'}
        </Button>
      </div>
    </form>
  );
}
