// ── Timeline Page (redesigned) ────────────────────────────────────────────────

function usageDuration(openedDate) {
  if (!openedDate) return null;
  const start = new Date(openedDate + 'T00:00:00');
  const now = new Date();
  const totalDays = Math.max(0, Math.floor((now - start) / 86400000));
  const months = Math.floor(totalDays / 30);
  const weeks  = Math.floor((totalDays % 30) / 7);
  const days   = totalDays % 7;

  if (totalDays === 0) return { label: 'Started today', short: 'Day 1', days: 0 };
  if (totalDays < 7)  return { label: `${totalDays} day${totalDays > 1 ? 's' : ''}`, short: `${totalDays}d`, days: totalDays };
  if (totalDays < 30) {
    const w = Math.floor(totalDays / 7);
    const d = totalDays % 7;
    const label = d > 0 ? `${w} week${w>1?'s':''}, ${d} day${d>1?'s':''}` : `${w} week${w>1?'s':''}`;
    return { label, short: `${w}w`, days: totalDays };
  }
  if (months < 12) {
    const label = weeks > 0
      ? `${months} month${months>1?'s':''}, ${weeks} week${weeks>1?'s':''}`
      : `${months} month${months>1?'s':''}`;
    return { label, short: `${months}mo`, days: totalDays };
  }
  const yrs = Math.floor(months / 12);
  const mo  = months % 12;
  const label = mo > 0 ? `${yrs} yr, ${mo} mo` : `${yrs} yr${yrs>1?'s':''}`;
  return { label, short: `${yrs}yr`, days: totalDays };
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function paoProgress(openedDate, paoMonths) {
  if (!openedDate || !paoMonths) return 0;
  const start = new Date(openedDate + 'T00:00:00');
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + paoMonths);
  const total = expiry - start;
  const elapsed = new Date() - start;
  return Math.min(Math.max(elapsed / total, 0), 1);
}

function daysUntilExpiry(openedDate, paoMonths) {
  if (!openedDate || !paoMonths) return null;
  const expiry = new Date(computeExpiry(openedDate, paoMonths) + 'T00:00:00');
  return Math.ceil((expiry - new Date()) / 86400000);
}

const ProductUsageCard = ({ p }) => {
  const dur = usageDuration(p.openedDate);
  const progress = paoProgress(p.openedDate, p.pao);
  const daysLeft = daysUntilExpiry(p.openedDate, p.pao);
  const expiry = p.openedDate && p.pao ? computeExpiry(p.openedDate, p.pao) : null;
  const expired = daysLeft !== null && daysLeft <= 0;
  const expiresSoon = !expired && daysLeft !== null && daysLeft <= 30;

  const progressColor = expired
    ? 'bg-terra-400'
    : expiresSoon
      ? 'bg-amber-400'
      : 'bg-sage-400';

  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 leading-snug">{p.name}</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{p.brand}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Badge color="stone">{p.type}</Badge>
          {expired && <Badge color="terra">Expired</Badge>}
          {expiresSoon && !expired && <Badge color="yellow">{daysLeft}d left</Badge>}
        </div>
      </div>

      {/* Duration — hero stat */}
      {dur ? (
        <div className="bg-sage-50 dark:bg-sage-900/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center text-sage-600 dark:text-sage-400 flex-shrink-0">
            <Icon name="clock" size={17} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">In use for</p>
            <p className="text-base font-semibold text-sage-700 dark:text-sage-300">{dur.label}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] text-stone-400 dark:text-stone-500">Day</p>
            <p className="text-base font-semibold text-stone-600 dark:text-stone-400">{dur.days + 1}</p>
          </div>
        </div>
      ) : (
        <div className="bg-stone-50 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-zinc-700 flex items-center justify-center text-stone-400 flex-shrink-0">
            <Icon name="package" size={17} />
          </div>
          <p className="text-sm text-stone-400 dark:text-stone-500">Not opened yet</p>
        </div>
      )}

      {/* PAO progress bar */}
      {p.openedDate && p.pao && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500">
            <span>Opened {formatDate(p.openedDate)}</span>
            <span>{expired ? 'Expired' : `Expires ${formatDate(expiry)}`}</span>
          </div>
          <div className="h-2 bg-stone-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
              style={{ width: `${Math.max(progress * 100, 2)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-400 dark:text-stone-500">{Math.round(progress * 100)}% used</span>
            <span className={expired ? 'text-terra-500' : expiresSoon ? 'text-amber-500' : 'text-stone-400 dark:text-stone-500'}>
              {expired ? 'Past PAO' : `${daysLeft}d remaining`} · {p.pao}M PAO
            </span>
          </div>
        </div>
      )}

      {/* Actives */}
      {p.actives?.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-stone-50 dark:border-zinc-800">
          <ActivesBadges actives={p.actives} max={5} />
        </div>
      )}
    </Card>
  );
};

const Timeline = () => {
  const { store } = useContext(AppContext);
  const { products } = store;
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('duration'); // duration | expiry | name
  const [search, setSearch] = useState('');

  const relevant = products.filter(p => p.status === 'active' || p.status === 'finished' || p.status === 'unopened');

  const types = [...new Set(relevant.map(p => p.type))].sort();

  const filtered = relevant
    .filter(p => {
      if (filter !== 'all' && p.type !== filter) return false;
      if (search && !`${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'duration') {
        const da = a.openedDate ? new Date(a.openedDate) : new Date();
        const db = b.openedDate ? new Date(b.openedDate) : new Date();
        return da - db; // oldest first = longest use
      }
      if (sort === 'expiry') {
        const ea = a.openedDate && a.pao ? new Date(computeExpiry(a.openedDate, a.pao)) : new Date('9999');
        const eb = b.openedDate && b.pao ? new Date(computeExpiry(b.openedDate, b.pao)) : new Date('9999');
        return ea - eb;
      }
      return a.name.localeCompare(b.name);
    });

  // Summary stats
  const opened = products.filter(p => p.openedDate && p.status === 'active');
  const totalDays = opened.reduce((sum, p) => sum + (usageDuration(p.openedDate)?.days || 0), 0);
  const avgDays = opened.length ? Math.round(totalDays / opened.length) : 0;
  const longestP = [...opened].sort((a,b) => (usageDuration(b.openedDate)?.days||0) - (usageDuration(a.openedDate)?.days||0))[0];
  const expiringCount = opened.filter(p => {
    const d = daysUntilExpiry(p.openedDate, p.pao);
    return d !== null && d <= 30 && d > 0;
  }).length;

  return (
    <div>
      <PageHeader title="Timeline" subtitle="Track how long you've been using each product" />

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label:'Products in use', value: opened.length, icon:'package', color:'sage' },
          { label:'Avg. usage', value: avgDays < 7 ? `${avgDays}d` : avgDays < 30 ? `${Math.floor(avgDays/7)}w` : `${Math.floor(avgDays/30)}mo`, icon:'clock', color:'sage' },
          { label:'Longest running', value: longestP ? usageDuration(longestP.openedDate)?.short || '—' : '—', icon:'flame', color:'yellow' },
          { label:'Expiring soon', value: expiringCount, icon:'alertCircle', color: expiringCount > 0 ? 'terra' : 'stone' },
        ].map(s => (
          <Card key={s.label} className="px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
              ${s.color==='sage' ? 'bg-sage-50 dark:bg-sage-900/20 text-sage-500'
              : s.color==='yellow' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'
              : s.color==='terra' ? 'bg-terra-50 dark:bg-terra-900/20 text-terra-400'
              : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'}`}>
              <Icon name={s.icon} size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-stone-800 dark:text-stone-100">{s.value}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600" />
          <input className={`${inputCls} pl-8`} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter==='all' ? 'bg-sage-500 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-700'}`}>
            All
          </button>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===t ? 'bg-sage-500 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-700'}`}>
              {t}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-400 border-none outline-none cursor-pointer">
          <option value="duration">Sort: Longest first</option>
          <option value="expiry">Sort: Expiring soonest</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="clock" title="Nothing to show"
          description="Open some products to start tracking how long you've been using them." />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => <ProductUsageCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
};

window.Timeline = Timeline;
