// Phase 1: barrel re-export for cross-cutting UI components
// Re-exports all shared UI components from new canonical location
// at components/ui/ while keeping old import paths intact
export { Button } from '../../components/ui/Button';
export { Input } from '../../components/ui/Input';
export { Select } from '../../components/ui/Select';
export { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
export { Badge, CategoryBadge, StatusBadge } from '../../components/ui/Badge';
export { Modal, ConfirmDialog } from '../../components/ui/Modal';
export { Skeleton, SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton';
export { EmptyState } from '../../components/ui/EmptyState';
export { SubscriptionForm } from '../../components/ui/SubscriptionForm';
export { LoadingSpinner, LoadingOverlay, LoadingPage } from '../../components/ui/Loading';
export { ErrorMessage } from '../../components/ui/ErrorMessage';
export { Container } from '../../components/ui/Container';
export { PageTitle } from '../../components/ui/PageTitle';
// Phase 8: Domain components
export { MovieCard } from '../../components/subscriptions/MovieCardView';
export { SubscriptionCard } from '../../components/subscriptions/SubscriptionCard';
export { useMovieCardViewModel, type MovieCardViewModel } from '../../components/subscriptions/useMovieCardViewModel';
export {
  deriveMovieCardState,
  type MovieCardState,
} from '../../components/subscriptions/MovieCardModel';
