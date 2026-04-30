# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # tsc -b && vite build
npm run preview    # Preview production build
npx tsc -b --noEmit  # Type-check without emitting (no test suite yet)
```

## Architecture

### State management

All app state lives in a single `AppStore` object (defined in `src/types.ts`) managed by a `useReducer` in `src/store/reducer.ts`. The reducer calls `saveStore()` on every action to persist to `localStorage`. The store is loaded once at app start via the lazy initialiser in `useStore()`.

State flows down through `AppContext` (`src/context/AppContext.tsx`). Every page and most components consume it via `useAppContext()` — there are no local server-fetch patterns yet.

### Adding a new page

1. Create `src/pages/MyPage.tsx`, consume `useAppContext()` for data.
2. Add the page ID to the `AppPage` union in `src/types.ts`.
3. Register it in `PAGE_COMPONENTS` in `src/App.tsx`.
4. Add a nav entry to `NAV_ITEMS` in `src/layout/Sidebar.tsx`.

### Adding a new action

1. Add the action type to the `Action` union in `src/store/reducer.ts`.
2. Handle it in the `switch` — assign `next` and let the bottom of the switch call `saveStore(next)`.
3. Add any new entity types to `src/types.ts` and `AppStore`.

### Dark mode

Toggled by dispatching `SET_DARK_MODE`. `App.tsx` syncs the boolean to `document.documentElement.classList` (adds/removes `dark`). Tailwind is configured with `@custom-variant dark (&:where(.dark, .dark *))` in `src/index.css`, so all `dark:` utility classes respond to that class on `<html>`.

### Tailwind theme

Custom colours (`sage`, `cream`, `terra`) and the `DM Sans` font are defined in `src/index.css` under `@theme` — there is no `tailwind.config.js`. Tailwind v4 reads everything from CSS.

### Shared components

`src/components/index.ts` re-exports all UI primitives. Import from there, not from individual files:
```ts
import { Btn, Card, Icon, Badge, FormField } from '../components';
```
`inputCls` (the shared input class string) is exported from `src/components/FormField.tsx`, not from the barrel.

### Key business logic (all in `src/store/data.ts`)

- `computeBarrierLoad(actives)` — sums `ACTIVE_WEIGHTS` for a set of actives.
- `computeExpiry(openedDate, paoMonths)` — adds months to open date, returns `YYYY-MM-DD`.
- `getTodayInTz(tz)` — returns today's date in the user's IANA timezone using `Intl.DateTimeFormat('en-CA')`. Always use this (not `new Date()`) when you need "today" for routine logic.
- Conflict detection rules live in `src/pages/Dashboard.tsx` (co-located with the UI that renders them).

### Planned backend

localStorage is a temporary data layer. The roadmap is Azure Functions (API) + Azure Cosmos DB + Azure Static Web Apps auth. When migrating, `loadStore`/`saveStore` in `src/store/data.ts` are the only persistence callsites to replace.
