// ── Patch Test Tracker ────────────────────────────────────────────────────────

const PATCH_LOCATIONS = [
  'Inner wrist','Behind ear','Inner elbow','Jawline','Side of neck','Upper arm','Other'
];
const PATCH_DURATIONS = [
  { value:1,  label:'24 hours' },
  { value:2,  label:'48 hours' },
  { value:7,  label:'7 days' },
  { value:14, label:'14 days' },
];
const BLANK_PATCH = {
  productId:'', productName:'', brand:'', startDate:'', location:'Inner wrist',
  durationDays:2, status:'active', reactionNotes:'', notes:''
};

const PatchForm = ({ initial, products, onSave, onClose }) => {
  const [form, setForm] = useState({ ...BLANK_PATCH, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [mode, setMode] = useState(initial?.productId ? 'inventory' : 'manual');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.startDate) return;
    const id = initial?.id || ('pt' + Date.now());
    onSave({ ...form, id });
    onClose();
  };

  const inventoryProducts = products.filter(p => p.status === 'unopened' || p.status === 'active');
  const selectedProduct = inventoryProducts.find(p => p.id === form.productId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product source toggle */}
      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl w-fit">
        {[['inventory','From inventory'],['manual','Enter manually']].map(([v,l]) => (
          <button key={v} type="button" onClick={() => setMode(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${mode===v ? 'bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {mode === 'inventory' ? (
        <FormField label="Product" required>
          <Select value={form.productId} onChange={v => {
            const p = inventoryProducts.find(x => x.id === v);
            set('productId', v);
            if (p) { set('productName', p.name); set('brand', p.brand); }
          }} options={[{value:'', label:'Select a product…'}, ...inventoryProducts.map(p => ({ value:p.id, label:`${p.name} — ${p.brand}` }))]} />
          {selectedProduct?.actives?.length > 0 && (
            <div className="mt-2"><ActivesBadges actives={selectedProduct.actives} max={5} /></div>
          )}
        </FormField>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Product name" required>
            <input className={inputCls} value={form.productName} onChange={e => set('productName', e.target.value)} placeholder="e.g. Vitamin C Serum" />
          </FormField>
          <FormField label="Brand">
            <input className={inputCls} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. The Ordinary" />
          </FormField>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start date" required>
          <input type="date" className={inputCls} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </FormField>
        <FormField label="Duration">
          <Select value={String(form.durationDays)} onChange={v => set('durationDays', Number(v))}
            options={PATCH_DURATIONS.map(d => ({ value:String(d.value), label:d.label }))} />
        </FormField>
      </div>

      <FormField label="Patch location">
        <Select value={form.location} onChange={v => set('location', v)} options={PATCH_LOCATIONS} />
      </FormField>

      {initial?.id && (
        <FormField label="Status">
          <Select value={form.status} onChange={v => set('status', v)}
            options={[{value:'active',label:'In progress'},{value:'passed',label:'Passed ✓'},{value:'failed',label:'Failed — reaction'},{value:'abandoned',label:'Abandoned'}]} />
        </FormField>
      )}

      {(form.status === 'failed') && (
        <FormField label="Reaction notes">
          <textarea className={`${inputCls} resize-none`} rows={2}
            value={form.reactionNotes} onChange={e => set('reactionNotes', e.target.value)}
            placeholder="Describe the reaction…" />
        </FormField>
      )}

      <FormField label="Notes">
        <textarea className={`${inputCls} resize-none`} rows={2}
          value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Any observations during the test…" />
      </FormField>

      <div className="flex gap-2 justify-end pt-1">
        <Btn variant="secondary" type="button" onClick={onClose}>Cancel</Btn>
        <Btn type="submit"><Icon name="check" size={14} />{initial?.id ? 'Save' : 'Start patch test'}</Btn>
      </div>
    </form>
  );
};

const PatchTestCard = ({ test, products, onEdit, onDelete }) => {
  const tz = (window.__appStore?.userProfile?.timezone) || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = getTodayInTz(tz);

  const startMs  = new Date(test.startDate + 'T00:00:00').getTime();
  const endDate  = new Date(startMs + test.durationDays * 86400000);
  const endStr   = endDate.toISOString().split('T')[0];
  const daysElapsed = Math.max(0, Math.floor((new Date(today + 'T00:00:00') - new Date(test.startDate + 'T00:00:00')) / 86400000));
  const daysLeft = Math.max(0, test.durationDays - daysElapsed);
  const progress = Math.min(daysElapsed / test.durationDays, 1);

  const product = products.find(p => p.id === test.productId);
  const name  = product?.name || test.productName || 'Unnamed product';
  const brand = product?.brand || test.brand || '';

  const statusConfig = {
    active:    { label:'In progress', color:'sage',   icon:'clock' },
    passed:    { label:'Passed',      color:'sage',   icon:'check' },
    failed:    { label:'Reaction',    color:'terra',  icon:'alertCircle' },
    abandoned: { label:'Abandoned',   color:'stone',  icon:'x' },
  };
  const sc = statusConfig[test.status] || statusConfig.active;

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short' });

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{name}</p>
            <Badge color={sc.color}>{sc.label}</Badge>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500">{brand}{brand && ' · '}{test.location}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Btn variant="ghost" size="sm" onClick={() => onEdit(test)}><Icon name="edit" size={13} /></Btn>
          <Btn variant="ghost" size="sm" onClick={() => onDelete(test)}><Icon name="trash" size={13} className="text-terra-400" /></Btn>
        </div>
      </div>

      {product?.actives?.length > 0 && (
        <div className="mb-3"><ActivesBadges actives={product.actives} max={4} /></div>
      )}

      {/* Progress */}
      {test.status === 'active' && (
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500">
            <span>Day {Math.min(daysElapsed + 1, test.durationDays)} of {test.durationDays}</span>
            <span>{daysLeft === 0 ? 'Complete — update status' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}</span>
          </div>
          <div className="h-1.5 bg-stone-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${daysLeft === 0 ? 'bg-sage-400' : 'bg-sage-300'}`}
              style={{ width:`${Math.max(progress * 100, 4)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500">
            <span>{formatDate(test.startDate)}</span>
            <span>{formatDate(endStr)}</span>
          </div>
        </div>
      )}

      {test.status === 'passed' && (
        <div className="flex items-center gap-2 p-2.5 bg-sage-50 dark:bg-sage-900/20 rounded-lg mb-3">
          <Icon name="check" size={13} className="text-sage-500" />
          <p className="text-xs text-sage-700 dark:text-sage-300">
            Passed after {test.durationDays} day{test.durationDays !== 1 ? 's' : ''} — safe to add to routine
          </p>
        </div>
      )}

      {test.status === 'failed' && test.reactionNotes && (
        <div className="flex items-start gap-2 p-2.5 bg-terra-50 dark:bg-terra-900/20 rounded-lg mb-3">
          <Icon name="alertCircle" size={13} className="text-terra-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-terra-600 dark:text-terra-400">{test.reactionNotes}</p>
        </div>
      )}

      {test.notes && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 italic">"{test.notes}"</p>
      )}

      <p className="text-xs text-stone-300 dark:text-stone-600 mt-2">Started {formatDate(test.startDate)}</p>
    </Card>
  );
};

const PatchTests = () => {
  const { store, dispatch } = useContext(AppContext);
  const { products, patchTests = [] } = store;

  // expose store for PatchTestCard
  window.__appStore = store;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState('active');

  const openAdd  = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setShowModal(true); };

  const handleSave = (test) => {
    if (editing) dispatch({ type:'UPDATE_PATCH_TEST', payload: test });
    else         dispatch({ type:'ADD_PATCH_TEST', payload: test });
  };

  const active   = patchTests.filter(t => t.status === 'active');
  const archived = patchTests.filter(t => t.status !== 'active');
  const shown    = filter === 'active' ? active : archived;

  return (
    <div>
      <PageHeader title="Patch Tests"
        subtitle={`${active.length} active · ${patchTests.filter(t=>t.status==='passed').length} passed · ${patchTests.filter(t=>t.status==='failed').length} reactions`}
        action={<Btn onClick={openAdd}><Icon name="plus" size={14} />Start patch test</Btn>} />

      {/* Info banner */}
      {patchTests.length === 0 && (
        <div className="flex gap-3 px-4 py-3.5 rounded-xl border border-sage-200 dark:border-sage-800/60 bg-sage-50 dark:bg-sage-900/20 mb-5">
          <Icon name="info" size={15} className="text-sage-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-sage-700 dark:text-sage-300 leading-relaxed">
            Patch testing applies a small amount of product to a discrete area of skin for 24 hours to several days, watching for redness, itching, or swelling before adding it to your full routine.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      {patchTests.length > 0 && (
        <div className="flex gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl w-fit mb-5">
          <button onClick={() => setFilter('active')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filter==='active' ? 'bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}>
            In progress
            {active.length > 0 && <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${filter==='active' ? 'bg-sage-100 dark:bg-sage-900/40 text-sage-600' : 'bg-stone-200 dark:bg-zinc-700 text-stone-500'}`}>{active.length}</span>}
          </button>
          <button onClick={() => setFilter('archived')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filter==='archived' ? 'bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}>
            History
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState icon="shield"
          title={filter === 'active' ? 'No active patch tests' : 'No archived tests'}
          description={filter === 'active' ? 'Start a patch test before adding a new product to your routine.' : 'Completed patch tests will appear here.'}
          action={filter === 'active' ? <Btn onClick={openAdd}><Icon name="plus" size={14} />Start patch test</Btn> : null} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map(t => (
            <PatchTestCard key={t.id} test={t} products={products}
              onEdit={openEdit} onDelete={setConfirmDelete} />
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit patch test' : 'New patch test'} size="md">
        <PatchForm initial={editing} products={products} onSave={handleSave} onClose={() => setShowModal(false)} />
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => dispatch({ type:'DELETE_PATCH_TEST', payload: confirmDelete?.id })}
        title="Delete patch test" description={`Remove this patch test record?`} danger />
    </div>
  );
};

window.PatchTests = PatchTests;
