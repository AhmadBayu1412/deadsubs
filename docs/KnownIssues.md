# Known Issues — DeadSubs

## Open Issues

| # | Severity | Area | Title | Description | Status |
|---|---|---|---|---|---|
| KI-01 | Low | Analytics | **Renewal timeline only shows 30 days** | `renewalTimeline` in `AnalyticsMetrics` generates a fixed 30-day forward window. Subscriptions with renewal dates beyond 30 days (e.g., yearly subs renewing in 180 days) do not appear on the renewal calendar chart. | Open |
| KI-02 | Low | Notifications | **No background / push notifications** | Notifications are generated only on app load via `checkAndGenerateRenewalNotifications()`. If the user doesn't open the app for 3 days, they receive no reminder for a subscription renewing tomorrow until they open the app. | Open |
| KI-03 | Low | Data | **No multi-device sync** | All data lives in IndexedDB in the browser. Clearing browser data or switching browsers loses all subscriptions. Export/Import via Settings is the only recovery path. | Open |
| KI-04 | Low | UI | **Large subscription lists not virtualized** | All `SubscriptionCard` components render to the DOM directly. With 100+ subscriptions, the page may become slow. No virtualized list (e.g., `react-virtual`) is implemented. | Open |
| KI-05 | Low | Auth | **No session expiry handling** | Firebase sessions persist indefinitely. If a Firebase token expires in an unusual way (e.g., password changed on another device), the app may show an authenticated blank screen until the user refreshes or logs out. | Open |
| KI-06 | Low | Forms | **Date picker has no manual entry fallback** | The renewal date input in `SubscriptionForm` uses a native `<input type="date">`. Mobile browsers render this inconsistently; no custom date picker calendar is implemented. | Open |
| KI-07 | Low | Analytics | **Yearly subs skew monthly burn rate** | Yearly subscriptions are normalized to monthly equivalents (`cost / 12`). A $120/year subscription shows as $10/month. If the user has one renewal date far in the future and another far in the past, the burn rate appears consistent but may not reflect actual cash flow. | Open |
| KI-08 | Low | Security | **Client-side data isolation only** | Firebase UID scoping is enforced in JavaScript only. A user with browser DevTools access can write to any `userId` in IndexedDB. No server-side enforcement. | Open |
| KI-09 | Low | UX | **Cancel Assistant is now read-only** | The multi-step guided Cancel Assistant was reduced to a list view showing cancelled/pending-cancel subscriptions with reactivate/delete options. The original 3-step guided flow (identify, prepare, execute) was removed in phase 13. | Open — candidate for future restoration |

---

## Resolved Issues

| # | Severity | Area | Title | Description | Resolved In |
|---|---|---|---|---|---|
| RI-01 | Medium | Data | **Timezone bug in renewal date calculations** | `differenceInDays(new Date(sub.renewalDate), new Date())` produced incorrect day counts for users in non-UTC timezones. A subscription due in 3 days could show as due in 2 or 4 depending on the user's offset. | Phase 13 — `e378302` — UTC midnight epoch math |
| RI-02 | Medium | Auth | **Flash of auth page on every return visit** | On first load, `user` is `null` while Firebase SDK initializes. `ProtectedRoute` was redirecting to `/auth` immediately, causing a flash of the auth page for authenticated returning users. | Phase 10 — `533c9cf` — Empty render (`<></>`) while `!initialized` |
| RI-03 | Medium | Data | **All users shared the same IndexedDB** | Before `userId` scoping, multiple people using the same browser/device saw each other's subscriptions. | Phase 13 — `42ab30b` — `userId = Firebase UID` added to all IndexedDB operations |
| RI-04 | Low | Navigation | **Cancel confirmation dialog caused UX confusion** | Clicking "Cancel Subscription" showed an inline type-to-confirm dialog that was difficult to discover and caused navigation confusion. | Phase 13 — `e19eaed` — Redirect to `/cancel-assistant` instead |
| RI-05 | Low | Analytics | **One-time purchases excluded from spend** | Phase 11 initial analytics only counted subscriptions with `isRecurring: true`. Users with many one-time annual purchases saw artificially low burn rates. | Phase 14 — `a97f024` — All non-cancelled subscriptions counted |
| RI-06 | Low | UI | **Analytics showed zero-count categories** | Category breakdown chart and status counts displayed categories with `0` count, creating visual noise. | Phase 14 — `a97f024` — Hide stats where `count === 0` |
| RI-07 | Low | CSS | **Sidebar transitions used Tailwind arbitrary values** | `transition` and `translate-x-full` Tailwind utilities didn't support precise cubic-bezier easing and added arbitrary class noise to the sidebar. | Phase 14 — `f519d1a` — Inline `style` props for sidebar transitions |

---

## Resolved Architectural Decisions

| AD # | Area | Decision | Why Reversed/Refined | Resolution |
|---|---|---|---|---|
| AD-01 | CSS | Initially used only Tailwind utility classes for sidebar | Tailwind's `transition` utilities don't expose `cubic-bezier` customization; `translate-x-full` is not semantically clear for a dynamic open/close | Phase 14 — inline `style` props for transitions; Tailwind for all other sidebar styling |
| AD-02 | Structure | Page components lived in `src/views/pages/` | `views/` directory was overloaded; layout components mixed with page components | Phase 7 — split to `src/pages/` (MVVM pages) + `src/components/` (shared UI) |
| AD-03 | Types | Domain types originally in `src/models/subscription.ts` | Moved to `src/types/subscription.ts`; `models/` became a re-export barrel | Phase 1 — moved types to `types/`; models/index became barrel |
| AD-04 | Notifications | Initially no notification system | Subscription app without renewal reminders missed the core value proposition | Phase 12 — `052ae49` — added notification system with IndexedDB persistence |
| AD-05 | Auth | Initially no auth; data was unscoped | Single-user in single browser was fine for prototype, but Firebase was added early enough that no data migration was needed | Phase 13 — `42ab30b` — all IndexedDB ops scoped to `userId` from Firebase UID |

---

## Future Improvements

| # | Priority | Area | Title | Description |
|---|---|---|---|---|
| FI-01 | High | Data | **Server-side persistence / Cloud sync** | Move subscription data to a server-side store (Firestore, Supabase, PlanetScale) to enable multi-device sync and protect against data loss from browser clearing. |
| FI-02 | High | Notifications | **Browser Push Notifications** | Replace on-load notification generation with actual Push Notifications API so users receive reminders even when the app is closed. Requires HTTPS + Service Worker. |
| FI-03 | Medium | UI | **Virtualized subscription list** | Implement `react-virtual` or `@tanstack/react-virtual` for the subscription list page to handle 100+ subscriptions without DOM performance issues. |
| FI-04 | Medium | Analytics | **Configurable renewal timeline range** | Allow users to choose 30/60/90-day renewal window. Default to 30 days but make it configurable. |
| FI-05 | Medium | UI | **Dark mode** | `useColorScheme.ts` hook is already wired up. Add dark mode tokens to `tailwind.config.js` and implement a theme toggle in Settings. |
| FI-06 | Medium | Cancel Assistant | **Restore guided cancel flow** | Re-implement the original 3-step Cancel Assistant (identify, prepare, execute) rather than the current read-only list view. |
| FI-07 | Low | Auth | **Session expiry recovery** | Add a Firebase `onAuthStateChanged` error handler that detects expired sessions and prompts re-authentication gracefully. |
| FI-08 | Low | Forms | **Custom date picker** | Replace `<input type="date">` with a custom calendar component for consistent UX across all browsers and mobile devices. |
| FI-09 | Low | Analytics | **Cash flow view** | Add a "Cash Flow" analytics view that shows actual spend by calendar month (not normalized burn rate), to give a more accurate picture of when money leaves the account. |
| FI-10 | Low | Data | **Import from CSV** | Add CSV import alongside the existing JSON import, for users migrating from other subscription trackers (e.g., Rocket Money, Bobby). |
