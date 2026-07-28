# Prompt History — DeadSubs

A chronological record of architectural decisions, trade-offs, and design choices made across the development sessions. Decisions are ordered by phase. Each entry captures what changed, why, alternatives considered, and trade-offs.

---

## Phase 1 — Project Initialization & Core Structure

### P1.1 — Stack Selection: React + Vite + TypeScript

**What changed:** Scaffolded a new Vite + React + TypeScript project.

**Why:** Vite provides fast HMR and a lean build pipeline. TypeScript was chosen over plain JS for long-term maintainability — the subscription domain has many typed objects (Subscription, Notification, etc.) that benefit from compile-time checking.

**Alternatives:** Create React App (deprecated), Next.js (overkill for a client-only SPA), Parcel.

**Trade-offs:** Vite's dependency on Node.js for the dev server means no zero-install deployment option. For this app (pure client-side), that was an acceptable trade-off.

---

### P1.2 — Styling: Tailwind CSS

**What changed:** Chose Tailwind CSS v3 over CSS Modules or styled-components.

**Why:** Tailwind's utility-first approach enables rapid UI development with a consistent spacing/color scale. The custom design token layer in `tailwind.config.js` (`bg`, `surface`, `border`, etc.) prevents the generic Tailwind look. PostCSS purge ensures unused styles are stripped at build time.

**Alternatives:** CSS Modules (native, no extra runtime), styled-components (CSS-in-JS, larger bundle), plain CSS (no constraints, easy to become inconsistent).

**Trade-offs:** HTML templates become class-heavy (`className="text-sm font-medium text-secondary"`). The design token layer mitigates this but doesn't eliminate it. Bundle size is small due to purge, but runtime is slightly heavier than zero-runtime CSS approaches.

---

### P1.3 — Project Directory Structure

**What changed:** Adopted MVVM structure from the start:
```
src/
├── models/          # Interfaces, types
├── services/        # External integrations
├── viewmodels/      # Zustand stores
├── views/
│   ├── components/  # Shared UI
│   └── pages/      # Route pages
├── routes/         # Router
└── utils/          # Pure helpers
```

**Why:** MVVM provides a clear separation between domain logic (services), state management (viewmodels), and presentation (views). It scales well as the app grows — new pages fit the pattern without ad-hoc architecture.

**Alternatives:** MVC (Controller maps less cleanly to React's hook model), Redux (overkill for this app's complexity), no pattern (rapid initial velocity, high long-term cost).

**Trade-offs:** More initial boilerplate per page (3 files instead of 1). The payoff comes at 5+ pages — by phase 14 with 8 pages, the consistency pays for itself.

---

### P1.4 — Data Model: Cents Instead of Floats

**What changed:** `cost: number` stores dollars × 100 (integer cents), not floating-point dollars.

```typescript
// Before (bad)
cost: number; // e.g., 9.99

// After (good)
cost: number; // e.g., 999 (cents)
```

**Why:** Floating-point arithmetic is imprecise (`0.1 + 0.2 !== 0.3`). Currency arithmetic must be exact. Integer cents eliminate rounding errors at the cost of two display conversions (`999 / 100 = $9.99`).

**Alternatives:** Store as cents only, store as float with `toFixed(2)` everywhere, use a `Decimal` library (adds a dependency).

**Trade-offs:** Every `formatCurrency()` call must divide by 100. The call sites are centralized in `utils/index.ts` and `MovieCardModel.ts`, so this is a minor maintenance concern.

---

### P1.5 — Routing: React Router v6 → v7 (createBrowserRouter)

**What changed:** Used `createBrowserRouter` (data router) instead of `<Routes>` + `<Route>` component-based routing.

**Why:** Data routers enable future `loader()` functions for data fetching at the route level, and provide better error boundary integration. Even though loaders aren't used yet, the API is ready for it.

**Alternatives:** Component-based `<Routes>` (simpler, no future extensibility).

**Trade-offs:** Slightly more verbose setup. The `RouterProvider` must be rendered once at the app root.

---

## Phase 2 — Database & Services

### P2.1 — Persistence: Dexie (IndexedDB) Over localStorage

**What changed:** Chose Dexie.js (IndexedDB ORM) over `localStorage`.

**Why:** IndexedDB handles structured data with complex queries efficiently. Dexie provides a Promise-based API that feels like a real database. `localStorage` is synchronous and limited to ~5MB with string-only storage (requires JSON serialize/deserialize).

**Alternatives:** `localStorage` (simple, synchronous, size-limited), `IndexedDB` directly (verbose, callback-based), `idb` (lighter than Dexie), server-side (complex, requires backend).

**Trade-offs:** IndexedDB is asynchronous, which adds complexity to reads/writes vs. `localStorage`. Dexie is ~50KB gzipped — heavier than raw `localStorage` but acceptable for a subscription app. Data is browser-local (no sync across devices).

---

### P2.2 — Dexie Schema Evolution: userId Added in v2

**What changed:** Database schema version 2 added `userId` index to subscriptions table and created a new `notifications` table.

```typescript
db.version(1).stores({ subscriptions: 'id, name, category, status, renewalDate, createdAt' });
db.version(2).stores({
  subscriptions: 'id, name, category, status, renewalDate, createdAt, userId',
  notifications: 'id, type, subscriptionId, read, createdAt',
});
```

**Why:** Phase 13 added Firebase Auth scoping. All subscription and notification data must be isolated per Firebase UID. Dexie's multi-version schema migration handles this automatically on first open.

**Alternatives:** Separate IndexedDB databases per user (complex), server-side storage (adds backend).

**Trade-offs:** Dexie migration is automatic but irreversible in production — test the migration path carefully. Version 1 users lose their data on first upgrade (acceptable for v1).

---

### P2.3 — Error Handling: ApiResult Discriminated Union

**What changed:** All service functions return `ApiResult<T>` instead of throwing or returning nullable types.

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };
```

**Why:** Thrown errors must be caught at the React boundary or bubble as unhandled rejections. Nullable returns (`T | null`) don't carry error context. `ApiResult<T>` makes both success and failure explicit at every call site.

**Alternatives:** `throw` (silent failures if not caught), `null` returns (no error context), `Result` monad from a library (adds dependency).

**Trade-offs:** Every service call site must check `result.ok`. This is verbose but deliberate — it forces error handling. `AppError` extends `Error` so it can be thrown if needed (for critical failures that should not be recovered from).

---

## Phase 3–6 — Feature Pages

### P3.1 — Zustand Over Redux for State Management

**What changed:** Chose Zustand over Redux Toolkit.

**Why:** Zustand has a minimal API, no boilerplate (no reducers/actions/actionTypes), supports middleware, and has built-in devtools. It's sufficient for this app's complexity.

**Alternatives:** Redux Toolkit (more structure, better devtools, heavier), `useState` + Context (sufficient for simpler apps, but less ergonomic for cross-page state like subscriptions list).

**Trade-offs:** Redux's ecosystem (sagas, persist middleware) is richer. For this app, Zustand's simplicity wins. If the app grows to need time-travel debugging or complex async orchestration, Redux would be worth reconsidering.

---

### P3.2 — MVVM Per Page: 3-File Pattern

**What changed:** Each page has exactly three files:
1. `*{Page}Model.ts` — Domain state types + pure derivation functions
2. `*{Page}View.tsx` — Pure JSX, props only
3. `use{Page}ViewModel.ts` — Hook composing stores + services

**Why:** The split ensures views are testable (just pass props), derivation is testable (pure functions), and stateful logic is centralized in hooks. The `derive*State()` functions in `*Model.ts` are the critical interface between logic and presentation.

**Alternatives:** Single file per page (simpler, harder to test), full Redux (more structure, more boilerplate).

**Trade-offs:** Three files per page adds ~30 lines of boilerplate. The pattern pays off when a page has complex derived state or multiple interacting UI states.

---

### P3.3 — React Hook Form + Zod for Forms

**What changed:** Used React Hook Form (RHF) + Zod for all form handling and validation.

**Why:** RHF provides uncontrolled inputs (no re-renders on keystroke), and Zod schemas provide runtime validation that matches TypeScript types. Combined with `@hookform/resolvers`, validation is type-safe and declarative.

**Alternatives:** Controlled inputs + manual `useState` (verbose, causes re-renders), `react-hook-form` alone (no runtime type safety), server-side validation (inappropriate for client-side form UX).

**Trade-offs:** Zod adds ~12KB to the bundle. RHF has a learning curve for developers unfamiliar with uncontrolled inputs. For a subscription app with 10+ fields, this trade-off is worth it.

---

## Phase 7 — Structure Reorganization

### P4.1 — Split `src/views/` → `src/pages/` + `src/components/`

**What changed:** Moved page components from `src/views/pages/` to `src/pages/`. Split UI primitives from page-specific components.

**Why:** `views/` was doing double duty (pages + shared components). Splitting into `pages/` (route-level) and `components/` (shared) is more idiomatic and reduces confusion about where to put new files.

**Alternatives:** Keep `views/` flat (convention is less clear), use a different directory name.

**Trade-offs:** All import paths that referenced `views/` needed updating. Renamed `AppShell.tsx` to `AppLayout.tsx` (more descriptive of its role as a shell, not a view).

---

## Phase 8–9 — UI Polish & Barrel Exports

### P5.1 — Barrel Exports for Convenience

**What changed:** Added `index.ts` barrel files in every `pages/*/` directory and `components/ui/`.

**Why:** Barrels allow `import { Button } from '@/components/ui'` instead of `import { Button } from '@/components/ui/Button'`. They reduce import noise in consumers and make refactoring easier (change internal file structure without changing consumer imports).

**Alternatives:** Direct per-file imports (verbose, more import lines), no barrels (each file is explicit, but barrel files serve as documentation of a module's public API).

**Trade-offs:** Barrels can cause circular import issues and can hurt tree-shaking if not careful. In this project, all barrels re-export from the same layer (no cross-layer imports in barrels), avoiding circular dependencies.

---

## Phase 10 — Error Boundary & Auth

### P6.1 — React Error Boundary Wrapper

**What changed:** Added `AppErrorBoundary.tsx` — a class component that catches React render errors and displays a fallback UI with a retry option.

**Why:** Without an error boundary, any uncaught runtime error in a component renders a blank white screen. An error boundary isolates failures to the affected component tree and provides a recovery path.

**Alternatives:** `componentDidCatch` (lifecycle method, older API), no error boundary (white screen on any error).

**Trade-offs:** Error boundaries don't catch event handlers (those need `try/catch`), async code (needs Promise catch handlers), or SSR errors. They cover the most impactful failure mode (render errors).

---

### P6.2 — Auth Guard: Empty While `!initialized`

**What changed:** `ProtectedRoute` renders empty (`<></>`) while `!initialized` rather than immediately redirecting to `/auth`.

**Why:** On first load, Firebase SDK asynchronously restores the session. During this window (`initialized = false`), `user` is `null` even for returning users. If `ProtectedRoute` redirected immediately, returning users would briefly see the auth page before being redirected back — a jarring flash.

**Alternatives:** Show a loading spinner (adds UI, requires handling), redirect to `/auth` (causes flash for returning users).

**Trade-offs:** The empty render means unauthenticated users briefly see nothing (not even the auth page). At most 1-2 seconds. Acceptable.

---

## Phase 11 — Analytics, Settings, Header

### P7.1 — Analytics: Computed on Read, Not Stored

**What changed:** `computeAnalytics()` in `analyticsService.ts` is a pure function that takes `Subscription[]` and returns `AnalyticsMetrics`. It is not stored in IndexedDB.

**Why:** Analytics is derived state — it can always be recomputed from subscriptions. Storing it would create a synchronization problem: whenever a subscription is added, updated, or deleted, the analytics would need to be recalculated and re-stored. On-read computation has zero synchronization cost.

**Alternatives:** Store analytics snapshots (adds complexity, staleness risk), compute in the ViewModel without a service (violates layer separation).

**Trade-offs:** If analytics become complex (multi-step aggregations, historical snapshots), on-read computation could become slow. At current scale (hundreds of subscriptions), this is not a concern.

---

### P7.2 — Header as Central Navigation Hub

**What changed:** `Header.tsx` serves as the quick-add entry point (add button), notification bell, and user avatar/logout. The `useHeaderViewModel.ts` composes three separate concerns: search, user menu, and add modal.

**Why:** The header is always visible and is the natural place for cross-cutting actions (add subscription, see notifications). Splitting the ViewModel into three logical parts (`searchVM`, `userMenuVM`, `addModalVM`) keeps the hook readable.

**Alternatives:** Move quick-add to Dashboard only (reduces discoverability), use a floating action button (mobile pattern, less consistent with desktop).

---

## Phase 12–13 — Notifications & Auth Scoping

### P8.1 — Notification System Architecture

**What changed:** Added `notificationStore.ts`, `notificationService.ts`, `NotificationDropdown.tsx`, and `NotificationType` enum. Notifications are generated programmatically (not user-authored) and stored in IndexedDB.

**Why:** Renewal reminders are the core value-add of a subscription tracker. Generating them automatically on app load (rather than relying on browser push notifications) keeps the app simple and works offline.

**Alternatives:** Browser Push Notifications API (requires HTTPS + Service Worker), email reminders (requires backend), no reminders (misses the core use case).

**Trade-offs:** App must be open to receive reminders. No background notifications. For v1, this is acceptable — the app is a personal tool that users open regularly.

---

### P8.2 — Firebase UID Scoping for Data Isolation

**What changed:** Every IndexedDB operation for subscriptions and notifications now accepts `userId: string` (Firebase UID) and filters by it. `favouriteService.ts` wraps all database calls with the user's UID from `authStore`.

**Why:** Without UID scoping, all users of the same browser (same IndexedDB instance) would see each other's subscriptions. With Firebase Auth in place, adding UID scoping was the minimum change to support multi-user on the same device.

**Alternatives:** Separate IndexedDB database per user (complex to manage), server-side storage (adds backend), single-user only (not scalable).

**Trade-offs:** Client-side isolation only — a malicious user could modify IndexedDB directly to access another user's data. For a personal finance tool with no sensitive data, this is an acceptable risk for v1. Server-side enforcement would be needed for production with adversarial users.

---

### P8.3 — UTC Midnight Epoch Math for Renewal Dates

**What changed:** Renewal date arithmetic (`daysUntil`, `getNextRenewalDate`) uses UTC midnight epoch math instead of local time calculations.

**Why:** A subscription renewing on "July 15" should show "renews in 5 days" regardless of what timezone the user is in. Using local `Date` object methods (`getDate()`, `setDate()`) produces different results in different timezones — a subscription that renews at midnight UTC could appear to renew today or yesterday depending on the user's offset.

```typescript
// Before (broken in non-UTC timezones)
const days = differenceInDays(new Date(sub.renewalDate), new Date());

// After (timezone-independent)
const renewalEpoch = new Date(sub.renewalDate + 'T00:00:00Z').getTime();
const todayEpoch = Date.now();
const days = Math.floor((renewalEpoch - todayEpoch) / 86_400_000);
```

**Alternatives:** Store renewal dates as UTC timestamps (more precise but less human-readable), use date-fns `zonedTime` (adds date-fns-tz dependency).

**Trade-offs:** The UTC midnight approach is fragile if a date string without a time component is misinterpreted. The fix explicitly appends `T00:00:00Z` to guarantee UTC interpretation.

---

## Phase 14 — Sidebar Transitions & Documentation

### P9.1 — Inline Styles for Sidebar Transitions

**What changed:** Sidebar open/close transitions use inline `style` props instead of Tailwind utility classes.

```tsx
<div style={{
  transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
}}>
```

**Why:** Tailwind's `transition` utilities don't expose the full `cubic-bezier` curve specification. Dynamic `translateX` values require arbitrary Tailwind values (`-translate-x-full`) that add noise and don't express the intent clearly. Inline styles make the transition immediately legible.

**Alternatives:** Tailwind with arbitrary values (`style={{ transition: ... }}` for just the curve), CSS custom properties (adds a `.css` file per component), CSS Modules (adds module system).

**Trade-offs:** Inline styles bypass Tailwind's `safelist` and `purge` — they are always included in the bundle. For a single sidebar, this is negligible. If the pattern spreads to many components, it could inflate the bundle slightly.

---

## Git Commit Log (chronological)

| Commit | Phase | Description |
|---|---|---|
| `3af8c14` | 1 | Initial project setup |
| `ba77c6a` | 7 | Reorganize project structure moving types and views to root directories |
| `54a8d9a` | 9 | Add Favourites navigation and page routing |
| `b7d822b` | 10 | Rename AppShell → AppLayout, add UI barrel exports |
| `533c9cf` | 10 | Add error boundary wrapper and implement full header component |
| `d556940` | 11 | Analytics model, subscription detail view, header quick-add |
| `052ae49` | 12 | Initialize notification system on app startup |
| `174b3d2` | 13 | Add auth guards to data fetches, redirect after login |
| `e378302` | 13 | Handle recurring subscription renewal dates with UTC math |
| `e19eaed` | 13 | Remove cancel confirmation dialog, redirect to cancel assistant |
| `42ab30b` | 13 | Scope subscriptions and notifications to authenticated user |
| `ec5e6d2` | 13 | Add .env to .gitignore |
| `a97f024` | 14 | Analytics: include non-recurring subs in spending, hide zero-count stats |
| `5c361db` | 14 | Migrate sidebar toggle inline styles → Tailwind |
| `f519d1a` | 14 | Refactor: replace Tailwind sidebar transitions with inline styles for precise control |
