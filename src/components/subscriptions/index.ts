// MovieCard MVVM barrel — Phase 8
// Canonical export point for all subscription card components.
export {
  deriveMovieCardState,
  type MovieCardState,
} from './MovieCardModel';

export {
  useMovieCardViewModel,
  type MovieCardViewModel,
} from './useMovieCardViewModel';

export { MovieCard } from './MovieCardView';
