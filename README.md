# Skin Journal

A skincare routine tracker that helps you manage products, build AM/PM routines, track barrier load, detect ingredient conflicts, and log reactions.

## Stack

- **React 19** + **TypeScript**
- **Vite 6**
- **Tailwind CSS v4** (custom sage / cream / terra palette, class-based dark mode)
- **localStorage** (planned: Azure Cosmos DB via Azure Functions)
- Deployment target: **Azure Static Web Apps**

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Sign in with any email and password — auth is local-only for now.

## Project structure

```
src/
├── types.ts                  # Shared TypeScript interfaces
├── store/
│   ├── data.ts               # Constants, sample data, helpers (barrier load, expiry, streaks)
│   └── reducer.ts            # App reducer + useStore hook
├── context/
│   └── AppContext.tsx         # Typed React context
├── components/               # Shared UI: Icon, Btn, Badge, Card, Modal, FormField, …
├── layout/
│   └── Sidebar.tsx
├── auth/                     # LoginPage, RegisterPage, ForgotPage
└── pages/                    # Dashboard, Products, Routine, Reactions,
                              # PatchTests, Calendar, Timeline, Settings
```

## Features

| Page | What it does |
|---|---|
| **Dashboard** | Today's AM/PM routines with check-off, streak stats, conflict alerts, expiry warnings |
| **Products** | Inventory with PAO tracking, actives, status filters |
| **Routine** | AM/PM builder — reorder products, set frequency & start date |
| **Reactions** | Log sensitivity events, link suspected products |
| **Patch Tests** | Track patch tests with progress bar and pass/fail status |
| **Calendar** | Monthly view of daily check-in history |
| **Timeline** | PAO progress bars and usage duration per product |
| **Settings** | Profile, timezone, notifications, dark mode, data export |

## Key logic

- **Barrier load scoring** — each active earns 0–3 pts (retinoids = 2–3, acids = 1–2, hydrators = 0). Routine totals are labelled Gentle / Moderate / Active / High.
- **Conflict detection** — 7 rules (e.g. Retinoid + AHA, BP + Retinoid). Alerts show per-session with one-tap skip.
- **PAO expiry** — computed from open date + period-after-opening months.
- **Timezone-aware today** — uses `Intl.DateTimeFormat` in the user's configured timezone to avoid UTC offset bugs.
- **Streak tracking** — consecutive days with at least one completed routine item.

## Roadmap

- [ ] Azure Functions API (products, routine, logs endpoints)
- [ ] Azure Cosmos DB (replace localStorage)
- [ ] Azure Static Web Apps auth (Easy Auth / Entra ID)
- [ ] Push notifications via Azure Notification Hubs
