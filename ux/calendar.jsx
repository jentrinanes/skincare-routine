// ── Calendar Page ─────────────────────────────────────────────────────────────

const CalendarPage = () => {
  const { store } = useContext(AppContext);
  const { logs, routine, products } = store;
  const tz = store.userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const today = getTodayInTz(tz);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(today + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);

  const { year, month } = viewDate;

  const prevMonth = () => setViewDate(v => {
    const d = new Date(v.year, v.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setViewDate(v => {
    const d = new Date(v.year, v.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  // Build all cells (nulls for padding, date strings for real days)
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push(dateStr);
  }
  // Pad end to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  // Index logs by date
  const logsByDate = {};
  logs.forEach(l => {
    if (!logsByDate[l.date]) logsByDate[l.date] = [];
    logsByDate[l.date].push(l);
  });

  // Get product info for a log entry
  const getProduct = (log) => {
    const routineItem = routine.find(r => r.id === log.routineItemId);
    if (!routineItem) return null;
    return products.find(p => p.id === routineItem.productId) || null;
  };

  // For a given date, get completed AM and PM products
  const getDayData = (dateStr) => {
    const dayLogs = logsByDate[dateStr] || [];
    const completed = dayLogs.filter(l => l.completed && !l.skipped);
    const skipped   = dayLogs.filter(l => l.skipped);
    const am = completed.filter(l => l.period === 'AM').map(getProduct).filter(Boolean);
    const pm = completed.filter(l => l.period === 'PM').map(getProduct).filter(Boolean);
    const amSkipped = skipped.filter(l => l.period === 'AM').map(getProduct).filter(Boolean);
    const pmSkipped = skipped.filter(l => l.period === 'PM').map(getProduct).filter(Boolean);
    return { am, pm, amSkipped, pmSkipped, total: completed.length };
  };

  // Colour-code a day cell by completion
  const getDayMood = (dateStr) => {
    const data = getDayData(dateStr);
    if (data.total === 0) return 'empty';
    const amRoutineCount = routine.filter(r => r.period === 'AM').length;
    const pmRoutineCount = routine.filter(r => r.period === 'PM').length;
    const totalPossible  = amRoutineCount + pmRoutineCount;
    if (totalPossible === 0) return 'empty';
    const pct = data.total / totalPossible;
    if (pct >= 1)   return 'full';
    if (pct >= 0.5) return 'partial';
    return 'light';
  };

  const moodStyles = {
    empty:   '',
    light:   'bg-sage-100 dark:bg-sage-900/30',
    partial: 'bg-sage-200 dark:bg-sage-800/40',
    full:    'bg-sage-400 dark:bg-sage-600',
  };
  const moodText = {
    empty:   'text-stone-700 dark:text-stone-300',
    light:   'text-sage-700 dark:text-sage-300',
    partial: 'text-sage-800 dark:text-sage-200',
    full:    'text-white dark:text-white',
  };

  // Selected day panel
  const selData = selected ? getDayData(selected) : null;
  const selDate = selected ? new Date(selected + 'T00:00:00') : null;
  const selLabel = selDate ? selDate.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '';

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const ProductRow = ({ product, skipped }) => (
    <div className={`flex items-center gap-2.5 py-1.5 ${skipped ? 'opacity-50' : ''}`}>
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${skipped ? 'bg-stone-300 dark:bg-zinc-600' : 'bg-sage-400'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-stone-700 dark:text-stone-300 truncate ${skipped ? 'line-through' : ''}`}>{product.name}</p>
        <p className="text-xs text-stone-400 dark:text-stone-500">{product.brand}</p>
      </div>
      {product.actives?.length > 0 && <ActivesBadges actives={product.actives} max={2} />}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" subtitle="Your daily skincare log at a glance" />

      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        {/* Calendar grid */}
        <Card className="overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50 dark:border-zinc-800">
            <button onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
              <Icon name="chevronLeft" size={16} />
            </button>
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
              <Icon name="chevronRight" size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-stone-50 dark:border-zinc-800">
            {DAYS.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-medium text-stone-400 dark:text-stone-500">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`pad-${i}`} className="aspect-square border-b border-r border-stone-50 dark:border-zinc-800/50 last:border-r-0" />;

              const mood     = getDayMood(dateStr);
              const dayNum   = parseInt(dateStr.split('-')[2]);
              const isToday  = dateStr === today;
              const isSel    = dateStr === selected;
              const data     = getDayData(dateStr);
              const col      = (i + 1) % 7; // 0 = last col
              const isLastCol = col === 0;
              const isLastRow = i >= cells.length - 7;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelected(dateStr)}
                  className={`relative aspect-square flex flex-col items-center justify-start pt-2 px-1
                    border-b border-r border-stone-50 dark:border-zinc-800/50
                    ${isLastCol ? 'border-r-0' : ''}
                    ${isLastRow ? 'border-b-0' : ''}
                    transition-colors group
                    ${isSel ? 'bg-stone-50 dark:bg-zinc-800' : 'hover:bg-stone-50/70 dark:hover:bg-zinc-800/40'}`}
                >
                  {/* Date number */}
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors
                    ${isToday ? 'bg-sage-500 text-white' : moodText[mood]}`}>
                    {dayNum}
                  </span>

                  {/* Activity dots */}
                  {data.total > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {data.am.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="AM" />
                      )}
                      {data.pm.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="PM" />
                      )}
                    </div>
                  )}

                  {/* Mood fill strip at bottom */}
                  {mood !== 'empty' && (
                    <div className={`absolute bottom-0 left-1 right-1 h-0.5 rounded-full ${
                      mood === 'full'    ? 'bg-sage-400' :
                      mood === 'partial' ? 'bg-sage-300' :
                      'bg-sage-200 dark:bg-sage-800'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-stone-50 dark:border-zinc-800 flex gap-4">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-xs text-stone-400 dark:text-stone-500">AM done</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-400" /><span className="text-xs text-stone-400 dark:text-stone-500">PM done</span></div>
            <div className="flex items-center gap-1.5"><div className="w-6 h-1 rounded-full bg-sage-400" /><span className="text-xs text-stone-400 dark:text-stone-500">Full routine</span></div>
          </div>
        </Card>

        {/* Day detail panel */}
        <Card className="p-5">
          {selected ? (
            <>
              <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">
                {selLabel}
              </p>
              {selData.total === 0 && selData.amSkipped.length === 0 && selData.pmSkipped.length === 0 ? (
                <div className="py-6 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-300 dark:text-stone-600">
                    <Icon name="moon" size={18} />
                  </div>
                  <p className="text-sm text-stone-400 dark:text-stone-500 text-center">
                    {selected > today ? 'Future date — nothing logged yet.' : 'No products logged this day.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-3">
                  {(selData.am.length > 0 || selData.amSkipped.length > 0) && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">AM</p>
                        <span className="text-xs text-stone-300 dark:text-stone-600">{selData.am.length} used</span>
                      </div>
                      <div className="space-y-0.5">
                        {selData.am.map((p, i) => <ProductRow key={i} product={p} />)}
                        {selData.amSkipped.map((p, i) => <ProductRow key={'s'+i} product={p} skipped />)}
                      </div>
                    </div>
                  )}
                  {(selData.pm.length > 0 || selData.pmSkipped.length > 0) && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">PM</p>
                        <span className="text-xs text-stone-300 dark:text-stone-600">{selData.pm.length} used</span>
                      </div>
                      <div className="space-y-0.5">
                        {selData.pm.map((p, i) => <ProductRow key={i} product={p} />)}
                        {selData.pmSkipped.map((p, i) => <ProductRow key={'s'+i} product={p} skipped />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-4 text-center">Select a day to see details</p>
          )}
        </Card>
      </div>
    </div>
  );
};

window.CalendarPage = CalendarPage;
