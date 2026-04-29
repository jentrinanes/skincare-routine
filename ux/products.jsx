// ── Products / Inventory Page ─────────────────────────────────────────────────

const BLANK_PRODUCT = { name:'', brand:'', type:'Cleanser', status:'unopened', openedDate:'', pao:12, actives:[], notes:'' };

// ── Actives multi-select combobox ────────────────────────────────────────────
const ActivesCombobox = ({ selected, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [customList, setCustomList] = useState([...ACTIVES_LIST]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = customList.filter(a =>
    a.toLowerCase().includes(query.toLowerCase()) && !selected.includes(a)
  );

  const exactMatch = customList.some(a => a.toLowerCase() === query.trim().toLowerCase());
  const canAddCustom = query.trim().length > 1 && !exactMatch;

  const addActive = (a) => {
    if (!selected.includes(a)) onChange([...selected, a]);
    setQuery('');
    inputRef.current?.focus();
  };

  const addCustom = () => {
    const name = query.trim();
    if (!name) return;
    if (!customList.includes(name)) setCustomList(l => [...l, name]);
    addActive(name);
  };

  const removeActive = (a) => onChange(selected.filter(x => x !== a));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && !canAddCustom) { addActive(filtered[0]); }
      else if (canAddCustom) { addCustom(); }
    }
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeActive(selected[selected.length - 1]);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected chips + input */}
      <div
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
        className={`min-h-[42px] flex flex-wrap gap-1.5 px-2.5 py-2 rounded-xl border cursor-text transition-shadow
          ${open ? 'border-sage-400 ring-2 ring-sage-400/20' : 'border-stone-200 dark:border-zinc-700'}
          bg-white dark:bg-zinc-800`}
      >
        {selected.map(a => (
          <span key={a} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-sage-100 dark:bg-sage-900/40 text-sage-700 dark:text-sage-300 text-xs font-medium">
            {a}
            <button type="button" onClick={e => { e.stopPropagation(); removeActive(a); }}
              className="w-4 h-4 rounded flex items-center justify-center hover:bg-sage-200 dark:hover:bg-sage-800 text-sage-500 transition-colors">
              <Icon name="x" size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? 'Search or add actives…' : ''}
          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-stone-700 dark:text-stone-300 placeholder-stone-300 dark:placeholder-stone-600"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {/* Add custom option */}
            {canAddCustom && (
              <button type="button" onClick={addCustom}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-sage-50 dark:hover:bg-sage-900/20 border-b border-stone-50 dark:border-zinc-800 transition-colors">
                <span className="w-5 h-5 rounded-full bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center text-sage-600 flex-shrink-0">
                  <Icon name="plus" size={11} />
                </span>
                <span className="text-sm text-stone-700 dark:text-stone-300">Add <strong>"{query.trim()}"</strong></span>
                <span className="ml-auto text-xs text-stone-300 dark:text-stone-600">Enter</span>
              </button>
            )}
            {filtered.length === 0 && !canAddCustom && (
              <p className="px-3 py-3 text-xs text-stone-400 dark:text-stone-500 text-center">
                {query ? 'No matches — type to add a custom active.' : 'All actives selected or start typing to filter.'}
              </p>
            )}
            {filtered.map(a => (
              <button key={a} type="button" onClick={() => addActive(a)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors">
                <span className="text-sm text-stone-700 dark:text-stone-300">{a}</span>
                {selected.includes(a) && <Icon name="check" size={13} className="text-sage-500" />}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-stone-50 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-stone-400 dark:text-stone-500">{selected.length} selected</span>
              <button type="button" onClick={() => { onChange([]); setQuery(''); }}
                className="text-xs text-terra-400 hover:text-terra-500 transition-colors">Clear all</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProductForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({ ...BLANK_PRODUCT, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const expiryPreview = form.status === 'active' && form.openedDate && form.pao
    ? computeExpiry(form.openedDate, form.pao) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const id = initial?.id || ('p' + Date.now());
    const expiry = computeExpiry(form.openedDate, form.pao);
    onSave({ ...form, id, expiry });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Product name" required>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Niacinamide 10%" />
        </FormField>
        <FormField label="Brand">
          <input className={inputCls} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. The Ordinary" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type">
          <Select value={form.type} onChange={v => set('type', v)} options={PRODUCT_TYPES} />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={v => set('status', v)}
            options={[{value:'unopened',label:'Unopened'},{value:'active',label:'Active'},{value:'finished',label:'Finished'}]} />
        </FormField>
      </div>
      {form.status === 'active' && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date opened">
            <input type="date" className={inputCls} value={form.openedDate} onChange={e => set('openedDate', e.target.value)} />
          </FormField>
          <FormField label="PAO (months)" hint={expiryPreview ? `Expires ~${expiryPreview}` : undefined}>
            <Select value={String(form.pao)} onChange={v => set('pao', Number(v))}
              options={PAO_OPTIONS.map(o => ({ value:String(o), label:`${o}M` }))} />
          </FormField>
        </div>
      )}
      {/* Actives combobox */}
      <FormField label="Actives" hint="Search the list or type a custom active and press Enter to add it">
        <ActivesCombobox selected={form.actives} onChange={v => set('actives', v)} />
      </FormField>
      <FormField label="Notes">
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any personal notes…" />
      </FormField>
      <div className="flex gap-2 justify-end pt-1">
        <Btn variant="secondary" type="button" onClick={onClose}>Cancel</Btn>
        <Btn type="submit"><Icon name="check" size={14} />{initial?.id ? 'Save changes' : 'Add product'}</Btn>
      </div>
    </form>
  );
};

const Products = () => {
  const { store, dispatch } = useContext(AppContext);
  const { products } = store;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = products.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !`${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setShowModal(true); };

  const handleSave = (prod) => {
    if (editing) {
      dispatch({ type:'UPDATE_PRODUCT', payload: prod });
    } else {
      dispatch({ type:'ADD_PRODUCT', payload: prod });
    }
  };

  const daysUntilExpiry = (p) => {
    if (!p.openedDate || !p.pao) return null;
    const exp = new Date(computeExpiry(p.openedDate, p.pao));
    return Math.ceil((exp - new Date()) / 86400000);
  };

  return (
    <div>
      <PageHeader title="Products" subtitle={`${products.filter(p=>p.status==='active').length} active · ${products.length} total`}
        action={<Btn onClick={openAdd}><Icon name="plus" size={14} />Add product</Btn>} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600" />
          <input className={`${inputCls} pl-8`} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {[['all','All'],['active','Active'],['unopened','Unopened'],['finished','Finished']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===v ? 'bg-sage-500 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="package" title="No products yet"
          description="Add your first product to start building your skincare inventory."
          action={<Btn onClick={openAdd}><Icon name="plus" size={14} />Add product</Btn>} />
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const expDays = daysUntilExpiry(p);
            const expiry = computeExpiry(p.openedDate, p.pao);
            return (
              <Card key={p.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{p.name}</p>
                      <StatusBadge status={p.status} />
                      {expDays !== null && expDays <= 60 && expDays > 0 && (
                        <Badge color={expDays <= 14 ? 'terra' : 'yellow'}>{expDays}d left</Badge>
                      )}
                      {expDays !== null && expDays <= 0 && (
                        <Badge color="terra">Expired</Badge>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">{p.brand} · {p.type}</p>
                    {p.actives.length > 0 && <ActivesBadges actives={p.actives} max={4} />}
                    {p.status === 'active' && expiry && (
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">
                        Opened {p.openedDate} · Expires {expiry}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Icon name="edit" size={13} />
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(p)}>
                      <Icon name="trash" size={13} className="text-terra-400" />
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit product' : 'Add product'} size="lg">
        <ProductForm initial={editing} onSave={handleSave} onClose={() => setShowModal(false)} />
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => dispatch({ type:'DELETE_PRODUCT', payload: confirmDelete?.id })}
        title="Delete product" description={`Remove "${confirmDelete?.name}" from your inventory?`} danger />
    </div>
  );
};

window.Products = Products;
