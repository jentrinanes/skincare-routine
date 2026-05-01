# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend
npm run dev                  # Vite dev server → http://localhost:5173
npm run build                # tsc -b && vite build
npm run preview              # preview production build
npx tsc -b --noEmit          # type-check (no test suite; Vitest is the natural fit if one is added)

# API (run in a separate terminal)
cd api && npm start          # tsc build + func start → http://localhost:7071
cd api && npm run watch      # tsc in watch mode (pair with func start)

# Full stack: both processes must run simultaneously for the app to work
```

**Dev prerequisites:** `api/local.settings.json` (gitignored) must exist with Cosmos emulator credentials, `COSMOS_DATABASE=skincare`, `DEFAULT_USER_ID`, `FRONTEND_URL=http://localhost:5173`, `NODE_TLS_REJECT_UNAUTHORIZED=0`, and CORS origin `http://localhost:5173`. The Azure Cosmos DB Emulator must be running at `https://localhost:8081` before the API will start. The frontend env var (`VITE_API_BASE=http://localhost:7071/api`) is already set in `.env.development`.

**No CI/CD:** there are no GitHub Actions workflows or Azure Pipelines configured.

## Architecture

### State management

All app state lives in a single `AppStore` object (`src/types.ts`) managed by `useReducer` in `src/store/reducer.ts`. The API is the source of truth — there is no localStorage persistence.

On startup, `AppProvider` (`src/context/AppContext.tsx`) hydrates the store from the API via `LOAD_STORE`. While fetching, `loading: boolean` (exposed from context) is `true`; `App.tsx` shows a spinner. After load, state flows down to pages via `useAppContext()`.

**Optimistic updates:** `apiDispatch` (the context's `dispatch`) applies actions locally first, then calls `syncToApi` to mirror the change to the API in the background. Failures are console-logged; there is no rollback yet.

### Auth flow

- Registration / login: `api.auth.register` / `api.auth.login` in `src/api/client.ts` → on success, dispatch `LOGIN` with `{ id, name, email, skinType }`
- `LOGIN` in `AppContext`: saves `userId` to `sessionStorage`, calls `setUserId()` on the client module, then fetches all data
- `LOGOUT`: clears `sessionStorage`, calls `setUserId(null)`, clears `store.user`
- Session restore on mount: if `sessionStorage` has a userId, `fetchAllData` runs and `LOAD_STORE` restores the user from the returned profile
- `App.tsx` gates on `store.user` — auth pages are shown when it is `null`
- Password reset: `api.auth.forgotPassword(email)` → stores a token on the user doc, returns `{ resetUrl }` (frontend must present a reset form at that URL); `api.auth.resetPassword(token, password)` → validates token expiry, re-hashes with a new salt, clears the token

### API layer

Azure Functions v4 model (Node.js/TypeScript). Lives in `api/` — a separate package with its own `package.json` and `tsconfig.json`.

```
api/src/
├── db.ts                  # CosmosClient singleton
├── functions/
│   ├── auth.ts            # POST /api/auth/register, /login, /forgot-password, /reset-password
│   ├── products.ts        # CRUD /api/products
│   ├── routineItems.ts    # CRUD /api/routine-items
│   ├── logs.ts            # upsert/delete/list /api/logs
│   ├── reactions.ts       # CRUD /api/reactions
│   ├── patchTests.ts      # CRUD /api/patch-tests
│   └── userProfiles.ts    # GET/PUT /api/profile
└── utils/
    ├── auth.ts            # getUserId(req) — reads x-user-id header
    └── response.ts        # ok / created / noContent / badRequest / notFound / conflict / serverError
```

`getUserId(req)` in `api/src/utils/auth.ts` is the **SWA auth swap point**. Currently reads `x-user-id` header (sent by the frontend client after login). When SWA auth is wired up, replace that one function body to read from `x-ms-client-principal` instead.

`api/local.settings.json` is gitignored. It holds the Cosmos emulator endpoint/key, `COSMOS_DATABASE=skincare`, `DEFAULT_USER_ID` fallback, `NODE_TLS_REJECT_UNAUTHORIZED=0`, and CORS for `:5173`. In production the API reads `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE`, and `FRONTEND_URL` from Azure Functions app settings.

#### Adding a new API function

Routes are registered inline in each function file via `app.http(...)` — there is no central router or `function.json`.

1. Create `api/src/functions/myEntity.ts`, register routes with `app.http(...)` (v4 model)
2. Call `getUserId(req)` from `../utils/auth` and helpers from `../utils/response`
3. Add typed fetch functions to `src/api/client.ts`
4. Handle relevant actions in `src/api/sync.ts`

### Cosmos DB schema

Database: `skincare`

| Container | Partition key | Notes |
|---|---|---|
| `products` | `/userId` | |
| `routineItems` | `/userId` | |
| `logs` | `/userId` | `id` computed as `${date}_${routineItemId}_${period}` |
| `reactions` | `/userId` | |
| `patchTests` | `/userId` | |
| `userProfiles` | `/id` | `id` = userId; stores `passwordHash`/`passwordSalt` |

### Adding a new page

1. Create `src/pages/MyPage.tsx`, consume `useAppContext()` for data.
2. Add the page ID to the `AppPage` union in `src/types.ts`.
3. Register it in `PAGE_COMPONENTS` in `src/App.tsx`.
4. Add a nav entry to `NAV_ITEMS` in `src/layout/Sidebar.tsx`.

### Adding a new action

1. Add the action type to the `Action` union in `src/store/reducer.ts`.
2. Handle it in the `switch` — assign `next` and `return next` at the end.
3. Add any new entity types to `src/types.ts` and `AppStore`.
4. Add the corresponding API call to `src/api/sync.ts` so mutations are persisted.

### Dark mode

Toggled by dispatching `SET_DARK_MODE`. `App.tsx` syncs the boolean to `document.documentElement.classList` (adds/removes `dark`). Tailwind is configured with `@custom-variant dark (&:where(.dark, .dark *))` in `src/index.css`, so all `dark:` utility classes respond to that class on `<html>`.

### Tailwind theme

Custom colours (`sage`, `cream`, `terra`) and the `DM Sans` font are defined in `src/index.css` under `@theme` — there is no `tailwind.config.js`. Tailwind v4 reads everything from CSS.

### Responsive layout

Desktop: fixed sidebar (`src/layout/Sidebar.tsx`) + scrollable main area. Mobile: sidebar hidden by default, revealed as a full-height overlay with a backdrop when the hamburger is tapped. The toggle lives in `App.tsx`. Use `hidden md:flex` / `md:hidden` breakpoints to match the existing pattern.

### Shared components

`src/components/index.ts` re-exports all UI primitives. Import from there, not from individual files:
```ts
import { Btn, Card, Icon, Badge, Modal, Select, FormField,
         EmptyState, PageHeader, ConfirmDialog,
         ActivesBadges, StatusBadge, BarrierLoadMeter } from '../components';
```
`inputCls` (the shared input class string) is exported from `src/components/FormField.tsx`, not from the barrel.

`Icon` accepts a `name` prop drawn from a fixed SVG dictionary. Full list: `sun moon check plus edit trash x chevronDown chevronRight chevronLeft alertCircle calendar package activity clock settings user layout logout droplet search menu arrowUp arrowDown flame shield info sparkles`. Add new icons directly to the `ICONS` object in `src/components/Icon.tsx`.

### Key business logic (all in `src/store/data.ts`)

- `computeBarrierLoad(actives)` — sums `ACTIVE_WEIGHTS` for a set of actives; Tretinoin=3, Retinol/Vit-C=2, most others 0–1.
- `barrierLoadLabel(score)` — returns a `{ label, color }` pair (gentle / moderate / active / high).
- `computeExpiry(openedDate, paoMonths)` — adds months to open date, returns `YYYY-MM-DD`.
- `computeStreak(logs)` / `longestStreak(logs)` — current and all-time consecutive-day counts.
- `getTodayInTz(tz)` — returns today's date in the user's IANA timezone using `Intl.DateTimeFormat('en-CA')`. Always use this (not `new Date()`) when you need "today" for routine logic.
- Conflict detection rules live in `src/pages/Dashboard.tsx` (co-located with the UI that renders them).

Constants also exported from `data.ts`: `ACTIVES_LIST` (44 ingredients), `PRODUCT_TYPES` (15 categories), `PAO_OPTIONS`, `FREQUENCY_OPTIONS`, `SKIN_TYPES`.

### Browser notifications

`App.tsx` polls every 30 seconds and fires `Notification` API alerts when the current time matches the AM or PM notification times stored in `userProfile.notifications`.

### Pending: SWA auth

When Azure Static Web Apps auth is wired up:
1. Replace the body of `getUserId(req)` in `api/src/utils/auth.ts`
2. Remove `setUserId` / `x-user-id` from `src/api/client.ts`
3. Remove the `sessionStorage` session restore from `src/context/AppContext.tsx`
4. Do **not** enable the built-in SWA auth provider — auth should remain custom
