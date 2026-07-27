// MovieCard — Presentational view
// Renders a subscription as a rich, interactive card.
import { Heart, Calendar, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import {
  CategoryBadge,
  StatusBadge,
} from '../ui/Badge';
import type { MovieCardViewModel } from './useMovieCardViewModel';
import type { Subscription } from '../../models/subscription';

interface MovieCardProps {
  subscription: Subscription;
  viewModel: MovieCardViewModel;
}

export function MovieCard({
  subscription,
  viewModel,
}: Readonly<MovieCardProps>) {
  const { cardState, isFavourited, toggleFavourite, handleClick, handleCancel } =
    viewModel;

  const canCancel =
    subscription.status === 'active' || subscription.status === 'pending_cancel';

  // Compute renewal display outside JSX to avoid nested ternary
  const renewalDisplay = (() => {
    if (cardState.isOverdue) {
      return (
        <span className="flex items-center gap-1 text-accent-red font-medium">
          <AlertTriangle className="w-3 h-3" />
          Overdue by {Math.abs(cardState.daysUntilRenewal)} days
        </span>
      );
    }
    if (cardState.daysUntilRenewal === 0) {
      return <span className="text-accent-red font-medium">Renews today</span>;
    }
    return (
      <>
        Renews{' '}
        <span className="font-medium text-primary">{cardState.renewalLabel}</span>{' '}
        ({cardState.daysUntilRenewal}d)
      </>
    );
  })();

  return (
    <div
      className={clsx(
        'bg-surface rounded-xl border border-border shadow-sm',
        'flex flex-col gap-4 overflow-hidden',
        'transition-all duration-150',
      )}
    >
      {/* ── Image / category band ─────────────────────────────── */}
      <div
        className="h-20 relative overflow-hidden"
        style={{ backgroundColor: `${cardState.categoryColor}20` }}
        aria-hidden="true"
      >
        {/* Abstract pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, ${cardState.categoryColor} 0%, transparent 60%)`,
          }}
        />
        {/* Category badge — top-left */}
        <div className="absolute top-3 left-3">
          <CategoryBadge category={subscription.category} />
        </div>
        {/* Status badge — top-right */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={subscription.status} />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        {/* Name + price row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-primary leading-tight">
            {cardState.name}
          </h3>
          <div className="text-right flex-shrink-0">
            <p className="text-base font-bold text-primary">
              {cardState.formattedPrice}
            </p>
            <p className="text-xs text-secondary">{cardState.billingLabel}</p>
          </div>
        </div>

        {/* Notes */}
        {cardState.notes && (
          <p className="text-xs text-secondary leading-relaxed line-clamp-2">
            {cardState.notes}
          </p>
        )}

        {/* Renewal row */}
        <div className="flex items-center gap-2 mt-auto">
          <Calendar className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
          <span className="text-xs text-secondary">{renewalDisplay}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavourite();
            }}
            className={clsx(
              'gap-1.5',
              isFavourited && 'text-accent-red',
            )}
            aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Heart
              className={clsx('w-4 h-4', isFavourited ? 'fill-accent-red' : '')}
            />
            {isFavourited ? 'Saved' : 'Save'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            aria-label={`View ${cardState.name} details`}
          >
            Details
          </Button>

          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="ml-auto"
              aria-label={`Cancel ${cardState.name}`}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
