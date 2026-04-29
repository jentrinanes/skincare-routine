// ── Conflict rules ────────────────────────────────────────────────────────────
const ACTIVE_GROUPS = {
  retinoids:  ['Retinol','Retinaldehyde','Tretinoin'],
  aha:        ['AHA – Glycolic Acid','AHA – Lactic Acid','AHA – Mandelic Acid'],
  bha:        ['BHA – Salicylic Acid'],
  pha:        ['PHA – Gluconolactone','PHA – Lactobionic Acid'],
  vitc_strong:['Vitamin C (L-AA)'],
  vitc_stable:['Vitamin C (MAP)','Vitamin C (AA2G)'],
  bp:         ['Benzoyl Peroxide'],
  azelaic:    ['Azelaic Acid'],
};

const matchesGroup = (actives, group) =>
  ACTIVE_GROUPS[group].some(a => actives.includes(a));

const CONFLICT_RULES = [
  {
    key: 'retinoid-aha',
    check: (a) => matchesGroup(a,'retinoids') && matchesGroup(a,'aha'),
    severity: 'high',
    title: 'Retinoid + AHA',
    message: 'Using a retinoid alongside an AHA in the same session can over-exfoliate and compromise your skin barrier. Alternate nights instead.',
  },
  {
    key: 'retinoid-bha',
    check: (a) => matchesGroup(a,'retinoids') && matchesGroup(a,'bha'),
    severity: 'high',
    title: 'Retinoid + BHA',
    message: 'Retinoids and salicylic acid together risk significant irritation and barrier disruption. Alternate their use across nights.',
  },
  {
    key: 'retinoid-vitc',
    check: (a) => matchesGroup(a,'retinoids') && matchesGroup(a,'vitc_strong'),
    severity: 'medium',
    title: 'Retinoid + Vitamin C (L-AA)',
    message: 'L-ascorbic acid works best at low pH; retinoids need higher pH to be stable. Layering both can reduce efficacy and increase irritation.',
  },
  {
    key: 'bp-retinoid',
    check: (a) => matchesGroup(a,'bp') && matchesGroup(a,'retinoids'),
    severity: 'high',
    title: 'Benzoyl Peroxide + Retinoid',
    message: 'Benzoyl peroxide can oxidise and deactivate retinol, making it ineffective. Use BP in the morning and retinoid at night.',
  },
  {
    key: 'bp-vitc',
    check: (a) => matchesGroup(a,'bp') && matchesGroup(a,'vitc_strong'),
    severity: 'medium',
    title: 'Benzoyl Peroxide + Vitamin C',
    message: 'Both are oxidising agents — combining them may cause irritation and reduce the effectiveness of vitamin C.',
  },
  {
    key: 'aha-bha-pha',
    check: (a) => {
      const groups = [matchesGroup(a,'aha'), matchesGroup(a,'bha'), matchesGroup(a,'pha')];
      return groups.filter(Boolean).length >= 2;
    },
    severity: 'medium',
    title: 'Multiple exfoliants',
    message: 'Layering two or more exfoliating acids (AHA, BHA, PHA) in one session can over-strip the skin barrier. Pick one per routine.',
  },
  {
    key: 'multi-retinoid',
    check: (a) => ACTIVE_GROUPS.retinoids.filter(r => a.includes(r)).length >= 2,
    severity: 'high',
    title: 'Multiple retinoids',
    message: 'Stacking more than one retinoid significantly increases the risk of retinoid dermatitis. Use only one at a time.',
  },
];

function detectConflicts(actives, period) {
  return CONFLICT_RULES
    .filter(r => r.check(actives))
    .map(r => ({ ...r, period }));
}

// Find which specific routine items contribute to a conflict rule
function findConflictingItems(rule, routineItems, products) {
  return routineItems.filter(item => {
    const p = products.find(x => x.id === item.productId);
    if (!p) return false;
    const a = p.actives || [];
    // Check if this product has any active from the conflicting groups
    return CONFLICT_RULES.find(r => r.key === rule.key) &&
      Object.values(ACTIVE_GROUPS).some(group =>
        group.some(active => a.includes(active) &&
          rule.check(a) !== rule.check(a.filter(x => x !== active))
        )
      );
  });
}

// ── Conflict Alert Banner ─────────────────────────────────────────────────────
const ConflictAlerts = ({ amActives, pmActives, amItems, pmItems, products, today }) => {
  const { dispatch, store } = useContext(AppContext);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissedConflicts') || '[]'); } catch { return []; }
  });

  const dismiss = (key) => {
    const next = [...dismissed, key];
    setDismissed(next);
    sessionStorage.setItem('dismissedConflicts', JSON.stringify(next));
  };

  const isSkipped = (routineItemId, period) =>
    store.logs.some(l => l.date === today && l.routineItemId === routineItemId && l.period === period && l.skipped);

  const toggleSkip = (item, period) => {
    if (isSkipped(item.id, period)) {
      dispatch({ type: 'UNSKIP_TODAY', payload: { date: today, routineItemId: item.id, period } });
    } else {
      dispatch({ type: 'SKIP_TODAY', payload: { date: today, routineItemId: item.id, period } });
    }
  };

  // For each conflict, find which products are involved
  function getInvolvedItems(rule, period) {
    const items = period === 'AM' ? amItems : pmItems;
    return items.filter(item => {
      const p = products.find(x => x.id === item.productId);
      if (!p?.actives?.length) return false;
      // Check if removing this product's actives resolves the conflict
      const withoutThis = (period === 'AM' ? amActives : pmActives).filter(a => !p.actives.includes(a));
      return !rule.check(withoutThis);
    });
  }

  const amConflicts = detectConflicts(amActives, 'AM');
  const pmConflicts = detectConflicts(pmActives, 'PM');
  const all = [...amConflicts, ...pmConflicts];
  const visible = all.filter(c => !dismissed.includes(`${c.period}-${c.key}`));

  if (!visible.length) return null;

  const sevColor = (s) => s === 'high'
    ? 'border-terra-200 bg-terra-50 dark:border-terra-800/60 dark:bg-terra-900/20'
    : 'border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20';
  const sevIcon = (s) => s === 'high' ? 'text-terra-400' : 'text-amber-400';
  const sevBadge = (s) => s === 'high' ? 'terra' : 'yellow';

  return (
    <div className="space-y-2">
      {visible.map(c => {
        const involved = getInvolvedItems(c, c.period);
        return (
          <div key={`${c.period}-${c.key}`}
            className={`px-4 py-3.5 rounded-xl border ${sevColor(c.severity)}`}>
            <div className="flex gap-3">
              <Icon name="alertCircle" size={16} className={`${sevIcon(c.severity)} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{c.title}</p>
                  <Badge color={sevBadge(c.severity)} size="xs">{c.period}</Badge>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">{c.message}</p>

                {/* Conflicting products — pick one to skip */}
                {involved.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">
                      Skip one for tonight:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {involved.map(item => {
                        const prod = products.find(x => x.id === item.productId);
                        if (!prod) return null;
                        const skipped = isSkipped(item.id, c.period);
                        return (
                          <button key={item.id} type="button"
                            onClick={() => toggleSkip(item, c.period)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150
                              ${skipped
                                ? 'bg-stone-200 dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 text-stone-500 dark:text-stone-400 line-through'
                                : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-stone-300 hover:border-terra-300 dark:hover:border-terra-700 hover:bg-terra-50 dark:hover:bg-terra-900/20'
                              }`}>
                            {skipped
                              ? <Icon name="check" size={12} className="text-stone-400" />
                              : <Icon name="x" size={12} className="text-terra-400" />}
                            {prod.name}
                            {skipped && <span className="ml-1 text-[10px] not-italic no-underline font-normal text-stone-400">(skipped)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(`${c.period}-${c.key}`)}
                className="flex-shrink-0 p-1 rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors self-start"
                title="Dismiss">
                <Icon name="x" size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { store, dispatch } = useContext(AppContext);
  const { products, routine, logs } = store;
  const tz = store.userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  // Always use the user's configured timezone for "today"
  const _now = new Date();
  const today = getTodayInTz(tz);
  const todayLogs = logs.filter(l => l.date === today);

  function shouldShowToday(item) {
    const startStr = item.startDate; // 'YYYY-MM-DD'
    if (!startStr || startStr > today) return false; // future start
    // Parse both as local midnight to avoid DST/UTC offset issues
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

  const getRoutineForPeriod = (period) =>
    routine.filter(r => r.period === period)
      .sort((a, b) => a.order - b.order)
      .map(r => ({ ...r, product: products.find(p => p.id === r.productId) }))
      .filter(r => r.product && shouldShowToday(r));

  const isChecked = (routineItemId, period) =>
    todayLogs.some(l => l.routineItemId === routineItemId && l.period === period && l.completed);

  const isSkipped = (routineItemId, period) =>
    todayLogs.some(l => l.routineItemId === routineItemId && l.period === period && l.skipped);

  const toggleItem = (routineItemId, period) => {
    const already = isChecked(routineItemId, period);
    if (already) {
      dispatch({ type:'REMOVE_LOG', payload:{ date:today, routineItemId, period } });
    } else {
      dispatch({ type:'ADD_LOG', payload:{ date:today, routineItemId, period, completed:true } });
    }
  };

  const streak = computeStreak(logs);
  const longest = longestStreak(logs);

  const amItems = getRoutineForPeriod('AM');
  const pmItems = getRoutineForPeriod('PM');

  const amActives = [...new Set(amItems.flatMap(r => r.product?.actives || []))];
  const pmActives = [...new Set(pmItems.flatMap(r => r.product?.actives || []))];
  const amLoad = computeBarrierLoad(amActives);
  const pmLoad = computeBarrierLoad(pmActives);

  const amDone = amItems.filter(r => isChecked(r.id, 'AM')).length;
  const pmDone = pmItems.filter(r => isChecked(r.id, 'PM')).length;

  const dayLabel = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });

  const RoutineCard = ({ period, items, load, done }) => {
    const totalItems = items.length;
    const pct = totalItems ? Math.round(done / totalItems * 100) : 0;
    const allDone = done === totalItems && totalItems > 0;
    return (
      <Card className="overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-stone-50 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${period === 'AM' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-400'}`}>
              <Icon name={period === 'AM' ? 'sun' : 'moon'} size={14} />
            </div>
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{period} Routine</span>
          </div>
          <div className="flex items-center gap-2">
            {allDone && <Badge color="sage">Complete ✓</Badge>}
            <span className="text-xs text-stone-400 dark:text-stone-500">{done}/{totalItems}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-stone-50 dark:bg-zinc-800">
          <div className={`h-full transition-all duration-500 ${allDone ? 'bg-sage-400' : 'bg-sage-300'}`}
            style={{ width:`${pct}%` }} />
        </div>
        <div className="p-5 space-y-2">
          {items.length === 0 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 py-2">No products scheduled for today.</p>
          )}
          {items.map(item => {
            const checked = isChecked(item.id, period);
            const skipped = isSkipped(item.id, period);
            return (
              <button
                key={item.id}
                onClick={() => !skipped && toggleItem(item.id, period)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150
                  ${skipped  ? 'bg-stone-50 dark:bg-zinc-800/50 opacity-60 cursor-default'
                  : checked  ? 'bg-sage-50 dark:bg-sage-900/20'
                  : 'hover:bg-stone-50 dark:hover:bg-zinc-800'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150
                  ${skipped  ? 'border-stone-300 dark:border-zinc-600 bg-stone-100 dark:bg-zinc-700'
                  : checked  ? 'border-sage-500 bg-sage-500'
                  : 'border-stone-300 dark:border-zinc-600'}`}>
                  {checked && !skipped && <Icon name="check" size={11} className="text-white" />}
                  {skipped && <Icon name="x" size={10} className="text-stone-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-colors
                    ${skipped || checked ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-300'}`}>
                    {item.product?.name}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {item.product?.brand} · {item.product?.type}
                    {skipped && <span className="ml-1.5 text-terra-400 font-medium">· skipped today</span>}
                  </p>
                </div>
                {!skipped && item.product?.actives?.length > 0 && (
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">{dayLabel}</p>
          <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</h1>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Streak */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">Streak</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
              <Icon name="flame" size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{streak}<span className="text-sm font-normal text-stone-400 ml-1">days</span></p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Best: {longest} days</p>
          </div>
        </Card>

        {/* AM Load */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">AM Load</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-400">
              <Icon name="sun" size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{amLoad}<span className="text-sm font-normal text-stone-400 ml-1">pts</span></p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{barrierLoadLabel(amLoad).label}</p>
          </div>
        </Card>

        {/* PM Load */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">PM Load</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-400">
              <Icon name="moon" size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{pmLoad}<span className="text-sm font-normal text-stone-400 ml-1">pts</span></p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{barrierLoadLabel(pmLoad).label}</p>
          </div>
        </Card>

        {/* Products */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">Products</span>
            <div className="w-7 h-7 rounded-lg bg-sage-50 dark:bg-sage-900/20 flex items-center justify-center text-sage-500">
              <Icon name="package" size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{products.filter(p=>p.status==='active').length}<span className="text-sm font-normal text-stone-400 ml-1">active</span></p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{products.filter(p=>p.status==='unopened').length} unopened</p>
          </div>
        </Card>
      </div>

      {/* Conflict alerts */}
      <ConflictAlerts amActives={amActives} pmActives={pmActives} amItems={amItems} pmItems={pmItems} products={products} today={today} />

      {/* Routine cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <RoutineCard period="AM" items={amItems} load={amLoad} done={amDone} />
        <RoutineCard period="PM" items={pmItems} load={pmLoad} done={pmDone} />
      </div>

      {/* Expiry warnings */}
      {(() => {
        const soon = products.filter(p => {
          if (p.status !== 'active' || !p.openedDate || !p.pao) return false;
          const expiry = new Date(computeExpiry(p.openedDate, p.pao));
          const daysLeft = Math.ceil((expiry - new Date()) / 86400000);
          return daysLeft <= 60 && daysLeft > 0;
        });
        if (!soon.length) return null;
        return (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="alertCircle" size={15} className="text-terra-400" />
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Expiring soon</span>
            </div>
            <div className="space-y-2">
              {soon.map(p => {
                const expiry = computeExpiry(p.openedDate, p.pao);
                const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
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
        );
      })()}
    </div>
  );
};

window.Dashboard = Dashboard;
