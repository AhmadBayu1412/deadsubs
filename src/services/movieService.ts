// Phase 10 — Movie Service
// OMDb API wrapper using native fetch.
// Docs: https://www.omdbapi.com/
import { AppError, type ApiResult } from './errors';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OMDbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}

export interface OMDbMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  totalSeasons?: string;
  Response: 'True' | 'False';
  Error?: string;
}

interface OMDbSearchSuccess {
  Search: OMDbSearchResult[];
  totalResults: string;
  Response: 'True';
}

interface OMDbSearchError {
  Search?: never;
  totalResults?: never;
  Response: 'False';
  Error: string;
}

type OMDbSearchResponse = OMDbSearchSuccess | OMDbSearchError;

// ── Client ─────────────────────────────────────────────────────────────────────

const OMDB_BASE = 'https://www.omdbapi.com/';
const apiKey = import.meta.env.VITE_OMDB_API_KEY ?? '';

function buildUrl(params: Record<string, string>): string {
  const url = new URL(OMDB_BASE);
  url.searchParams.set('apikey', apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

// ── API functions ─────────────────────────────────────────────────────────────

export interface SearchOptions {
  query: string;
  year?: string;
  type?: 'movie' | 'series' | 'episode';
  page?: number;
}

export async function searchMovies(
  opts: SearchOptions,
): Promise<ApiResult<{ results: OMDbSearchResult[]; totalResults: number }>> {
  try {
    const url = buildUrl({
      s: opts.query,
      ...(opts.year ? { y: opts.year } : {}),
      ...(opts.type ? { type: opts.type } : {}),
      ...(opts.page ? { page: String(opts.page) } : {}),
    });

    const res = await fetch(url);
    if (!res.ok) {
      return AppError.err('network', `Request failed (${res.status}). Try again.`);
    }

    const json = (await res.json()) as OMDbSearchResponse;

    if (json.Response === 'False') {
      return AppError.err('not_found', json.Error ?? 'No results found.');
    }

    const results = json.Search;
    const totalResults = Number(json.totalResults) || results.length;

    return AppError.ok({ results, totalResults });
  } catch {
    return AppError.err('network', 'Could not reach OMDb. Check your connection.');
  }
}

export async function getMovieById(
  imdbID: string,
): Promise<ApiResult<OMDbMovie>> {
  try {
    const url = buildUrl({ i: imdbID, plot: 'full' });
    const res = await fetch(url);
    if (!res.ok) {
      return AppError.err('network', `Request failed (${res.status}). Try again.`);
    }

    const json = (await res.json()) as OMDbMovie;

    if (json.Response === 'False') {
      return AppError.err('not_found', json.Error ?? 'Movie not found.');
    }

    return AppError.ok(json);
  } catch {
    return AppError.err('network', 'Could not reach OMDb. Check your connection.');
  }
}
