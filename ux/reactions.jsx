// ── Reactions Log Page ────────────────────────────────────────────────────────

const BLANK_REACTION = { date: new Date().toISOString().split('T')[0], description: '', suspectedProducts: [] };

const ReactionForm = ({ initial, products, onSave, onClose }) => {
  const [form, setForm] = useState({ ...BLANK_REACTION, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleProduct = (id) => setForm(f => ({
    ...f,
    suspectedProducts: f.suspectedProducts.includes(id)
      ? f.suspectedProducts.filter(x => x !== id)
      : [...f.suspectedProducts, id]
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    onSave({ ...form, id: initial?.id || ('rx' + Date.now()) });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Date" required>
        <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
      </FormField>
      <FormField label="Description" required>
        <textarea className={`${inputCls} resize-none`} rows={4}
          placeholder="Describe what you noticed — redness, breakout, tightness, stinging…"
          value={form.description} onChange={e => set('description', e.target.value)} />
      </FormField>
      <FormField label="Suspected products" hint="Tap to select all products you think may be involved">
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {products.filter(p => p.status === 'active').map(p => {
            const selected = form.suspectedProducts.includes(p.id);
            return (
              <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left
                  ${selected
                    ? 'border-terra-300 dark:border-terra-700 bg-terra-50 dark:bg-terra-900/20'
                    : 'border-stone-200 dark:border-zinc-700 hover:border-stone-300 dark:hover:border-zinc-600'}`}>
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                  ${selected ? 'border-terra-400 bg-terra-400' : 'border-stone-300 dark:border-zinc-600'}`}>
                  {selected && <Icon name="check" size={10} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">{p.name}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">{p.brand}</p>
                </div>
                {p.actives.length > 0 && <ActivesBadges actives={p.actives} max={2} />}
              </button>
            );
          })}
          {products.filter(p => p.status === 'active').length === 0 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 py-2 text-center">No active products to link.</p>
          )}
        </div>
      </FormField>
      <div className="flex gap-2 justify-end pt-1">
        <Btn variant="secondary" type="button" onClick={onClose}>Cancel</Btn>
        <Btn type="submit" variant="danger"><Icon name="activity" size={14} />{initial?.id ? 'Save changes' : 'Log reaction'}</Btn>
      </div>
    </form>
  );
};

const Reactions = () => {
  const { store, dispatch } = useContext(AppContext);
  const { products, reactions } = store;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const sorted = [...reactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (r) => { setEditing(r); setShowModal(true); };

  const handleSave = (reaction) => {
    if (editing) dispatch({ type: 'UPDATE_REACTION', payload: reaction });
    else dispatch({ type: 'ADD_REACTION', payload: reaction });
  };

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div>
      <PageHeader title="Reactions" subtitle="Track sensitivities and irritation events"
        action={<Btn onClick={openAdd} variant="danger"><Icon name="plus" size={14} />Log reaction</Btn>} />

      {sorted.length === 0 ? (
        <EmptyState icon="activity" title="No reactions logged"
          description="Hopefully it stays this way — but if something comes up, log it here."
          action={<Btn onClick={openAdd} variant="danger"><Icon name="plus" size={14} />Log reaction</Btn>} />
      ) : (
        <div className="space-y-3">
          {sorted.map(r => {
            const suspects = products.filter(p => r.suspectedProducts.includes(p.id));
            return (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-terra-100 dark:bg-terra-900/30 flex items-center justify-center text-terra-500 flex-shrink-0 mt-0.5">
                      <Icon name="alertCircle" size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-1">{formatDate(r.date)}</p>
                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed mb-3">{r.description}</p>
                      {suspects.length > 0 && (
                        <div>
                          <p className="text-xs text-stone-400 dark:text-stone-500 mb-1.5 font-medium">Suspected:</p>
                          <div className="flex flex-wrap gap-2">
                            {suspects.map(p => (
                              <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-terra-50 dark:bg-terra-900/20 rounded-lg">
                                <span className="text-xs font-medium text-terra-600 dark:text-terra-400">{p.name}</span>
                                {p.actives.length > 0 && (
                                  <span className="text-xs text-terra-400 dark:text-terra-500">·</span>
                                )}
                                <ActivesBadges actives={p.actives} max={2} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(r)}><Icon name="edit" size={13} /></Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(r)}><Icon name="trash" size={13} className="text-terra-400" /></Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit reaction' : 'Log reaction'} size="md">
        <ReactionForm initial={editing} products={products} onSave={handleSave} onClose={() => setShowModal(false)} />
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => dispatch({ type:'DELETE_REACTION', payload: confirmDelete?.id })}
        title="Delete reaction" description={`Remove this reaction log entry?`} danger />
    </div>
  );
};

window.Reactions = Reactions;
