# DeadSubs

> A focused financial wellness tool that helps users eliminate unwanted subscription auto-renewals, understand their monthly burn rate, and execute quick cancellations.

**Live App:** [deadsubs.netlify.app](https://deadsubs.netlify.app/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ahmad%20Bayu%20Samudera-0077B1?style=flat&logo=linkedin)](https://www.linkedin.com/in/ahmad-bayu-samudera-985880236/)
[![GitHub](https://img.shields.io/badge/GitHub-AhmadBayu1412-181717?style=flat&logo=github)](https://github.com/AhmadBayu1412)

---

## Quick Start

```bash
# 1. Clone & install
npm install

# 2. Set up Firebase credentials
cp .env.example .env
# Fill in your Firebase project values in .env

# 3. Start dev server
npm run dev
```

The app requires a Firebase project with **Email/Password authentication** enabled. See [Environment Setup →](#environment-setup) for all required env vars.

---

## What the App Does

- **Track** every subscription (name, cost, billing cycle, category, renewal date, status)
- **Know your burn rate** — total monthly and yearly spend, broken down by category
- **Find upcoming renewals** — see what's due in the next 30 days
- **Cancel with confidence** — the Cancel Assistant guides users through the cancellation process with talking points and estimated savings
- **Get renewal reminders** — notifications for renewals due today or tomorrow
- **Favourites** — bookmark subscriptions for quick access
- **One-time vs recurring** — distinguish between auto-renewing subscriptions and one-off purchases (both counted in spending)
- **Export / Import** — full JSON data portability via Settings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router v7 |
| Global state | Zustand 5 |
| Async data | TanStack React Query 5 |
| Persistence | Dexie.js (IndexedDB) |
| Authentication | Firebase Auth |
| Styling | Tailwind CSS v3 |
| Charts | Recharts 3 |
| Forms | React Hook Form + Zod |
| Dates | date-fns |
| Icons | Lucide React |
| Toasts | React Hot Toast |

---

## Layer Responsibilities

### Types (`src/types/`)
Domain interfaces, enums, and constants only. Zero logic.

- `subscription.ts` — `Subscription`, `NewSubscription`, `Category`, `BillingCycle`, `Status`, all label/color maps
- `notification.ts` — `NotificationType`, `AppNotification`, `NewNotification`

### Models (`src/models/`)
Barrel re-exports of types. No business logic.

### Services (`src/services/`)
External integrations and pure computation. All return `ApiResult<T>`.

| File | Responsibility |
|---|---|
| `firebase.ts` | Firebase app init + auth export |
| `authService.ts` | signIn, signUp, logOut, onAuthChange |
| `database.ts` | Dexie schema + all IndexedDB CRUD |
| `favouriteService.ts` | Subscription CRUD with ApiResult wrapping |
| `notificationService.ts` | Notification CRUD + renewal notification factory |
| `analyticsService.ts` | Pure `computeAnalytics()` — no side effects |
| `movieService.ts` | OMDb API wrapper (searchMovies, getMovieById) |
| `dataService.ts` | Cross-service orchestration (clearAllAppData) |
| `errors.ts` | `AppError`, `ApiResult<T>` discriminated union |

### ViewModels (`src/viewmodels/`)
Zustand stores — synchronous state + async actions that call services.

| Store | State |
|---|---|
| `authStore.ts` | `user`, `loading`, `initialized`, `init()`, `login()`, `register()`, `logout()` |
| `subscriptionStore.ts` | `subscriptions[]`, CRUD actions, optimistic toggle for favourite/recurring |
| `notificationStore.ts` | `notifications[]`, `unreadCount`, `dropdownOpen`, mark-read actions |

### Views (`src/pages/*/`)
MVVM split per page:

- `*View.tsx` — Pure JSX, receives only serializable props. No store access.
- `use*ViewModel.ts` — Hook composing store actions, derived state, loading/error state.
- `*Model.ts` — Domain types for that page's view state + pure derivation functions.

### Components (`src/components/`)
Shared UI primitives (`Button`, `Input`, `Modal`, `Card`, `Badge`, `Skeleton`, etc.) + page-specific wrappers (`SubscriptionCard`, `NotificationDropdown`, `AddSubscriptionModal`).

### Routes (`src/routes/`)
- `AppRouter.tsx` — `createBrowserRouter` with all 8 routes
- `ProtectedRoute.tsx` — Auth guard: empty while `!initialized`, redirect to `/auth` if `!user`

### Utils (`src/utils/`)
Pure functions: `formatCurrency`, `formatDate`, `daysUntil`, `getNextRenewalDate`, etc.

### Hooks (`src/hooks/`)
- `useDisclosure.ts` — Boolean toggle (`open/onOpen/onClose/onToggle`)
- `useColorScheme.ts` — Light/dark mode via `localStorage` + `prefers-color-scheme`

---

## Data Flow

```
User Action
    │
    ▼
use*ViewModel hook
    │  calls store action
    ▼
Zustand Store Action
    │  calls service
    ▼
favouriteService / notificationService / analyticsService
    │  wraps with ApiResult
    ▼
database.ts (Dexie IndexedDB)
    │  read/write
    ▼
IndexedDB (per-user namespace via userId = Firebase UID)
```

**Auth Init Flow:**
```
App mounts
  → AuthInitializer calls authStore.init()
    → onAuthChange() → Firebase subscribes to auth state
      → user set in store, initialized = true
        → ProtectedRoute renders AppLayout
          → NotificationInitializer calls checkAndGenerateRenewalNotifications()
            → fetches all subscriptions from IndexedDB
              → creates renewal notifications if overdue/today/tomorrow
```

**Add Subscription Flow:**
```
SubscriptionForm onSubmit (Zod validation)
  → subscriptionStore.add() / dashboardViewModel.addSubscription()
    → authStore.user.uid
    → favouriteService.addSubscription() → ApiResult
      → database.addSubscription() → Dexie db.subscriptions.add()
    → notificationService.createNotification(makeSubscriptionAddedNotification(...))
    → subscriptionStore.fetchAll()
    → react-hot-toast "Subscription added"
```

---

## Routing

All routes use `createBrowserRouter` from React Router v7.

```
/auth                          → AuthView           (public)
/                              → DashboardView      (protected)
/subscriptions                → SubscriptionListView (protected)
/subscriptions/:id            → SubscriptionDetailView (protected)
/favourites                   → FavouritesView      (protected)
/cancel-assistant             → CancelAssistantView (protected)
/analytics                    → AnalyticsView       (protected)
/settings                     → SettingsView        (protected)
```

`ProtectedRoute` renders empty (`<></>`) while `!initialized` to avoid flash of protected content, then redirects to `/auth` if `user === null`.

---

## CSS & Styling

**Approach:** Utility-first with Tailwind CSS v3 + a custom design token layer.

**Design tokens** (defined in `tailwind.config.js`):

| Token | Value | Usage |
|---|---|---|
| `bg` | `#F8F7F4` | Page background (warm off-white) |
| `surface` | `#FFFFFF` | Card surfaces |
| `border` | `#E8E5DF` | Borders, dividers |
| `primary` | `#1A1916` | Primary text |
| `secondary` | `#78756E` | Secondary/muted text |
| `accent-red` | `#DC2626` | Danger, cancellation, burn |
| `accent-red-light` | `#FEF2F2` | Danger backgrounds |
| `accent-green` | `#16A34A` | Positive, savings |
| `accent-green-light` | `#F0FDF4` | Positive backgrounds |
| `accent-blue` | `#2563EB` | Links, primary actions |

**Typography:** Inter (Google Fonts), weights 400/500/600/700. `tabular-nums` class for financial figures.

**Sidebar transitions** use **inline styles** (not Tailwind classes) for precise control over the transition duration and easing — migrated from Tailwind in phase 14.

**`src/index.css`** applies:
- `@tailwind base/components/utilities`
- Custom scrollbar (6px, warm border color)
- `::selection` with accent-blue tint
- `scroll-behavior: smooth`

---

## Environment Setup

Create a `.env` file (gitignored — never commit credentials):

```bash
cp .env.example .env
```

Required variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

All variables must be prefixed with `VITE_` to be accessible in the Vite browser bundle. The `.env` file is in `.gitignore` — see `.env.example` for the template.

---

## Scripts

```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript check + Vite production build
npm run lint     # Run oxlint
npm run preview  # Preview production build locally
```

---

## Data Model

All monetary values are stored as **integers in cents** (e.g., `$9.99` → `999`). Billing cycles are normalized to monthly equivalents:

| Cycle | Multiplier to Monthly |
|---|---|
| `weekly` | ×4.33 |
| `monthly` | ×1 |
| `yearly` | ÷12 |

Renewal dates are stored as **ISO date strings** (YYYY-MM-DD). Renewal date arithmetic uses **UTC midnight epoch math** to avoid timezone bugs.

Subscriptions have an `isRecurring` flag — `true` for auto-renewing subscriptions, `false` for one-time purchases. Both are included in analytics spending totals.

---

## Error Handling

All service functions return `ApiResult<T>`:

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

// AppError codes:
// 'network' | 'not_found' | 'unauthorized' | 'forbidden' | 'validation' | 'server' | 'unknown'
```

ViewModels check `result.ok` before using `result.data`. `AppError` extends `Error` with a typed `code` field and a `toResult()` method.

---

## Author & Connect

Built by [Ahmad Bayu Samudera](https://www.linkedin.com/in/ahmad-bayu-samudera-985880236/)

- **Live App:** [deadsubs.netlify.app](https://deadsubs.netlify.app/)
- **GitHub:** [AhmadBayu1412](https://github.com/AhmadBayu1412)
- **LinkedIn:** [ahmad-bayu-samudera-985880236](https://www.linkedin.com/in/ahmad-bayu-samudera-985880236/)

---

## Project Phases

See [PromptHistory.md](./PromptHistory.md) for the full chronological decision log.

| Phase | Focus |
|---|---|
| 1 | Project initialization, Vite + Tailwind setup |
| 2 | Core MVVM structure, types, database schema |
| 3–6 | Feature pages (Dashboard, SubscriptionList, SubscriptionDetail, Auth) |
| 7 | Project structure reorganization |
| 8–9 | UI polish, Favourites, barrel exports |
| 10–11 | Error boundary, Header, Analytics, Settings |
| 12–13 | Notification system, auth scoping, Cancel Assistant fixes |
| 14 | Documentation, sidebar transitions |
