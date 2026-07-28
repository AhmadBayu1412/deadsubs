# Architecture — DeadSubs

This document explains the architecture in depth: why it's structured the way it is, how each layer fits together, and the reasoning behind key decisions.

---

## Overview

DeadSubs is a **React SPA** that runs entirely in the browser. It persists data locally using IndexedDB (via Dexie.js) and uses Firebase only for authentication. No backend server is required.

The guiding architectural principle is **MVVM (Model–View–ViewModel)** with a strong separation between:
- What data looks like (Model)
- How data is derived and mutated (ViewModel)
- How data is presented (View)

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│  View Layer — src/pages/*/*View.tsx                     │
│  Pure JSX. Receives serializable props. No store access.│
│  No direct IndexedDB or Firebase calls.                  │
└─────────────────────┬───────────────────────────────────┘
                      │ props (serializable state)
                      ▼
┌─────────────────────────────────────────────────────────┐
│  ViewModel Layer — src/pages/*/use*ViewModel.ts         │
│  React hooks. Compose Zustand stores + services.        │
│  Derive page state, handle form submissions,            │
│  trigger navigation, manage loading/error UI state.     │
└─────────────────────┬───────────────────────────────────┘
                      │ store actions + service calls
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Service Layer — src/services/                          │
│  firebase.ts    — Firebase init only                    │
│  authService.ts — signIn/signUp/logOut (ApiResult)      │
│  database.ts    — Dexie CRUD (raw IndexedDB ops)       │
│  favouriteService.ts — Subscription CRUD (ApiResult)    │
│  notificationService.ts — Notification CRUD + factories  │
│  analyticsService.ts — Pure computeAnalytics()           │
│  movieService.ts  — OMDb API wrapper (ApiResult)        │
│  dataService.ts    — Cross-service orchestration         │
│  errors.ts        — AppError + ApiResult<T>             │
└─────────────────────┬───────────────────────────────────┘
                      │ IndexedDB / HTTP / Firebase Auth
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Persistence — Dexie.js (IndexedDB)                    │
│  Subscriptions table: id (PK), userId, name, cost, ...  │
│  Notifications table: id (PK), type, subscriptionId, ...│
│  All subscription data is user-scoped (userId = UID)    │
└─────────────────────────────────────────────────────────┘
```

---

## Model Layer

### `src/types/subscription.ts`

The canonical domain model. Contains no logic — only interfaces, enums, and constant maps.

```typescript
// Key fields
interface Subscription {
  id: string;              // crypto.randomUUID()
  userId: string;          // Firebase UID — scopes data to the authenticated user
  name: string;
  cost: number;            // Always stored in cents (integer) to avoid float errors
  billingCycle: BillingCycle;
  category: Category;
  renewalDate: string;      // ISO date string YYYY-MM-DD
  status: Status;
  notes?: string;
  cancelTargetDate?: string;
  isFavourited: boolean;
  isRecurring: boolean;     // true = auto-renewing; false = one-time purchase
  createdAt: string;        // ISO timestamp
  updatedAt: string;
}
```

**Notable fields:**
- `userId` — Added in phase 13. All IndexedDB operations are filtered by `userId`, ensuring full data isolation between Firebase accounts.
- `isRecurring` — Added in phase 13. Distinguishes auto-renewing subscriptions from one-off purchases. Both are counted in analytics spending.
- `cost` is an integer (cents) — avoids floating-point rounding errors (`9.99 * 3 !== 29.97` in IEEE 754).

### `src/types/notification.ts`

```typescript
type NotificationType =
  | 'renewal_today'
  | 'renewal_tomorrow'
  | 'payment_overdue'
  | 'subscription_cancelled'
  | 'subscription_added'
  | 'subscription_cancelled_auto';

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  subscriptionId?: string;
  subscriptionName?: string;
  read: boolean;
  createdAt: string;
}
```

Notifications are generated programmatically (not user-authored). The `notificationService` factory functions construct them:
- `makeRenewalTodayNotification(subId, name)`
- `makeRenewalTomorrowNotification(subId, name)`
- `makeOverdueNotification(subId, name)`
- `makeSubscriptionAddedNotification(subId, name)`
- `makeSubscriptionCancelledNotification(subId, name)`

---

## Service Layer

### `errors.ts` — The Foundation

Every service function returns `ApiResult<T>` — a discriminated union that makes error handling explicit at every call site.

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

class AppError extends Error {
  readonly code: AppErrorCode; // 'network' | 'not_found' | 'unauthorized' | ...
  readonly isAppError = true as const;
  toResult<T>(): ApiResult<T>;
  static ok<T>(data: T): ApiResult<T>;
  static err(code, message): ApiResult<never>;
}
```

**Why not `throw`?** Thrown errors must be caught at the React boundary or bubble up as unhandled rejections. `ApiResult<T>` forces callers to handle both success and failure paths explicitly, eliminating silent failures.

### `database.ts` — Raw Dexie Operations

The only file that touches Dexie directly. All functions are `async` and return plain values. No `ApiResult` here — that wrapping happens in `favouriteService.ts`.

**Schema evolution:**
```typescript
db.version(1).stores({
  subscriptions: 'id, name, category, status, renewalDate, createdAt',
});
db.version(2).stores({
  subscriptions: 'id, name, category, status, renewalDate, createdAt, userId',
  notifications: 'id, type, subscriptionId, read, createdAt',
});
```

Version 2 added `userId` on subscriptions (phase 13) and the entire `notifications` table (phase 13). Dexie auto-migrates on first open.

**All subscription functions accept `userId` as the first parameter** and filter by it:
```typescript
export async function getAllSubscriptions(userId: string): Promise<Subscription[]> {
  return db.subscriptions.where('userId').equals(userId).sortBy('renewalDate');
}
```

### `favouriteService.ts` — Subscription CRUD

Wraps `database.ts` with `ApiResult` and `wrapNetwork`. This is the layer all ViewModels call.

### `analyticsService.ts` — Pure Computation

No side effects. No IndexedDB. Takes `subscriptions: Subscription[]` and returns a fully-derived `AnalyticsMetrics` object.

```typescript
const BILLING_MULTIPLIER = { weekly: 4.33, monthly: 1, yearly: 1/12 };

export function toMonthlyEquivalent(cents: number, cycle: BillingCycle): number {
  return Math.round(cents * BILLING_MULTIPLIER[cycle]);
}

export function computeAnalytics(subscriptions: Subscription[]): AnalyticsMetrics {
  // Pure derivation — no mutations, no side effects
}
```

**Why separate from the store?** Analytics is derived state. Storing it would create a synchronization problem: whenever a subscription changes, the analytics would need to be recalculated and re-stored. By computing it on read, there's always exactly one source of truth.

### `movieService.ts` — OMDb API

Wraps the OMDb REST API. Returns `ApiResult<OMDbSearchResult[]>` and `ApiResult<OMDbMovie>`. Currently used for movie poster lookups when adding subscriptions (optional field). This service was added to support richer subscription cards with poster art.

---

## ViewModel Layer — Zustand Stores

### `authStore.ts`

```typescript
interface AuthState {
  user: AuthUser | null;   // { uid, email } — set by Firebase callback
  loading: boolean;
  initialized: boolean;     // false until Firebase SDK initializes
  init: () => () => void;  // returns unsubscribe function
  login(email, pass): Promise<void>;
  register(email, pass): Promise<void>;
  logout(): Promise<void>;
}
```

**`initialized` flag** is critical. Without it, on first load the `user` will be `null` even for returning users while Firebase SDK asynchronously restores the session. The `ProtectedRoute` renders empty (`<></>`) during this window to prevent flash of auth page.

### `subscriptionStore.ts`

```typescript
interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  addModalOpen: boolean;
  openAddModal() / closeAddModal()
  fetchAll(): Promise<void>
  add(data): Promise<void>
  update(id, data): Promise<void>
  remove(id): Promise<void>
  clearAll(): Promise<void>
  importData(data): Promise<void>
  toggleFavourite(id): Promise<void>  // optimistic update + rollback
  toggleRecurring(id): Promise<void>  // optimistic update + rollback
  cancelSubscription(id): Promise<void>  // sets status='cancelled', cancelTargetDate=now
}
```

**Optimistic updates** for toggle actions: the store updates immediately, then reverts if the underlying service call fails.

```typescript
toggleFavourite(id: string) {
  const sub = subscriptions.find(s => s.id === id);
  if (!sub) return;
  const prev = sub.isFavourited;
  set(s => ({
    subscriptions: s.subscriptions.map(sub =>
      sub.id === id ? { ...sub, isFavourited: !prev } : sub
    ),
  }));
  const result = await favouriteService.updateSubscription(id, { isFavourited: !prev });
  if (!result.ok) {
    // Rollback
    set(s => ({
      subscriptions: s.subscriptions.map(sub =>
        sub.id === id ? { ...sub, isFavourited: prev } : sub
      ),
    }));
    toast.error('Failed to update');
  }
}
```

### `notificationStore.ts`

```typescript
interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  dropdownOpen: boolean;
  initialized: boolean;
  fetchAll(): Promise<void>
  addNotification(data): Promise<void>
  markRead(id): Promise<void>
  markAllRead(): Promise<void>
  deleteNotification(id): Promise<void>
  clearAll(): Promise<void>
  openDropdown() / closeDropdown()
}
```

`unreadCount` is derived — it's the count of notifications where `read === false`. It could be a selector, but it's stored directly for simplicity (notifications are a small list, typically < 50 items).

---

## ViewModel Layer — Page Hooks

Each page has a `use{Page}ViewModel.ts` hook that composes:
1. Zustand store state and actions
2. Derived state (via `*Model.ts` pure functions)
3. Loading / error state
4. Form handling (via React Hook Form)
5. Navigation (via React Router)

Example pattern (`useDashboardViewModel.ts`):
```typescript
export function useDashboardViewModel() {
  const { subscriptions, loading } = useSubscriptionStore();
  const { user } = useAuthStore();

  const state = useMemo(() =>
    deriveDashboardState(subscriptions),
    [subscriptions]
  );

  const addSubscription = async (data: NewSubscription) => {
    await subscriptionStore.add(data);
  };

  return { state, loading, user, addSubscription };
}
```

The `derive*` functions in `*Model.ts` are pure — they take the raw store state and return the serializable props for the view. This makes testing trivial: pass sample data, assert the derived shape.

---

## View Layer

Views are pure JSX components. They receive only serializable props from the ViewModel hook. They do not:
- Call Zustand stores directly
- Call services directly
- Use React Router hooks directly (except for `<Link>` elements)

```typescript
// Bad — violates MVVM
export function DashboardView() {
  const { subscriptions } = useSubscriptionStore(); // ❌ Direct store access
  const { navigate } = useNavigate();               // ❌ Direct router access
  // ...
}

// Good — all logic in the hook
export function DashboardView({ subscriptions, loading, onAdd }: DashboardViewProps) {
  // ...
}
```

This separation makes views trivially testable (just pass props) and ensures all business logic lives in version-controlled, testable TypeScript.

---

## MVVM Per Page

Each page has exactly three files:

```
src/pages/Dashboard/
├── DashboardModel.ts        # State types + pure derive function
├── DashboardView.tsx        # Pure JSX, receives props only
├── useDashboardViewModel.ts # Hook: store + service composition
└── index.ts                 # Barrel re-export
```

### `*Model.ts` — Domain Types + Pure Derivation

```typescript
// DashboardModel.ts
export interface DashboardState {
  stats: { totalActive, totalMonthly, upcomingRenewals, ... };
  recentSubscriptions: Subscription[];
  loading: boolean;
}

export function deriveDashboardState(
  subscriptions: Subscription[],
): DashboardState {
  const active = subscriptions.filter(s => s.status === 'active');
  const upcoming = active
    .filter(s => {
      const days = daysUntil(s.renewalDate);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

  const totalMonthly = active.reduce((sum, s) =>
    sum + toMonthlyEquivalent(s.cost, s.billingCycle), 0
  );

  return { stats: { totalActive: active.length, totalMonthly, upcomingRenewals: upcoming }, ... };
}
```

### `*View.tsx` — Presentation Only

```typescript
// DashboardView.tsx
export function DashboardView({ stats, recentSubscriptions, loading }: DashboardViewProps) {
  if (loading) return <LoadingPage />;
  return (
    <Container>
      <PageTitle>Dashboard</PageTitle>
      <StatCard label="Monthly Spend" value={formatCents(stats.totalMonthly)} />
      ...
    </Container>
  );
}
```

---

## Authentication Architecture

```
App.tsx
├── QueryClientProvider
├── AppErrorBoundary
├── AuthInitializer        ← calls authStore.init() on mount
├── NotificationInitializer ← runs after auth resolves
└── AppRouter
    └── ProtectedRoute     ← redirects / → /auth if !user
```

**`AuthInitializer`** (inline in `App.tsx`) calls `authStore.init()`, which sets up Firebase's `onAuthStateChanged` listener. When the callback fires, it sets `user` in the store. The `init()` function returns an unsubscribe function (called on cleanup).

**`NotificationInitializer`** (inline in `App.tsx`) is rendered after `AuthInitializer`. It calls `checkAndGenerateRenewalNotifications()` — iterating active subscriptions and creating notifications for any that are overdue, due today, or due tomorrow. This runs on every app load.

---

## Routing

React Router v7 (`createBrowserRouter`). Flat structure — no nested route objects beyond the protected shell.

```typescript
createBrowserRouter([
  { path: '/auth', element: <AuthView /> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardView /> },
      { path: 'subscriptions', element: <SubscriptionListView /> },
      { path: 'subscriptions/:id', element: <SubscriptionDetailView /> },
      { path: 'favourites', element: <FavouritesView /> },
      { path: 'cancel-assistant', element: <CancelAssistantView /> },
      { path: 'analytics', element: <AnalyticsView /> },
      { path: 'settings', element: <SettingsView /> },
    ],
  },
]);
```

**Why `createBrowserRouter` (data router)?** It enables future data loading via `loader()` functions and better handling of error boundaries at the route level. Even if loaders aren't used yet, the API is ready for it.

---

## State Management Strategy

Three layers, each with a specific purpose:

| Layer | Tool | What it holds | Why |
|---|---|---|---|
| Server state | React Query | Per-query cached data | Deduplication, background refetch, loading states |
| Global app state | Zustand | Auth user, subscriptions list, notifications | Shared across pages, needs subscriptions updates |
| Local UI state | `useState` / `useDisclosure` | Modal open/close, dropdown state | Not shared, no persistence needed |

Zustand is used for subscriptions and notifications (shared across pages, mutated from multiple places) even though React Query could cache them. The reasoning: these are primary state (not server-cached data in the traditional sense) and Zustand's synchronous API makes optimistic updates straightforward.

---

## CSS Architecture

**Tailwind CSS v3** with a thin design-token layer in `tailwind.config.js`. No CSS-in-JS, no CSS modules, no separate `.css` files per component.

**Why Tailwind?** Consistent spacing scale, easy responsive design, purgeable in production (small bundle), and the design token layer (`bg`, `surface`, `border`, etc.) prevents the "built with Tailwind" look.

**Sidebar transitions** use **inline styles** (not Tailwind utility classes) for precise control:

```tsx
<div
  style={{
    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
  }}
>
```

This was migrated from Tailwind in phase 14 because Tailwind's transition utilities didn't support the cubic-bezier curve precisely, and the dynamic `translateX` value required arbitrary Tailwind values (`-translate-x-full`) that added noise.

**CSS custom properties** are defined as Tailwind theme tokens, not raw CSS variables. This keeps the token definitions in one place (`tailwind.config.js`).

---

## Error Handling Strategy

1. **`ApiResult<T>` at the service boundary** — every service function returns this type. Callers cannot ignore errors.
2. **ViewModels handle `!result.ok`** — show toast, revert optimistic update, or set error state.
3. **`AppErrorBoundary`** — catches any React render errors, displays a fallback UI with a retry option. Prevents white screens.
4. **`try/catch` in async handlers** — wrap `await` calls that aren't behind service functions (e.g., in click handlers).

---

## Data Isolation

All subscription and notification data is scoped to `userId = Firebase UID`. This was added in phase 13 to support multi-user scenarios.

**Implementation:** Every `database.ts` function that reads or writes subscriptions accepts `userId: string` as the first argument. The store passes `authStore.user.uid`. There is no server-side enforcement — this is client-side isolation only.

---

## Performance Considerations

- **Dexie IndexedDB** — all queries are indexed by `userId` (not filtered in-memory), ensuring fast queries even with 500+ subscriptions.
- **Optimistic updates** — UI updates immediately on favourite/recurring toggles, no waiting for IndexedDB write.
- **Analytics computed on read** — no stale analytics state, no synchronization overhead.
- **React Query** — configured with `staleTime: 60_000` (60 seconds), `retry: 1` for API calls. Local IndexedDB reads don't go through React Query (they go directly through the service).
- **No virtualized list** — current implementation renders all subscription cards directly. With > 100 subscriptions, a virtualized list (e.g., `react-virtual`) would be needed.
