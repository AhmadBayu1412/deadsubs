// Phase 13 — Add Subscription Modal
// Global modal for creating a new subscription.
import { useCallback } from 'react';
import { useSubscriptionStore } from '../viewmodels/subscriptionStore';
import { Modal } from './ui/Modal';
import { SubscriptionForm } from './ui/SubscriptionForm';
import { toast } from 'react-hot-toast';
import type { Subscription } from '../types/subscription';

export function AddSubscriptionModal() {
  const open = useSubscriptionStore((s: { addModalOpen: boolean }) => s.addModalOpen);
  const close = useSubscriptionStore((s: { closeAddModal: () => void }) => s.closeAddModal);
  const add = useSubscriptionStore((s: { add: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string> }) => s.add);

  const handleSubmit = useCallback(
    async (data: Parameters<typeof add>[0]) => {
      try {
        await add(data);
        toast.success(`${data.name} added`);
        close();
      } catch {
        toast.error('Failed to add subscription');
      }
    },
    [add, close],
  );

  return (
    <Modal open={open} onClose={close} title="Add subscription" size="md">
      <SubscriptionForm onSubmit={handleSubmit} onCancel={close} />
    </Modal>
  );
}
