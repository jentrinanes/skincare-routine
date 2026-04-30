import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon, Badge, Card, BarrierLoadMeter } from '../components';
import { computeBarrierLoad, barrierLoadLabel, computeExpiry, computeStreak, longestStreak, getTodayInTz } from '../store/data';
import type { Period, Product, RoutineItem } from '../types';

// ── Conflict detection ────────────────────────────────────────────────────────

const ACTIVE_GROUPS: Record<string, string[]> = {
  retinoids:   ['Retinol', 'Retinaldehyde', 'Tretinoin'],
  aha:         ['AHA – Glycolic Acid', 'AHA – Lactic Acid', 'AHA – Mandelic Acid'],
  bha:         ['BHA – Salicylic Acid'],
  pha:         ['PHA – Gluconolactone', 'PHA – Lactobionic Acid'],
  vitc_strong: ['Vitamin C (L-AA)'],
  bp:          ['Benzoyl Peroxide'],
};

const matchesGroup = (actives: string[], group: string) =>
  (ACTIVE_GROUPS[group] ?? []).some(a => actives.includes(a));

interface ConflictRule {
  key: string;
  check: (a: string[]) => boolean;
  severity: 'high' | 'medium';
  title: string;
  message: string;
}

const CONFLICT_RULES: ConflictRule[] = [
  { key: 'retinoid-aha', severity: 'high', title: 'Retinoid + AHA',
    check: a => matchesGroup(a, 'retinoids') && matchesGroup(a, 'aha'),
    message: 'Using a retinoid alongside an AHA in the same session can over-exfoliate and compromise your skin barrier. Alternate nights instead.' },
  { key: 'retinoid-bha', severity: 'high', title: 'Retinoid + BHA',
    check: a => matchesGroup(a, 'retinoids') && matchesGroup(a, 'bha'),
    message: 'Retinoids and salicylic acid together risk significant irritation and barrier disruption. Alternate their use across nights.' },
  { key: 'retinoid-vitc', severity: 'medium', title: 'Retinoid + Vitamin C (L-AA)',
    check: a => matchesGroup(a, 'retinoids') && matchesGroup(a, 'vitc_strong'),
    message: 'L-ascorbic acid works best at low pH; retinoids need higher pH to be stable. Layering both can reduce efficacy and increase irritation.' },
  { key: 'bp-retinoid', severity: 'high', title: 'Benzoyl Peroxide + Retinoid',
    check: a => matchesGroup(a, 'bp') && matchesGroup(a, 'retinoids'),
    message: 'Benzoyl peroxide can oxidise and deactivate retinol, making it ineffective. Use BP in the morning and retinoid at night.' },
  { key: 'bp-vitc', severity: 'medium', title: 'Benzoyl Peroxide + Vitamin C',
    check: a => matchesGroup(a, 'bp') && matchesGroup(a, 'vitc_strong'),
    message: 'Both are oxidising agents — combining them may cause irritation and reduce the effectiveness of vitamin C.' },
  { key: 'aha-bha-pha', severity: 'medium', title: 'Multiple exfoliants',
    check: a => [matchesGroup(a, 'aha'), matchesGroup(a, 'bha'), matchesGroup(a, 'pha')].filter(Boolean).length >= 2,
    message: 'Layering two or more exfoliating acids (AHA, BHA, PHA) in one session can over-strip the skin barrier. Pick one per routine.' },
  { key: 'multi-retinoid', severity: 'high', title: 'Multiple retinoids',
    check: a => ACTIVE_GROUPS['retinoids']!.filter(r => a.includes(r)).length >= 2,
    message: 'Stacking more than one retinoid significantly increases the risk of retinoid dermatitis. Use only one at a time.' },
];

type RoutineItemWithProduct = RoutineItem & { product: Product };

interface ConflictAlertsProps {
  amActives: string[];
  pmActives: string[];
  amItems: RoutineItemWithProduct[];
  pmItems: RoutineItemWithProduct[];
  today: string;
}

function ConflictAlerts({ amActives, pmActives, amItems, pmItems, today }: ConflictAlertsProps) {
  const { dispatch, store } = useAppContext();
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissedConflicts') ?? '[]') as string[]; }
    catch { return []; }
  });

  const dismiss = (key: string) => {
    const next = [...dismissed, key];
    setDismissed(next);
    sessionStorage.setItem('dismissedConflicts', JSON.stringify(next));
  };

  const isSkipped = (routineItemId: string, period: Period) =>
    store.logs.some(l => l.date === today && l.routineItemId === routineItemId && l.period === period && l.skipped);

  const toggleSkip = (item: RoutineItemWithProduct, period: Period) => {
    if (isSkipped(item.id, period)) {
      dispatch({ type: 'UNSKIP_TODAY', payload: { date: today, routineItemId: item.id, period } });
    } else {
      dispatch({ type: 'SKIP_TODAY', payload: { date: today, routineItemId: item.id, period, completed: false, skipped: true } });
    }
  };

  const getInvolvedItems = (rule: ConflictRule, period: Period) => {
    const items = period === 'AM' ? amItems : pmItems;
    const allActives = period === 'AM' ? amActives : pmActives;
    return items.filter(item => {
      if (!item.product?.actives?.length) return false;
      const withoutThis = allActives.filter(a => !item.product.actives.includes(a));
      return !rule.check(withoutThis);
    });
  };

  const amConflicts = CONFLICT_RULES.filter(r => r.check(amActives)).map(r => ({ ...r, period: 'AM' as Period }));
  const pmConflicts = CONFLICT_RULES.filter(r => r.check(pmActives)).map(r => ({ ...r, period: 'PM' as Period }));
  const visible = [...amConflicts, ...pmConflicts].filter(c => !dismissed.includes(`${c.period}-${c.key}`));

  if (!visible.length) return null;

  return (
    <div className="space-y-2">
      {visible.map(c => {
        const involved = getInvolvedItems(c, c.period);
        const isHigh = c.severity === 'high';
        return (
          <div key={`${c.period}-${c.key}`}
            className={`px-4 py-3.5 rounded-xl border ${isHigh
              ? 'border-terra-200 bg-terra-50 dark:border-terra-800/60 dark:bg-terra-900/20'
              : 'border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20'}`}>
            <div className="flex gap-3">
              <Icon name="alertCircle" size={16} className={`${isHigh ? 'text-terra-400' : 'text-amber-400'} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{c.title}</p>
                  <Badge color={isHigh ? 'terra' : 'yellow'} size="xs">{c.period}</Badge>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">{c.message}</p>
                {involved.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">Skip one for tonight:</p>
                    <div className="flex flex-wrap gap-2">
                      {involved.map(item => {
                        const skipped = isSkipped(item.id, c.period);
                        return (
                          <button key={item.id} type="button" onClick={() => toggleSkip(item, c.period)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                              skipped
                                ? 'bg-stone-200 dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 text-stone-500 dark:text-stone-400 line-through'
                                : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-stone-300 hover:border-terra-300 dark:hover:border-terra-700 hover:bg-terra-50 dark:hover:bg-terra-900/20'
                            }`}>
                            <Icon name={skipped ? 'check' : 'x'} size={12} className={skipped ? 'text-stone-400' : 'text-terra-400'} />
                            {item.product.name}
                            {skipped && <span className="ml-1 text-[10px] not-italic no-underline font-normal text-stone-400">(skipped)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => dismiss(`${c.period}-${c.key}`)}
                className="flex-shrink-0 p-1 rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors self-start">
                <Icon name="x" size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { store, dispatch } = useAppContext();
  const { products, routine, logs } = store;
  const tz = store.userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const today = getTodayInTz(tz);
  const todayLogs = logs.filter(l => l.date === today);

  function shouldShowToday(item: RoutineItem): boolean {
    const startStr = item.startDate;
    if (!startStr || startStr > today) return false;
    const startMs = new Date(startStr + 'T00:00:00').getTime();
    const todayMs = new Date(today + 'T00:00:00').getTime();
    const daysDiff = Math.round((todayMs - startMs) / 86400000);
    const todayLocal = new Date(today + 'T00:00:00');
    if (item.frequency === 'daily') return true;
    if (item.frequency === 'alternate') return daysDiff % 2 === 0;
    if (item.frequency === '2x-week') return [1, 4].includes(todayLocal.getDay());
    if (item.frequency === '1x-week') return todayLocal.getDay() === 1;
    return true;
  }

  const getRoutineForPeriod = (period: Period): RoutineItemWithProduct[] =>
    routine
      .filter(r => r.period === period)
      .sort((a, b) => a.order - b.order)
      .map(r => ({ ...r, product: products.find(p => p.id === r.productId)! }))
      .filter(r => r.product && shouldShowToday(r));

  const isChecked = (routineItemId: string, period: Period) =>
    todayLogs.some(l => l.routineItemId === routineItemId && l.period === period && l.completed);

  const isSkipped = (routineItemId: string, period: Period) =>
    todayLogs.some(l => l.routineItemId === routineItemId && l.period === period && l.skipped);

  const toggleItem = (routineItemId: string, period: Period) => {
    if (isChecked(routineItemId, period)) {
      dispatch({ type: 'REMOVE_LOG', payload: { date: today, routineItemId, period } });
    } else {
      dispatch({ type: 'ADD_LOG', payload: { date: today, routineItemId, period, completed: true } });
    }
  };

  const streak = computeStreak(logs);
  const longest = longestStreak(logs);
  const amItems = getRoutineForPeriod('AM');
  const pmItems = getRoutineForPeriod('PM');
  const amActives = [...new Set(amItems.flatMap(r => r.product?.actives ?? []))];
  const pmActives = [...new Set(pmItems.flatMap(r => r.product?.actives ?? []))];
  const amLoad = computeBarrierLoad(amActives);
  const pmLoad = computeBarrierLoad(pmActives);
  const amDone = amItems.filter(r => isChecked(r.id, 'AM')).length;
  const pmDone = pmItems.filter(r => isChecked(r.id, 'PM')).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  function RoutineCard({ period, items, load, done }: { period: Period; items: RoutineItemWithProduct[]; load: number; done: number }) {
    const totalItems = items.length;
    const pct = totalItems ? Math.round(done / totalItems * 100) : 0;
    const allDone = done === totalItems && totalItems > 0;
    const isAM = period === 'AM';

    return (
      <Card className="overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-stone-50 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isAM ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-400'}`}>
              <Icon name={isAM ? 'sun' : 'moon'} size={14} />
            </div>
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{period} Routine</span>
          </div>
          <div className="flex items-center gap-2">
            {allDone && <Badge color="sage">Complete ✓</Badge>}
            <span className="text-xs text-stone-400 dark:text-stone-500">{done}/{totalItems}</span>
          </div>
        </div>
        <div className="h-0.5 bg-stone-50 dark:bg-zinc-800">
          <div className={`h-full transition-all duration-500 ${allDone ? 'bg-sage-400' : 'bg-sage-300'}`}
            style={{ width: `${pct}%` }} />
        </div>
        <div className="p-5 space-y-2">
          {items.length === 0 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 py-2">No products scheduled for today.</p>
          )}
          {items.map(item => {
            const checked = isChecked(item.id, period);
            const skipped = isSkipped(item.id, period);
            return (
              <button key={item.id}
                onClick={() => !skipped && toggleItem(item.id, period)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                  skipped  ? 'bg-stone-50 dark:bg-zinc-800/50 opacity-60 cursor-default'
                  : checked ? 'bg-sage-50 dark:bg-sage-900/20'
                  : 'hover:bg-stone-50 dark:hover:bg-zinc-800'
                }`}>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
                  skipped  ? 'border-stone-300 dark:border-zinc-600 bg-stone-100 dark:bg-zinc-700'
                  : checked ? 'border-sage-500 bg-sage-500'
                  : 'border-stone-300 dark:border-zinc-600'
                }`}>
                  {checked && !skipped && <Icon name="check" size={11} className="text-white" />}
                  {skipped && <Icon name="x" size={10} className="text-stone-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-colors ${
                    skipped || checked ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-300'
                  }`}>{item.product?.name}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {item.product?.brand} · {item.product?.type}
                    {skipped && <span className="ml-1.5 text-terra-400 font-medium">· skipped today</span>}
                  </p>
                </div>
                {!skipped && (item.product?.actives?.length ?? 0) > 0 && (
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 w-32">
                    {item.product.actives.slice(0, 2).map(a => (
                      <Badge key={a} color="sage" size="xs">{a}</Badge>
                    ))}
                    {item.product.actives.length > 2 && (
                      <Badge color="stone" size="xs">+{item.product.actives.length - 2} more</Badge>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {items.length > 0 && (
          <div className="px-5 pb-4">
            <BarrierLoadMeter score={load} />
          </div>
        )}
      </Card>
    );
  }

  const STATS = [
    { label: 'Streak', icon: 'flame', bg: 'bg-amber-50 dark:bg-amber-900/20', color: 'text-amber-500',
      value: <><span className="text-2xl font-bold text-stone-800 dark:text-stone-100">{streak}</span><span className="text-sm font-normal text-stone-400 ml-1">days</span></>,
      sub: `Best: ${longest} days` },
    { label: 'AM Load', icon: 'sun', bg: 'bg-amber-50 dark:bg-amber-900/20', color: 'text-amber-400',
      value: <><span className="text-2xl font-bold text-stone-800 dark:text-stone-100">{amLoad}</span><span className="text-sm font-normal text-stone-400 ml-1">pts</span></>,
      sub: barrierLoadLabel(amLoad).label },
    { label: 'PM Load', icon: 'moon', bg: 'bg-indigo-50 dark:bg-indigo-900/20', color: 'text-indigo-400',
      value: <><span className="text-2xl font-bold text-stone-800 dark:text-stone-100">{pmLoad}</span><span className="text-sm font-normal text-stone-400 ml-1">pts</span></>,
      sub: barrierLoadLabel(pmLoad).label },
    { label: 'Products', icon: 'package', bg: 'bg-sage-50 dark:bg-sage-900/20', color: 'text-sage-500',
      value: <><span className="text-2xl font-bold text-stone-800 dark:text-stone-100">{products.filter(p => p.status === 'active').length}</span><span className="text-sm font-normal text-stone-400 ml-1">active</span></>,
      sub: `${products.filter(p => p.status === 'unopened').length} unopened` },
  ];

  const expiringSoon = products.filter(p => {
    if (p.status !== 'active' || !p.openedDate || !p.pao) return false;
    const expiry = new Date(computeExpiry(p.openedDate, p.pao)!);
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
    return daysLeft <= 60 && daysLeft > 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">{dayLabel}</p>
          <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Good {greeting} 👋</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => (
          <Card key={s.label} className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">{s.label}</span>
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                <Icon name={s.icon} size={14} />
              </div>
            </div>
            <div>
              <p>{s.value}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <ConflictAlerts amActives={amActives} pmActives={pmActives} amItems={amItems} pmItems={pmItems} today={today} />

      <div className="grid md:grid-cols-2 gap-4">
        <RoutineCard period="AM" items={amItems} load={amLoad} done={amDone} />
        <RoutineCard period="PM" items={pmItems} load={pmLoad} done={pmDone} />
      </div>

      {expiringSoon.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="alertCircle" size={15} className="text-terra-400" />
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Expiring soon</span>
          </div>
          <div className="space-y-2">
            {expiringSoon.map(p => {
              const expiry = computeExpiry(p.openedDate, p.pao)!;
              const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-50 dark:border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{p.name}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">{p.brand}</p>
                  </div>
                  <Badge color={days <= 14 ? 'terra' : 'yellow'}>{days}d left</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
