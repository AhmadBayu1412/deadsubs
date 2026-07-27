import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    },
  });

  const billingCycle = watch('billingCycle');

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
