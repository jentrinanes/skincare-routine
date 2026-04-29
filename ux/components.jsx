// ── Shared UI Components ─────────────────────────────────────────────────────

const { useState, useEffect, useRef, createContext, useContext } = React;

// ── App Context ──────────────────────────────────────────────────────────────
const AppContext = createContext(null);
window.AppContext = AppContext;

// ── Icon helpers (inline SVG via string) ────────────────────────────────────
const Icon = ({ name, size = 18, className = '' }) => {
  const icons = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    drag: '<circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/>',
    chevronDown: '<polyline points="6 9 12 15 18 9"/>',
    chevronRight: '<polyline points="9 18 15 12 9 6"/>',
    chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
    alertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    layout: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    arrowUp: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    arrowDown: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    sparkles: '<path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/><path d="M5 3L5.75 5.25L8 6L5.75 6.75L5 9L4.25 6.75L2 6L4.25 5.25Z"/><path d="M19 13L19.75 15.25L22 16L19.75 16.75L19 19L18.25 16.75L16 16L18.25 15.25Z"/>',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" className={className}
      dangerouslySetInnerHTML={{ __html: icons[name] || '' }}
    />
  );
};
window.Icon = Icon;

// ── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);
  if (!open) return null;
  const sizes = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-charcoal dark:text-stone-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
window.Modal = Modal;

// ── Button ───────────────────────────────────────────────────────────────────
const Btn = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const base = 'inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50';
  const sizes = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2 text-sm', lg:'px-5 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-sage-500 hover:bg-sage-600 text-white shadow-sm',
    secondary: 'bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-300',
    ghost: 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-600 dark:text-stone-400',
    danger: 'bg-terra-400 hover:bg-terra-500 text-white',
    outline: 'border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-stone-300',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
window.Btn = Btn;

// ── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ children, color = 'sage', size = 'sm' }) => {
  const colors = {
    sage: 'bg-sage-100 text-sage-700 dark:bg-sage-900/40 dark:text-sage-300',
    terra: 'bg-terra-100 text-terra-600 dark:bg-terra-900/40 dark:text-terra-300',
    stone: 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-stone-400',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    cream: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };
  const sizes = { xs:'px-1.5 py-0.5 text-[10px]', sm:'px-2 py-0.5 text-xs' };
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors[color]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
window.Badge = Badge;

// ── Card ─────────────────────────────────────────────────────────────────────
const Card = ({ children, className = '', onClick }) => (
  <div
    className={`bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);
window.Card = Card;

// ── FormField ────────────────────────────────────────────────────────────────
const FormField = ({ label, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
      {label}{required && <span className="text-terra-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-stone-400 dark:text-stone-500">{hint}</p>}
  </div>
);
window.FormField = FormField;

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-800 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent transition-shadow';
window.inputCls = inputCls;

// ── Select ───────────────────────────────────────────────────────────────────
const Select = ({ value, onChange, options, placeholder, className = '' }) => (
  <select
    value={value} onChange={e => onChange(e.target.value)}
    className={`${inputCls} ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => (
      <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
    ))}
  </select>
);
window.Select = Select;

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-sage-50 dark:bg-sage-900/20 flex items-center justify-center text-sage-400 mb-4">
      <Icon name={icon} size={24} />
    </div>
    <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{title}</h3>
    <p className="text-xs text-stone-400 dark:text-stone-500 max-w-xs mb-4">{description}</p>
    {action}
  </div>
);
window.EmptyState = EmptyState;

// ── Page Header ───────────────────────────────────────────────────────────────
const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-100">{title}</h1>
      {subtitle && <p className="text-sm text-stone-400 dark:text-stone-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);
window.PageHeader = PageHeader;

// ── ActivesBadges ─────────────────────────────────────────────────────────────
const ActivesBadges = ({ actives = [], max = 3 }) => {
  const shown = actives.slice(0, max);
  const rest = actives.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(a => <Badge key={a} color="sage" size="xs">{a}</Badge>)}
      {rest > 0 && <Badge color="stone" size="xs">+{rest} more</Badge>}
    </div>
  );
};
window.ActivesBadges = ActivesBadges;

// ── StatusBadge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active: { color:'sage', label:'Active' },
    unopened: { color:'stone', label:'Unopened' },
    finished: { color:'cream', label:'Finished' },
  };
  const { color, label } = map[status] || { color:'stone', label:status };
  return <Badge color={color}>{label}</Badge>;
};
window.StatusBadge = StatusBadge;

// ── BarrierLoadMeter ──────────────────────────────────────────────────────────
const BarrierLoadMeter = ({ score, showLabel = true }) => {
  const { label, color } = barrierLoadLabel(score);
  const max = 8;
  const pct = Math.min(score / max, 1);
  const barColors = { sage:'bg-sage-400', cream:'bg-amber-300', yellow:'bg-amber-400', terra:'bg-terra-400' };
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-500 dark:text-stone-400">Barrier Load</span>
          <Badge color={color}>{label}</Badge>
        </div>
      )}
      <div className="h-1.5 bg-stone-100 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColors[color]}`}
          style={{ width: `${Math.max(pct * 100, 4)}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-stone-400 dark:text-stone-500">Score {score}/{max}</p>}
    </div>
  );
};
window.BarrierLoadMeter = BarrierLoadMeter;

// ── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, onClose, onConfirm, title, description, danger }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">{description}</p>
    <div className="flex gap-2 justify-end">
      <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
      <Btn variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>Confirm</Btn>
    </div>
  </Modal>
);
window.ConfirmDialog = ConfirmDialog;
