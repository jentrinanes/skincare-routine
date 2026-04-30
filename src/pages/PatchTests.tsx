import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon, Btn, Card, Badge, FormField, Select, EmptyState, PageHeader, ActivesBadges, ConfirmDialog, Modal } from '../components';
import { inputCls } from '../components/FormField';
import { getTodayInTz } from '../store/data';
import type { PatchTest, Product } from '../types';

const PATCH_LOCATIONS = ['Inner wrist', 'Behind ear', 'Inner elbow', 'Jawline', 'Side of neck', 'Upper arm', 'Other'];
const PATCH_DURATIONS = [{ value: 1, label: '24 hours' }, { value: 2, label: '48 hours' }, { value: 7, label: '7 days' }, { value: 14, label: '14 days' }];
const STATUS_OPTIONS = [
  { value: 'active', label: 'In progress' }, { value: 'passed', label: 'Passed ✓' },
  { value: 'failed', label: 'Failed — reaction' }, { value: 'abandoned', label: 'Abandoned' },
];

const BLANK: Omit<PatchTest, 'id'> = {
  productId: '', productName: '', brand: '', startDate: '', location: 'Inner wrist',
  durationDays: 2, status: 'active', reactionNotes: '', notes: '',
};

function PatchForm({ initial, products, onSave, onClose }: {
  initial: PatchTest | null; products: Product[];
  onSave: (t: PatchTest) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<PatchTest, 'id'>>({ ...BLANK, ...initial });
  const [mode, setMode] = useState<'inventory' | 'manual'>(initial?.productId ? 'inventory' : 'manual');
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const inventoryProducts = products.filter(p => p.status === 'unopened' || p.status === 'active');
  const selectedProduct = inventoryProducts.find(p => p.id === form.productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate) return;
    onSave({ ...form, id: initial?.id ?? ('pt' + Date.now()) });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl w-fit">
        {([['inventory', 'From inventory'], ['manual', 'Enter manually']] as const).map(([v, l]) => (
          <button key={v} type="button" onClick={() => setMode(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === v ? 'bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400'
            }`}>{l}</button>
        ))}
      </div>

      {mode === 'inventory' ? (
        <FormField label="Product" required>
          <Select value={form.productId} onChange={v => {
            const p = inventoryProducts.find(x => x.id === v);
            set('productId', v);
            if (p) { set('productName', p.name); set('brand', p.brand); }
          }} options={[{ value: '', label: 'Select a product…' }, ...inventoryProducts.map(p => ({ value: p.id, label: `${p.name} — ${p.brand}` }))]} />
          {selectedProduct?.actives?.length && <div className="mt-2"><ActivesBadges actives={selectedProduct.actives} max={5} /></div>}
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
            options={PATCH_DURATIONS.map(d => ({ value: String(d.value), label: d.label }))} />
        </FormField>
      </div>

      <FormField label="Patch location">
        <Select value={form.location} onChange={v => set('location', v)} options={PATCH_LOCATIONS} />
      </FormField>

      {initial?.id && (
        <FormField label="Status">
          <Select value={form.status} onChange={v => set('status', v as PatchTest['status'])} options={STATUS_OPTIONS} />
        </FormField>
      )}

      {form.status === 'failed' && (
        <FormField label="Reaction notes">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.reactionNotes}
            onChange={e => set('reactionNotes', e.target.value)} placeholder="Describe the reaction…" />
        </FormField>
      )}

      <FormField label="Notes">
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes}
          onChange={e => set('notes', e.target.value)} placeholder="Any observations during the test…" />
      </FormField>

      <div className="flex gap-2 justify-end pt-1">
        <Btn variant="secondary" type="button" onClick={onClose}>Cancel</Btn>
        <Btn type="submit"><Icon name="check" size={14} />{initial?.id ? 'Save' : 'Start patch test'}</Btn>
      </div>
    </form>
  );
}

function PatchTestCard({ test, products, onEdit, onDelete }: {
  test: PatchTest; products: Product[];
  onEdit: (t: PatchTest) => void; onDelete: (t: PatchTest) => void;
}) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = getTodayInTz(tz);

  const startMs = new Date(test.startDate + 'T00:00:00').getTime();
  const endDate = new Date(startMs + test.durationDays * 86400000);
  const endStr = endDate.toISOString().split('T')[0]!;
  const daysElapsed = Math.max(0, Math.floor((new Date(today + 'T00:00:00').getTime() - new Date(test.startDate + 'T00:00:00').getTime()) / 86400000));
  const daysLeft = Math.max(0, test.durationDays - daysElapsed);
  const progress = Math.min(daysElapsed / test.durationDays, 1);

  const product = products.find(p => p.id === test.productId);
  const name = product?.name || test.productName || 'Unnamed product';
  const brand = product?.brand || test.brand || '';

  const STATUS_CONFIG: Record<string, { label: string; color: 'sage' | 'terra' | 'stone'; icon: string }> = {
    active:    { label: 'In progress', color: 'sage',  icon: 'clock' },
    passed:    { label: 'Passed',      color: 'sage',  icon: 'check' },
    failed:    { label: 'Reaction',    color: 'terra', icon: 'alertCircle' },
    abandoned: { label: 'Abandoned',   color: 'stone', icon: 'x' },
  };
  const sc = STATUS_CONFIG[test.status] ?? STATUS_CONFIG['active']!;

  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

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

      {product?.actives?.length && <div className="mb-3"><ActivesBadges actives={product.actives} max={4} /></div>}

      {test.status === 'active' && (
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500">
            <span>Day {Math.min(daysElapsed + 1, test.durationDays)} of {test.durationDays}</span>
            <span>{daysLeft === 0 ? 'Complete — update status' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}</span>
          </div>
          <div className="h-1.5 bg-stone-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${daysLeft === 0 ? 'bg-sage-400' : 'bg-sage-300'}`}
              style={{ width: `${Math.max(progress * 100, 4)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500">
            <span>{fmt(test.startDate)}</span><span>{fmt(endStr)}</span>
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

      {test.notes && <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 italic">"{test.notes}"</p>}
      <p className="text-xs text-stone-300 dark:text-stone-600 mt-2">Started {fmt(test.startDate)}</p>
    </Card>
  );
}

export default function PatchTests() {
  const { store, dispatch } = useAppContext();
  const { products, patchTests } = store;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PatchTest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PatchTest | null>(null);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t: PatchTest) => { setEditing(t); setShowModal(true); };

  const handleSave = (test: PatchTest) => {
    dispatch({ type: editing ? 'UPDATE_PATCH_TEST' : 'ADD_PATCH_TEST', payload: test });
  };

  const active = patchTests.filter(t => t.status === 'active');
  const archived = patchTests.filter(t => t.status !== 'active');
  const shown = filter === 'active' ? active : archived;

  return (
    <div>
      <PageHeader title="Patch Tests"
        subtitle={`${active.length} active · ${patchTests.filter(t => t.status === 'passed').length} passed · ${patchTests.filter(t => t.status === 'failed').length} reactions`}
        action={<Btn onClick={openAdd}><Icon name="plus" size={14} />Start patch test</Btn>} />

      {patchTests.length === 0 && (
        <div className="flex gap-3 px-4 py-3.5 rounded-xl border border-sage-200 dark:border-sage-800/60 bg-sage-50 dark:bg-sage-900/20 mb-5">
          <Icon name="info" size={15} className="text-sage-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-sage-700 dark:text-sage-300 leading-relaxed">
            Patch testing applies a small amount of product to a discrete area of skin for 24 hours to several days, watching for redness, itching, or swelling before adding it to your full routine.
          </p>
        </div>
      )}

      {patchTests.length > 0 && (
        <div className="flex gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl w-fit mb-5">
          <button onClick={() => setFilter('active')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'active' ? 'bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400'
            }`}>
            In progress
            {active.length > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                filter === 'active' ? 'bg-sage-100 dark:bg-sage-900/40 text-sage-600' : 'bg-stone-200 dark:bg-zinc-700 text-stone-500'
              }`}>{active.length}</span>
            )}
          </button>
          <button onClick={() => setFilter('archived')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'archived' ? 'bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400'
            }`}>History</button>
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState icon="shield"
          title={filter === 'active' ? 'No active patch tests' : 'No archived tests'}
          description={filter === 'active' ? 'Start a patch test before adding a new product to your routine.' : 'Completed patch tests will appear here.'}
          action={filter === 'active' ? <Btn onClick={openAdd}><Icon name="plus" size={14} />Start patch test</Btn> : undefined} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map(t => (
            <PatchTestCard key={t.id} test={t} products={products} onEdit={openEdit} onDelete={setConfirmDelete} />
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit patch test' : 'New patch test'} size="md">
        <PatchForm initial={editing} products={products} onSave={handleSave} onClose={() => setShowModal(false)} />
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => dispatch({ type: 'DELETE_PATCH_TEST', payload: confirmDelete!.id })}
        title="Delete patch test" description="Remove this patch test record?" danger />
    </div>
  );
}
