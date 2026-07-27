// Phase 7 — Favourites View
// Page displaying the user's favourited subscriptions.
import { PageTitle } from '../../components/ui/PageTitle';
import { SubscriptionCard } from '../../views/components';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useFavouritesViewModel } from './useFavouritesViewModel';

export function FavouritesView() {
  const vm = useFavouritesViewModel();
  const { state } = vm;

  if (state.isLoading) {
    return (
      <div className="space-y-6">
        <PageTitle title="Favourites" description="Your saved subscriptions" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (state.isEmpty) {
    return (
      <div>
        <PageTitle title="Favourites" description="Your saved subscriptions" />
        <EmptyState
          icon="subscriptions"
          title="No saved subscriptions"
          description="Mark subscriptions as favourites to see them here."
          action={{
            label: 'Browse subscriptions',
            onClick: vm.navigateToSubscriptions,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Favourites" description="Your saved subscriptions" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.favouritedSubscriptions.map((sub) => (
          <SubscriptionCard
            key={sub.id}
            subscription={sub}
            onClick={vm.navigateToSubscription}
          />
        ))}
      </div>
    </div>
  );
}
