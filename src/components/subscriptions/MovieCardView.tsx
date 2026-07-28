// MovieCard — Presentational view
// Renders a subscription as a rich, interactive card.
import { Heart, Calendar, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
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
  const {
    cardState,
    isFavourited,
    isRecurring,
    isExpired,
    displayRenewalDate,
    daysUntilRenewal,
    toggleFavourite,
    toggleRecurring,
    handleClick,
    handleCancel,
  } = viewModel;

  const renewalLabel = format(displayRenewalDate, 'MMM d, yyyy');

  const canCancel =
    subscription.status === 'active' || subscription.status === 'pending_cancel';

  // Compute renewal display using displayRenewalDate (auto-renew aware)
  const renewalDisplay = (() => {
    if (isExpired) {
      return (
        <span className="flex items-center gap-1 text-accent-red font-medium">
          <AlertTriangle className="w-3 h-3" />
          Expired {Math.abs(daysUntilRenewal)} days ago
        </span>
      );
    }
    if (daysUntilRenewal === 0) {
      return <span className="text-accent-red font-medium">Renews today</span>;
    }
    return (
      <>
        Renews{' '}
        <span className="font-medium text-primary">{renewalLabel}</span>{' '}
        ({daysUntilRenewal}d)
      </>
    );
  })();

  // Renewal status label — recurring always shows auto-renew (even if date is past)
  const renewalStatusLabel = (() => {
    if (isExpired) {
      return 'Expired';
    }
    if (isRecurring) {
      return 'Auto-renew';
    }
    return 'One-time';
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

        {/* Auto-renew toggle */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {isRecurring ? (
              <RefreshCw className="w-4 h-4 text-accent-blue" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-secondary" />
            )}
            <span className="text-xs font-medium text-secondary">
              {renewalStatusLabel}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRecurring();
            }}
            className={clsx(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer',
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

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
