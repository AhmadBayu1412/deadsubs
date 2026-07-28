# Lessons Learned — DeadSubs

Ten engineering lessons distilled from building DeadSubs across 14 phases. Each lesson includes the mistake or insight, a code example from the project, and what to do differently (or keep doing).

---

## Lesson 1 — Store Money as Integers (Cents), Not Floats

**Mistake:** Not establishing this convention on day one would have meant retrofitting all `cost` fields across the codebase.

Floating-point arithmetic is unreliable for currency. `9.99 + 9.99 + 9.99` in IEEE 754 floats produces `29.969999...` not `29.97`. The bug hides until a user has 3+ subscriptions and the displayed total is off by a cent — a trust-destroying moment for a financial app.

**Fix applied:**
```typescript
// src/types/subscription.ts
interface Subscription {
  cost: number; // always cents — e.g., 999 = $9.99
}

// src/utils/index.ts
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

// src/services/analyticsService.ts
const BILLING_MULTIPLIER: Record<BillingCycle, number> = {
  weekly: 4.33,   // ~4.33 weeks/month
  monthly: 1,
  yearly: 1 / 12,  // divide by 12 for monthly equivalent
};

export function toMonthlyEquivalent(cents: number, cycle: BillingCycle): number {
  return Math.round(cents * BILLING_MULTIPLIER[cycle]);
}
```

**Rule:** Currency is always an integer (cents). Convert to dollars only at the display boundary. The rest of the codebase (calculations, storage, comparisons) works in cents.

---

## Lesson 2 — Use a Discriminated Union for Error Handling at Service Boundaries

**Mistake:** Using `throw` for service errors (requires try/catch everywhere) or nullable returns (no error context).

`throw` in async code must be caught or it becomes an unhandled promise rejection. Nullable returns carry no information about *why* something failed. Both patterns lead to silent failures or missing error context in production.

**Fix applied:**
```typescript
// src/services/errors.ts
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly isAppError = true as const;
  // ...
}

// src/services/favouriteService.ts
export async function addSubscription(
  userId: string,
  data: NewSubscription
): Promise<ApiResult<string>> {
  return wrapNetwork(async () => {
    const id = await database.addSubscription(userId, data);
    return AppError.ok(id);
  });
}

// src/viewmodels/subscriptionStore.ts
async add(data: NewSubscription): Promise<void> {
  const result = await favouriteService.addSubscription(userId!, data);
  if (!result.ok) {
    this.error = result.error.message;
    return;
  }
  await this.fetchAll();
}
```

**Rule:** Every async service function returns `ApiResult<T>`. Every caller checks `result.ok`. Error codes (`network`, `not_found`, `validation`, etc.) let callers branch on error type.

---

## Lesson 3 — Always Add an `initialized` Flag for Async Initialization

**Mistake:** Not having it causes a "flash of auth page" on every returning visit.

On first load, Firebase's `onAuthStateChanged` fires asynchronously. During that window, `user === null` even for returning users. Without an `initialized` flag, any auth guard that redirects on `!user` fires immediately, showing the auth page for 1-2 seconds before Firebase resolves.

**Fix applied:**
```typescript
// src/viewmodels/authStore.ts
interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean; // ← added specifically for this purpose
  // ...
}

// src/routes/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();

  if (!initialized) return <></>;  // ← renders nothing while Firebase loads
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
```

**Rule:** Any async initialization (auth, storage, device sensors) needs a `initialized: boolean` flag. Render nothing until it's `true`. This prevents race conditions between initialization and guards/redirects.

---

## Lesson 4 — Scope All Persistence to the Authenticated User

**Mistake:** Not doing this from day one meant a database migration was needed mid-project.

Starting without user scoping works fine in a prototype. But the retrofit cost (changing every database function signature, updating every service call) is high. Firebase Auth was added before user scoping was, so the migration was forced.

**Fix applied:**
```typescript
// src/services/database.ts
// Every function that touches subscriptions accepts userId as first argument
export async function getAllSubscriptions(userId: string): Promise<Subscription[]> {
  return db.subscriptions.where('userId').equals(userId).sortBy('renewalDate');
}

export async function addSubscription(
  userId: string,  // ← always first
  data: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.subscriptions.add({ ...data, id, userId, createdAt: now, updatedAt: now });
  return id;
}
```

**Rule:** If the app has authentication, scope persistence immediately. Retrofit cost grows with data volume.

---

## Lesson 5 — Use UTC Midnight Epoch Math for Date Comparisons Across Timezones

**Mistake:** `differenceInDays(new Date(sub.renewalDate), new Date())` produces different results in different timezones.

A subscription renewing on July 15 at midnight UTC could appear as "today" or "yesterday" depending on whether the user is in UTC+5 or UTC-8. The `Date` constructor interprets a date string like `"2024-07-15"` in local time, but IndexedDB stores it as-is — creating an offset mismatch.

**Fix applied:**
```typescript
// src/utils/index.ts
export function daysUntil(renewalDate: string): number {
  // Explicitly append UTC midnight to avoid timezone offset bugs.
  // "2024-07-15" → "2024-07-15T00:00:00.000Z"
  const renewalEpoch = new Date(renewalDate + 'T00:00:00.000Z').getTime();
  const nowEpoch = Date.now();
  return Math.floor((renewalEpoch - nowEpoch) / 86_400_000);
}

// src/services/analyticsService.ts (30-day renewal timeline)
const today = new Date();
const timeline = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + i);  // ← always use UTC methods
  return {
    date: date.toISOString().split('T')[0],
    renewals: active.filter(s => {
      const rDate = new Date(s.renewalDate + 'T00:00:00.000Z');
      return rDate.toISOString().split('T')[0] === date.toISOString().split('T')[0];
    }),
  };
});
```

**Rule:** Store dates as ISO strings without time (`YYYY-MM-DD`). Always append `T00:00:00.000Z` when parsing. Use UTC methods (`getUTCDate`, `setUTCDate`) for all date arithmetic.

---

## Lesson 6 — Optimistic Updates with Rollback Are Worth the Effort

**Mistake:** Without optimistic updates, favourite toggle clicks feel sluggish — IndexedDB writes take 50-200ms.

Every synchronous-feeling interaction that actually waits for an async IndexedDB write trains the user to tap multiple times, creating duplicate requests. Optimistic updates fix this at the cost of ~15 extra lines of rollback logic.

**Fix applied:**
```typescript
// src/viewmodels/subscriptionStore.ts
async toggleFavourite(id: string): Promise<void> {
  const sub = this.subscriptions.find(s => s.id === id);
  if (!sub) return;

  const previous = sub.isFavourited;
  // Optimistic update — immediate UI response
  this.subscriptions = this.subscriptions.map(s =>
    s.id === id ? { ...s, isFavourited: !previous } : s
  );

  const result = await favouriteService.updateSubscription(id, { isFavourited: !previous });
  if (!result.ok) {
    // Rollback on failure — restore previous state
    this.subscriptions = this.subscriptions.map(s =>
      s.id === id ? { ...s, isFavourited: previous } : s
    );
    toast.error('Failed to update favourite');
  }
}
```

**Rule:** For any user-triggered mutation (toggle, like, favourite), optimistically update the local state immediately. Roll back if the write fails. The UX improvement is significant for storage-bound operations.

---

## Lesson 7 — Derive State Rather Than Store It

**Mistake:** Storing `unreadCount` as a separate field that can get out of sync with `notifications`.

`notificationStore` stores both `notifications: AppNotification[]` and `unreadCount: number`. This is redundant state — `unreadCount` is always `notifications.filter(n => !n.read).length`. If a bug ever updates one but not the other, the UI shows a stale count.

**What we did:**
```typescript
// src/viewmodels/notificationStore.ts
interface NotificationState {
  notifications: AppNotification[];
  // unreadCount is derived — no separate field needed
  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

// In the component:
const { notifications } = useNotificationStore();
const unreadCount = notifications.filter(n => !n.read).length; // derived at render site
```

**Rule:** If a value can be computed from other state, compute it. Only store data that has no authoritative source. Derivation is cheap; synchronization bugs are expensive.

---

## Lesson 8 — Keep Views Pure — No Store Access, No Service Calls

**Mistake:** Early views directly called Zustand stores. This makes views harder to test and creates hidden dependencies.

Once a view calls a store directly, every test for that view must mock the store. As the store's shape evolves, every view that depends on it needs updating. Keeping views as pure functions of their props makes them zero-dependency.

**Fix applied:**
```typescript
// Bad — view has hidden dependencies
function SubscriptionListView() {
  const { subscriptions } = useSubscriptionStore(); // ← hidden dependency
  const { toggleFavourite } = useSubscriptionStore(); // ← two dependencies
  // ...
}

// Good — view receives everything as props
interface SubscriptionListViewProps {
  subscriptions: Subscription[];
  loading: boolean;
  onToggleFavourite: (id: string) => void;
  // ...
}

function SubscriptionListView({
  subscriptions,
  loading,
  onToggleFavourite,
}: SubscriptionListViewProps) {
  // ...
}

// The ViewModel connects stores to props
function useSubscriptionListViewModel() {
  const store = useSubscriptionStore();
  return {
    subscriptions: store.subscriptions,
    loading: store.loading,
    onToggleFavourite: store.toggleFavourite.bind(store),
  };
}
```

**Rule:** Views receive props. ViewModels (hooks) call stores. This boundary makes views unit-testable with a single `render(<View {...props} />)` call.

---

## Lesson 9 — Use Barrel Files to Define a Module's Public API

**Mistake:** Without barrels, every consumer has long import paths. With wrong barrels (circular imports), the build breaks.

Barrels serve as both convenience (shorter imports) and documentation (the `index.ts` shows exactly what a module exports). The risk is circular dependencies — barrels must only re-export from their own layer, never import across layer boundaries.

**Fix applied:**
```typescript
// src/pages/Dashboard/index.ts — the barrel
export { DashboardView } from './DashboardView';
export type { DashboardViewProps } from './DashboardView';
export { useDashboardViewModel } from './useDashboardViewModel';
export type { DashboardState } from './DashboardModel';

// Consumer (short, stable import):
import { DashboardView, useDashboardViewModel } from '@/pages/Dashboard';

// src/components/ui/index.ts — barrel for all shared primitives
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader, CardTitle, CardContent } from './Card';
// ... all 14 UI components
```

**Rule:** Every `pages/*/` directory and `components/ui/` has an `index.ts` barrel. Barrels re-export from sibling files only — never import from `services/`, `viewmodels/`, or other layer directories. This prevents circular dependency chains.

---

## Lesson 10 — Phase Comments Anchor Future Debugging

**Mistake:** Without phase comments, it was impossible to tell when a file was created or why.

Months later, a developer (or the original developer) encountering `// Phase 13 — Subscription domain types — moved from models/subscription.ts` can immediately understand the file's history. Without it, they'd have to `git log --follow` the file to reconstruct context.

**Fix applied:**
```typescript
// Phase 10 — Error types and utilities
// All services use this module for standardized error handling.
// Every service function returns ApiResult<T> or throws AppError.

// Phase 13 — Subscription domain types — moved from models/subscription.ts
// as part of Phase 1 restructure

// Phase 14 — MovieCard — derived state and helpers
// The View receives flat primitives; this module computes them from Subscription.
```

**Rule:** Every source file begins with a `// Phase N` comment. This is the single cheapest documentation investment in any project — it costs nothing to write and saves significant git archaeology time.
