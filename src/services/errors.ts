// Phase 10 — Error types and utilities
// All services use this module for standardized error handling.
// Every service function returns ApiResult<T> or throws AppError.
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

// ── AppError ─────────────────────────────────────────────────────────────────

export type AppErrorCode =
  | 'network'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'server'
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly isAppError = true as const;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }

  toResult<T>(_data?: T): ApiResult<T> {
    return { ok: false, error: this };
  }

  static ok<T>(data: T): ApiResult<T> {
    return { ok: true, data };
  }

  static err(code: AppErrorCode, message: string): ApiResult<never> {
    return { ok: false, error: new AppError(code, message) };
  }
}

// ── Network error helper ───────────────────────────────────────────────────────

export function wrapNetwork<T>(fn: () => Promise<T>): Promise<ApiResult<T>> {
  return fn().then(AppError.ok, (err: unknown) => {
    if (err instanceof AppError) return err.toResult<T>();
    return AppError.err('network', 'Network error. Check your connection.');
  });
}

// ── Type guard ─────────────────────────────────────────────────────────────────

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).isAppError === true
  );
}
