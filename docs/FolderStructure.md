# Folder Structure — DeadSubs

## Complete Source Tree

```
deadsubs/
├── .env.example                        # Firebase env vars template
├── .env                                # Local Firebase credentials (gitignored)
├── .gitignore
├── .oxlintrc.json
├── README.md                           # Project overview
├── SPEC.md                             # Product specification
├── Architecture.md                      # Architecture deep-dive
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
│
└── src/
    ├── main.tsx                        # App entry — StrictMode → <App />
    ├── App.tsx                        # Root: QueryClient, ErrorBoundary, Auth/Notif initializers, Router, Toaster
    ├── index.css                      # Tailwind directives + custom scrollbar + selection
    │
    ├── models/                        # Barrel re-exports only (no logic)
    │   └── subscription.ts            # Re-exports from src/types/subscription.ts
    │
    ├── types/                         # Domain interfaces, enums, constants
    │   ├── subscription.ts            # Subscription, NewSubscription, Category, BillingCycle, Status, label/color maps
    │   └── notification.ts            # NotificationType, AppNotification, NewNotification
    │
    ├── services/                      # External integrations + pure computation
    │   ├── errors.ts                  # AppError class + ApiResult<T> discriminated union
    │   ├── firebase.ts               # Firebase app init, auth export
    │   ├── authService.ts            # signIn/signUp/logOut/onAuthChange (ApiResult)
    │   ├── database.ts               # Dexie schema (v1→v2) + raw IndexedDB CRUD
    │   ├── favouriteService.ts       # Subscription CRUD wrapped in ApiResult
    │   ├── notificationService.ts    # Notification CRUD + renewal notification factory functions
    │   ├── analyticsService.ts        # Pure computeAnalytics() — no side effects
    │   ├── movieService.ts           # OMDb API wrapper (searchMovies, getMovieById)
    │   └── dataService.ts            # clearAllAppData orchestration across services
    │
    ├── viewmodels/                    # Zustand stores + barrel
    │   ├── index.ts                  # Barrel: authStore, subscriptionStore, notificationStore
    │   ├── authStore.ts              # Firebase user, init, login, register, logout
    │   ├── subscriptionStore.ts      # Subscriptions list, CRUD, optimistic toggles
    │   └── notificationStore.ts      # Notifications, unreadCount, dropdownOpen
    │
    ├── routes/                        # Routing + auth guard
    │   ├── AppRouter.tsx             # createBrowserRouter — all 8 routes
    │   └── ProtectedRoute.tsx        # Empty while !initialized, redirect /auth if !user
    │
    ├── pages/                         # MVVM per page — Model + View + ViewModel + barrel
    │   ├── Auth/
    │   │   ├── index.ts              # Barrel: AuthView, useAuthViewModel, AuthModel
    │   │   ├── AuthModel.ts         # Zod schemas (SignInSchema, SignUpSchema) + AuthState
    │   │   ├── AuthView.tsx         # Full-page sign-in / sign-up form (react-hook-form + zod)
    │   │   └── useAuthViewModel.ts  # Form handling, store actions, OAuth link handlers
    │   │
    │   ├── Dashboard/
    │   │   ├── index.ts
    │   │   ├── DashboardModel.ts    # DashboardState + deriveDashboardState + formatCentsToDollar
    │   │   ├── DashboardView.tsx    # Stat cards, upcoming renewals, empty state
    │   │   └── useDashboardViewModel.ts
    │   │
    │   ├── SubscriptionList/
    │   │   ├── index.ts
    │   │   ├── SubscriptionListModel.ts  # FilterCategory, FilterStatus, SortField + deriveSubscriptionListState
    │   │   ├── SubscriptionListView.tsx   # Search bar, filter/sort controls, SubscriptionCard grid
    │   │   └── useSubscriptionListViewModel.ts
    │   │
    │   ├── SubscriptionDetail/
    │   │   ├── index.ts
    │   │   ├── SubscriptionDetailModel.ts  # deriveSubscriptionDetailState
    │   │   ├── SubscriptionDetailView.tsx  # Full detail card, edit modal, delete confirm, cancel button
    │   │   └── useSubscriptionDetailViewModel.ts
    │   │
    │   ├── Favourites/
    │   │   ├── index.ts
    │   │   ├── FavouritesModel.ts    # FavouritesState + deriveFavouritesState
    │   │   ├── FavouritesView.tsx   # Filtered grid of favourited SubscriptionCards
    │   │   └── useFavouritesViewModel.ts
    │   │
    │   ├── CancelAssistant/
    │   │   ├── index.ts
    │   │   ├── CancelAssistantModel.ts   # CancelAssistantState + deriveCancelAssistantState
    │   │   ├── CancelAssistantView.tsx   # Cancelled/pending-cancel subscriptions, reactivate + delete
    │   │   └── useCancelAssistantViewModel.ts
    │   │
    │   ├── Analytics/
    │   │   ├── index.ts
    │   │   ├── AnalyticsModel.ts    # deriveAnalyticsState (wraps analyticsService)
    │   │   ├── AnalyticsView.tsx    # Recharts bar/area/donut + stat cards + renewal timeline
    │   │   └── useAnalyticsViewModel.ts
    │   │
    │   └── Settings/
    │       ├── index.ts
    │       ├── SettingsModel.ts     # SettingsState + SettingsViewModel interfaces
    │       ├── SettingsView.tsx     # Account info, export/import/clear data, sign out
    │       └── useSettingsViewModel.ts
    │
    ├── components/
    │   ├── AppErrorBoundary.tsx     # React error boundary class — catches render errors
    │   ├── AddSubscriptionModal.tsx # Global modal wrapper — opens SubscriptionForm
    │   ├── NotificationDropdown.tsx # Bell icon + unread badge + notification list panel
    │   │
    │   ├── layout/
    │   │   ├── AppLayout.tsx        # Shell: Sidebar (desktop) + BottomNav (mobile) + Header + Main + Footer
    │   │   ├── Header.tsx           # Logo, search, add button, notifications, user avatar
    │   │   ├── Footer.tsx          # Copyright + app version
    │   │   ├── Main.tsx            # <main> with <Container> — outlet wrapper
    │   │   └── useHeaderViewModel.ts # Search VM, user menu VM, add modal VM
    │   │
    │   ├── subscriptions/
    │   │   ├── index.ts            # Barrel: SubscriptionCard, MovieCardView, useMovieCardViewModel, MovieCardModel
    │   │   ├── SubscriptionCard.tsx    # Wires MovieCardView ↔ useMovieCardViewModel
    │   │   ├── MovieCardView.tsx   # Presentational: rich subscription card UI
    │   │   ├── MovieCardModel.ts   # MovieCardState + deriveMovieCardState + mock data
    │   │   └── useMovieCardViewModel.ts # Toggle favourite/recurring, cancel, click handler, UTC math
    │   │
    │   └── ui/                      # Shared UI primitives
    │       ├── Button.tsx           # variants: primary / secondary / danger / ghost; sizes: sm / md / lg
    │       ├── Input.tsx             # Label + input + error slot (type: email / password / text / number)
    │       ├── Select.tsx           # Custom styled dropdown
    │       ├── Card.tsx             # Card, CardHeader, CardTitle, CardContent
    │       ├── Badge.tsx            # Badge, CategoryBadge, StatusBadge
    │       ├── Modal.tsx            # Modal overlay + ConfirmDialog (type-to-confirm)
    │       ├── Skeleton.tsx         # Skeleton, SkeletonCard, SkeletonRow (loading states)
    │       ├── EmptyState.tsx       # Illustration + heading + description + CTA
    │       ├── Loading.tsx          # LoadingSpinner, LoadingOverlay, LoadingPage
    │       ├── ErrorMessage.tsx     # Inline error text
    │       ├── Container.tsx        # Responsive max-w + horizontal padding
    │       ├── PageTitle.tsx        # <h1> + optional description + optional action button
    │       └── SubscriptionForm.tsx  # React Hook Form + Zod: name, cost, cycle, category, date, notes, isRecurring
    │
    ├── views/                        # Legacy barrel re-exports (kept for backwards compat)
    │   ├── components/
    │   │   ├── index.ts            # Re-exports everything from src/components/ui/index.ts
    │   │   └── AppShell.tsx        # Re-export → src/components/layout/AppLayout
    │   └── pages/
    │       └── index.ts            # Empty barrel
    │
    ├── hooks/
    │   ├── useDisclosure.ts        # useState boolean toggle: open / onOpen / onClose / onToggle
    │   └── useColorScheme.ts       # Light/dark mode (localStorage + media query)
    │
    └── utils/
        └── index.ts               # formatCurrency, formatDate, daysUntil, getNextRenewalDate, etc.
```

---

## Naming Conventions

### Files

| Pattern | Example | Purpose |
|---|---|---|
| `*{State,Types}.ts` | `SubscriptionListModel.ts` | Domain types + pure derivation functions for a page |
| `*View.tsx` | `DashboardView.tsx` | Pure presentational component (JSX only) |
| `*ViewModel.ts` | `useDashboardViewModel.ts` | Hook: store + service composition |
| `use*ViewModel.ts` | `useMovieCardViewModel.ts` | Hook for component-level logic |
| `*Service.ts` | `favouriteService.ts` | External integration or pure computation |
| `*Store.ts` | `subscriptionStore.ts` | Zustand store |
| `index.ts` | `pages/Dashboard/index.ts` | Barrel re-export of all public symbols |

### Interfaces

| Pattern | Example | Location |
|---|---|---|
| `{Page}State` | `DashboardState` | `src/pages/{Page}/*Model.ts` |
| `{Component}Props` | `DashboardViewProps` | `src/pages/{Page}/*View.tsx` |
| `{Component}State` | `MovieCardState` | `src/components/subscriptions/*Model.ts` |

### Phase Comments

Every file begins with a phase comment tracking when it was created:

```typescript
// Phase 10 — Error types and utilities
// Phase 13 — Subscription domain types — moved from models/subscription.ts
```

---

## Directory Responsibilities

### `src/types/`
Domain model. No imports from `services/`, `viewmodels/`, or `components/`. This layer is the most stable and has zero dependencies on other layers.

### `src/models/`
Thin re-export layer. `src/models/subscription.ts` re-exports everything from `src/types/subscription.ts`. This was introduced during the phase 7 restructure to maintain backwards compatibility with imports that used the old path.

### `src/services/`
All side effects and external I/O. No React imports (no hooks, no JSX). Pure TypeScript. Functions are `async` and return `ApiResult<T>` or plain values.

### `src/viewmodels/`
Zustand stores only. No JSX. Imports from `services/` and `types/`.

### `src/pages/*/`
Each page is self-contained with its own MVVM triad. No cross-page imports within the `pages/` directory — inter-page communication goes through stores.

### `src/components/ui/`
Shared primitives used across all pages. No page-specific logic. No imports from `pages/` or other `components/`.

### `src/components/layout/`
App shell components. `AppLayout` orchestrates `Sidebar`, `BottomNav`, `Header`, `Main`, and `Footer`. These are the only components that know about the router's outlet.

### `src/components/subscriptions/`
The `SubscriptionCard` / `MovieCard` component system. Used by `SubscriptionList`, `Favourites`, `Dashboard`, `SubscriptionDetail`, and `CancelAssistant`.

### `src/hooks/`
Shared React hooks that don't fit in stores. `useDisclosure` is universal; `useColorScheme` is currently unused (light mode only in v1) but wired up for future dark mode.

### `src/utils/`
Pure utility functions. No imports from any other layer.

---

## Deleted / Removed Files Log

This log tracks files that existed during development but were removed, renamed, or merged.

| File | What Happened | When | Reason |
|---|---|---|---|
| `src/views/components/AppShell.tsx` (old) | Renamed → `src/components/layout/AppLayout.tsx` | Phase 10 | Logical reorganization: layout components belong in `components/layout/`, not `views/` |
| `src/models/subscription.ts` (original) | Moved → `src/types/subscription.ts` | Phase 1 | Types belong in `types/`, not `models/` |
| `src/types/index.ts` (old barrel) | Removed — replaced with `models/subscription.ts` re-export | Phase 1 | Reduced indirection |
| `src/views/pages/*` | All page components removed from `views/pages/` | Phase 7 | Replaced by `src/pages/` with proper MVVM split |
| `src/components/Modal.tsx` (original) | Inline confirm dialog split out into same file | Phase 6 | Dialog was always only used by Modal |
| `src/views/components/index.ts` (old) | Replaced with `src/components/ui/index.ts` | Phase 7 | UI components are in `components/ui/`, not `views/` |

---

## Key Architectural Boundaries

```
types/ ────────────────────── No imports from any other layer
models/ ───────────────────── Re-exports types only
services/ ────────────────── No React imports; imports types only
viewmodels/ ──────────────── No JSX; imports services + types
pages/*/ ──────────────────── No cross-page imports; imports viewmodels + components
components/ui/ ───────────── No page-specific imports; no stores
components/layout/ ───────── Imports pages (as children) + uses router outlet
hooks/ ────────────────────── No JSX; universal utilities
utils/ ────────────────────── No imports from any other layer
```
