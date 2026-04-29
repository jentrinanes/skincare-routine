# Handoff: Skin Journal

A skincare routine tracker with AM/PM scheduling, product inventory, barrier load analysis, conflict detection, patch tests, calendar, and timeline.

## About the files
These are **high-fidelity HTML prototypes** (React + Babel + Tailwind CSS). Open `Skincare Routine.html` in a browser to explore all interactions. Recreate these designs in your target codebase — do not ship the HTML directly.

Recommended production stack: **Next.js + Tailwind CSS**. Replace localStorage with a real database and proper auth.

## Pages
| File | Page | Notes |
|------|------|-------|
| auth.jsx | Login / Register / Forgot Password | Split layout: form left, sage feature panel right |
| dashboard.jsx | Dashboard | Stat strip, conflict alerts, AM/PM routine checklists, expiry warnings |
| products.jsx | Products / Inventory | Searchable list, add/edit modal with actives combobox |
| routine.jsx | Routine Setup | AM/PM tabs, reorderable list, frequency + start date per item |
| reactions.jsx | Reactions | Date + description + suspected product log |
| patchtest.jsx | Patch Tests | Progress bar per test, passed/failed/abandoned status |
| calendar.jsx | Calendar | Month grid with AM/PM dots; day detail panel |
| timeline.jsx | Timeline | Card grid showing usage duration per product |
| settings.jsx | Settings | Profile, timezone, notifications, dark mode, data export |
| sidebar.jsx | Sidebar nav | 224px fixed desktop; drawer on mobile |
| components.jsx | Shared UI | Modal, Btn, Card, Badge, FormField, Select, ActivesCombobox, BarrierLoadMeter |
| data.js | Store + helpers | loadStore/saveStore (localStorage), computeExpiry, computeBarrierLoad, conflict rules |
| app.jsx | App root | Reducer, routing, notification scheduler |

## Design Tokens
- **Primary:** Sage green — sage-500 = `#4a844a`
- **Background:** Cream — cream-100 = `#faf6ed`
- **Danger/alerts:** Terracotta — terra-400 = `#c97055`
- **Dark mode:** zinc-950 page, zinc-900 cards, zinc-800 inputs
- **Font:** DM Sans (Google Fonts), weights 300–700
- **Card:** `rounded-2xl shadow-sm border border-stone-100`
- **Button:** `rounded-xl`
- **Badge:** `rounded-full`

## Key Logic

**Barrier load** — sum of active ingredient weights per session. Retinoids = 2–3 pts, acids = 1–2 pts, humectants/calming = 0. Labels: Gentle / Moderate / Active / High.

**Conflict detection** — 7 rules checked against actives in each period's products:
- Retinoid + AHA → High
- Retinoid + BHA → High  
- Retinoid + Vitamin C (L-AA) → Medium
- Benzoyl Peroxide + Retinoid → High
- Benzoyl Peroxide + Vitamin C → Medium
- 2+ exfoliant types → Medium
- Multiple retinoids → High

**Timezone-aware "today"** — `new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())` returns YYYY-MM-DD in the user's configured timezone. Prevents UTC offset bugs.

**PAO expiry** — `openedDate + paoMonths` calendar months. Auto-computed on product save.

**Streak** — consecutive calendar days with ≥1 completed log entry.

**Notifications** — Web Notifications API. Scheduler polls every 30s; fires at configured AM/PM times. Only works while tab is open.

## Data Model (simplified)
```
Product:      id, name, brand, type, status, openedDate, pao, expiry, actives[], notes
RoutineItem:  id, productId, period (AM|PM), frequency, startDate, order
Log:          date, routineItemId, period, completed, skipped
Reaction:     id, date, description, suspectedProducts[]
PatchTest:    id, productId, productName, brand, startDate, location, durationDays, status, reactionNotes, notes
UserProfile:  name, email, skinType, timezone, notifications{ enabled, amTime, pmTime }
```
