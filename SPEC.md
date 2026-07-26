# DeadSubs — Product Specification

## 1. Concept & Vision

DeadSubs is a focused financial wellness tool that helps users **eliminate unwanted subscription auto-renewals**, understand their **monthly burn rate**, and execute **quick cancellations** using a guided Cancel Assistant. The experience feels like having a sharp, organized CFO assistant who has already done the tedious work for you — clean, confident, and action-oriented.

The app lives in the browser (React SPA), persists data locally (IndexedDB via Dexie.js), and uses Firebase Auth for identity. All financial data stays on-device — Firebase is only for auth.

---

## 2. Design Language

**Aesthetic Direction:** "Financial Minimalism" — inspired by high-end fintech apps like Linear and Mercury. Light backgrounds, sharp typography, purposeful use of red for cancellation/warning actions and green for savings. Not playful, not corporate — precise and trustworthy.

**Color Palette:**
- `--bg`: `#F8F7F4` — warm off-white background
- `--surface`: `#FFFFFF` — card surfaces
- `--border`: `#E8E5DF` — subtle warm borders
- `--text-primary`: `#1A1916` — near-black
- `--text-secondary`: `#78756E` — warm gray
- `--accent-red`: `#DC2626` — cancellation, danger, burn
- `--accent-red-light`: `#FEF2F2`
- `--accent-green`: `#16A34A` — savings, positive
- `--accent-green-light`: `#F0FDF4`
- `--accent-blue`: `#2563EB` — primary actions, links

**Typography:**
- Font: Inter (Google Fonts) — weights 400, 500, 600, 700
- Display numbers: tabular-nums for alignment
- Scale: 12/14/16/18/24/32/48px

**Spacing System:** 4px base unit. Components use 4/8/12/16/20/24/32/48px spacing.

**Motion Philosophy:**
- Micro-interactions only: 150ms ease-out for hover, 200ms for state changes
- Page transitions: 250ms fade + translate
- No decorative animations — motion serves function

**Visual Assets:**
- Icons: Lucide React — consistent 20px stroke icons
- No emoji — use SVG icons only
- Custom inline SVGs for brand moments (logo, empty states)

---

## 3. Layout & Structure

### Page Structure
```
AppShell
├── Sidebar (desktop) / BottomNav (mobile)
│   ├── Logo
│   ├── Nav: Dashboard, Subscriptions, Cancel Assistant, Analytics, Settings
│   └── User profile / auth state
└── Main Content Area
    ├── Route: / → Dashboard
    ├── Route: /subscriptions → SubscriptionList
    ├── Route: /subscriptions/:id → SubscriptionDetail
    ├── Route: /cancel/:id → CancelAssistant
    ├── Route: /analytics → Analytics
    └── Route: /settings → Settings
```

### Responsive Strategy
- **Desktop (≥1024px):** Fixed left sidebar (240px) + scrollable content
- **Tablet (768–1023px):** Collapsible sidebar, hamburger toggle
- **Mobile (<768px):** Bottom navigation bar (5 tabs max), full-width content

---

## 4. Features & Interactions

### 4.1 Dashboard
- **Monthly Burn Rate Card:** Large prominent number showing total monthly spend. Red accent if >$100.
- **Active Subscriptions Count:** Total count with trend indicator vs last month.
- **Upcoming Renewals:** Next 3–5 subscriptions renewing within 7 days, shown as compact list items with days-until badge.
- **Quick Actions:** "Add Subscription" button, "Start Cancel Assistant" button.
- **Savings Summary:** Total saved via cancellations this month.

### 4.2 Subscription Management
- **List View:** Sortable table (Name, Monthly Cost, Category, Renewal Date, Status). Default sort: renewal date ascending.
- **Add/Edit Modal:** Fields: Name, Monthly Cost (or yearly with toggle), Category (dropdown), Renewal Date (date picker), Billing Cycle, Notes.
- **Category Tags:** Streaming, Software, Fitness, News, Gaming, Music, Cloud, Other — each with a distinct color chip.
- **Search/Filter Bar:** Full-text search on name, filter by category, status (active/paused/cancelled), sort options.
- **Bulk Actions:** Select multiple → bulk delete or export.
- **Delete Confirmation:** Inline confirmation ("Are you sure? Type 'delete' to confirm") rather than modal.

### 4.3 Cancel Assistant
- **Step-by-step guided flow (3 steps):**
  1. **Identify:** Select subscription to cancel → shows current cost + renewal date.
  2. **Prepare:** Displays talking points ("You've been charged for X months at $Y/month = $Z total") + estimated savings.
  3. **Execute:** Cancellation method options (direct link, phone, in-app) with custom script/checklist. Final step marks subscription as "pending cancellation" with target date.
- **Progress indicator:** Step 1/3, 2/3, 3/3 at top.
- **Skip option:** "I already cancelled" → direct to mark as cancelled flow.
- **Outcome tracking:** After target date, prompt user to confirm cancellation went through. If not, offer alternative methods.

### 4.4 Analytics
- **Monthly Burn Rate Chart:** Bar chart — last 6 months of total spend.
- **Category Breakdown:** Donut chart — spend by category for current month.
- **Trend Table:** Month-over-month change per category.
- **Cancellation Impact:** Line chart — "monthly savings after cancellations" over time.

### 4.5 Settings
- **Profile:** Name, email (read-only from Firebase).
- **Data Management:** Export all data as JSON, Import from JSON, Clear all data (with confirmation).
- **Notifications:** Toggle for "renewal reminders" — days before renewal (3/7/14 days).
- **Theme:** Light only (v1).
- **About:** App version, credits.

### 4.6 Auth (Firebase)
- **Sign In / Sign Up:** Email + password via Firebase Auth.
- **Persist Session:** Auto sign-in on app load.
- **Sign Out:** Available in sidebar bottom.
- **Protected Routes:** All routes except sign-in require auth.

---

## 5. Component Inventory

### Core Components
| Component | States | Notes |
|---|---|---|
| `Button` | default, hover, active, disabled, loading | variants: primary, secondary, danger, ghost |
| `Input` | default, focus, error, disabled | with label and error message slots |
| `Select` | default, open, selected, disabled | custom styled dropdown |
| `Card` | default, hover (interactive) | used as container |
| `Badge` | category colors, status colors | small label chip |
| `Modal` | open, closed | with backdrop, trap focus |
| `Skeleton` | loading | pulse animation |
| `EmptyState` | default | illustration + CTA |
| `ConfirmDialog` | default | destructive action confirmation |
| `Toast` | success, error, info | auto-dismiss 4s |
| `DatePicker` | default | calendar popup |
| `Chart` | loading, loaded, empty | wrapper for recharts |

### Page Components
- `DashboardPage`, `SubscriptionListPage`, `SubscriptionDetailPage`, `CancelAssistantPage`, `AnalyticsPage`, `SettingsPage`, `AuthPage`

---

## 6. Technical Approach

### Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v3
- **Routing:** React Router v6
- **State:** Zustand (global app state) + React Query (async data)
- **Local DB:** Dexie.js (IndexedDB wrapper) — all subscription data
- **Auth:** Firebase Auth (email/password)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Date:** date-fns
- **Notifications:** React Hot Toast (or custom)

### Data Model

```typescript
// Subscription
interface Subscription {
  id: string;           // UUID
  name: string;
  cost: number;         // in cents
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  category: Category;
  renewalDate: string;   // ISO date string
  status: 'active' | 'paused' | 'cancelled' | 'pending_cancel';
  notes?: string;
  cancelTargetDate?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

type Category =
  | 'streaming'
  | 'software'
  | 'fitness'
  | 'news'
  | 'gaming'
  | 'music'
  | 'cloud'
  | 'food'
  | 'other';

type BillingCycle = 'monthly' | 'yearly' | 'weekly';
type Status = 'active' | 'paused' | 'cancelled' | 'pending_cancel';

// User Settings
interface UserSettings {
  uid: string;
  displayName: string;
  email: string;
  renewalReminders: boolean;
  reminderDays: number[]; // e.g. [3, 7]
}

// Analytics Snapshot (derived, not stored)
interface MonthlySpend {
  month: string; // 'YYYY-MM'
  total: number;
  byCategory: Record<Category, number>;
}
```

### Architecture (MVVM)

```
src/
├── models/           # Data types, interfaces, Dexie schema
├── viewmodels/       # Zustand stores, React Query hooks
├── views/
│   ├── pages/        # Route-level components
│   └── components/   # Reusable UI components
├── services/         # Firebase, Dexie, export/import
├── utils/            # formatters, calculators, constants
├── routes/           # Route definitions
└── App.tsx
```

### API Design (Local IndexedDB via Dexie)
All data operations go through a `SubscriptionService` class wrapping Dexie.

```typescript
class SubscriptionService {
  getAll(): Promise<Subscription[]>
  getById(id: string): Promise<Subscription | undefined>
  add(data: NewSubscription): Promise<string>
  update(id: string, data: Partial<Subscription>): Promise<void>
  delete(id: string): Promise<void>
  getUpcoming(daysAhead: number): Promise<Subscription[]>
  getByMonth(year: number, month: number): Promise<Subscription[]>
}
```

### Build & Deployment
- Vite for bundling
- Environment variables via `.env` (Firebase config)
- No backend required — fully client-side
