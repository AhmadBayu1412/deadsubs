// Phase 12 — Shared SubscriptionCard
// Duplicated across Dashboard, Favourites, and SubscriptionList.
// Centralized here so all pages share one implementation.
import type { Subscription } from '../../models/subscription';
import { MovieCard, useMovieCardViewModel, type MovieCardViewModel } from './index';

interface SubscriptionCardProps {
  subscription: Subscription;
  onClick: (id: string) => void;
}

export function SubscriptionCard({ subscription, onClick }: SubscriptionCardProps) {
  const cardVm: MovieCardViewModel = useMovieCardViewModel({
    subscription,
    onClick: () => onClick(subscription.id),
  });
  return <MovieCard subscription={subscription} viewModel={cardVm} />;
}
