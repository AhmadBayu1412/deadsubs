// Phase 13 — SubscriptionDetail ViewModel
// Loads a subscription by ID, exposes edit/delete/cancel actions.
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../viewmodels/subscriptionStore';
import { useAuthStore } from '../../viewmodels/authStore';
import type { Subscription, NewSubscription } from '../../types/subscription';
import {
  type SubscriptionDetailState,
  deriveSubscriptionDetailState,
} from './SubscriptionDetailModel';

export interface SubscriptionDetailViewModel {
  state: SubscriptionDetailState;
  openEdit: boolean;
  setOpenEdit: (open: boolean) => void;
  editSubscription: (data: NewSubscription) => Promise<void>;
  deleteSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  navigateBack: () => void;
}

export function useSubscriptionDetailViewModel(): SubscriptionDetailViewModel {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const fetchAll = useSubscriptionStore((s) => s.fetchAll);
  const update = useSubscriptionStore((s) => s.update);
  const remove = useSubscriptionStore((s) => s.remove);
  const cancelSubscription = useSubscriptionStore((s) => s.cancelSubscription);
  const user = useAuthStore((s) => s.user);

  const subscription = useMemo<Subscription | null>(
    () => subscriptions.find((s) => s.id === id) ?? null,
    [subscriptions, id],
  );

  const state = useMemo<SubscriptionDetailState>(
    () => deriveSubscriptionDetailState(subscription, false),
    [subscription],
  );

  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    if (user && !subscriptions.length) fetchAll();
  }, [user, subscriptions.length, fetchAll]);

  const editSubscription = useCallback(
    async (data: NewSubscription) => {
      if (!id) return;
      await update(id, data);
      setOpenEdit(false);
    },
    [id, update],
  );

  const deleteSubscription = useCallback(async () => {
    if (!id) return;
    await remove(id);
    navigate('/subscriptions');
  }, [id, remove, navigate]);

  const handleCancelSubscription = useCallback(async () => {
    if (!id) return;
    await cancelSubscription(id);
    navigate('/subscriptions');
  }, [id, cancelSubscription, navigate]);

  const navigateBack = useCallback(() => navigate('/subscriptions'), [navigate]);

  return {
    state,
    openEdit,
    setOpenEdit,
    editSubscription,
    deleteSubscription,
    cancelSubscription: handleCancelSubscription,
    navigateBack,
  };
}
