import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon, Btn, Card, Badge, FormField, Select, EmptyState, PageHeader, ActivesBadges, BarrierLoadMeter, Modal } from '../components';
import { inputCls } from '../components/FormField';
import { FREQUENCY_OPTIONS, computeBarrierLoad, getTodayInTz } from '../store/data';
import type { Period, RoutineItem, Product } from '../types';

function RoutineItemRow({
  item, index, total, onMove, onUpdate, onRemove, product,
}: {
  item: RoutineItem; index: number; total: number;
  onMove: (from: number, to: number) => void;
  onUpdate: (id: string, changes: Partial<RoutineItem>) => void;
  onRemove: (id: string) => void;
  product: Product;
}) {
  const [open, setOpen] = useState(false);
  const freq = FREQUENCY_OPTIONS.find(f => f.value === item.frequency) ?? FREQUENCY_OPTIONS[0]!;

  return (
    <Card className={`transition-all duration-150 ${open ? 'ring-1 ring-sage-300 dark:ring-sage-700' : ''}`}>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={() => onMove(index, index - 1)} disabled={index === 0}
            className="p-0.5 text-stone-300 dark:text-stone-600 hover:text-stone-500 disabled:opacity-20 transition-colors">
            <Icon name="arrowUp" size={12} />
          </button>
          <button onClick={() => onMove(index, index + 1)} disabled={index === total - 1}
            className="p-0.5 text-stone-300 dark:text-stone-600 hover:text-stone-500 disabled:opacity-20 transition-colors">
            <Icon name="arrowDown" size={12} />
          </button>
        </div>
        <div className="w-5 h-5 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-stone-400 dark:text-stone-500">{product.brand}</span>
            {product.actives.length > 0 && (
              <><span className="text-stone-200 dark:text-zinc-700">·</span><ActivesBadges actives={product.actives} max={2} /></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge color="sage" size="sm">{freq.label}</Badge>
          <button onClick={() => setOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 transition-colors">
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} />
          </button>
          <button onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-300 dark:text-stone-600 hover:text-terra-400 transition-colors">
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-stone-50 dark:border-zinc-800 grid grid-cols-2 gap-3">
          <FormField label="Frequency">
            <Select value={item.frequency} onChange={v => onUpdate(item.id, { frequency: v as RoutineItem['frequency'] })}
              options={FREQUENCY_OPTIONS} />
          </FormField>
          <FormField label="Start date">
            <input type="date" className={inputCls} value={item.startDate}
              onChange={e => onUpdate(item.id, { startDate: e.target.value })} />
          </FormField>
        </div>
      )}
    </Card>
  );
}

export default function Routine() {
  const { store, dispatch } = useAppContext();
  const { products, routine } = store;
  const [period, setPeriod] = useState<Period>('AM');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const periodItems = routine.filter(r => r.period === period).sort((a, b) => a.order - b.order);
  const activeProducts = products.filter(p => p.status === 'active' || p.status === 'unopened');
  const inRoutineIds = new Set(periodItems.map(r => r.productId));
  const availableToAdd = activeProducts
    .filter(p => !inRoutineIds.has(p.id))
    .filter(p => !pickerSearch || `${p.name} ${p.brand}`.toLowerCase().includes(pickerSearch.toLowerCase()));

  const addProduct = (productId: string) => {
    dispatch({
      type: 'ADD_ROUTINE_ITEM',
      payload: {
        id: 'r' + Date.now(),
        productId,
        period,
        frequency: 'daily',
        startDate: getTodayInTz(store.userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
        order: periodItems.length,
      },
    });
    setShowPicker(false);
    setPickerSearch('');
  };

  const removeItem = (id: string) => dispatch({ type: 'REMOVE_ROUTINE_ITEM', payload: { id } });
  const updateItem = (id: string, changes: Partial<RoutineItem>) => dispatch({ type: 'UPDATE_ROUTINE_ITEM', payload: { id, changes } });

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= periodItems.length) return;
    const reordered = [...periodItems];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved!);
    reordered.forEach((item, i) => dispatch({ type: 'UPDATE_ROUTINE_ITEM', payload: { id: item.id, changes: { order: i } } }));
  };

  const allActives = [...new Set(periodItems.flatMap(r => products.find(p => p.id === r.productId)?.actives ?? []))];
  const load = computeBarrierLoad(allActives);

  return (
    <div>
      <PageHeader title="Routine" subtitle="Configure your AM and PM skincare schedule" />

      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl w-fit mb-6">
        {(['AM', 'PM'] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              period === p ? 'bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400'
            }`}>
            <Icon name={p === 'AM' ? 'sun' : 'moon'} size={14} />{p}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-2">
          {periodItems.length === 0 && (
            <EmptyState icon="droplet" title={`No ${period} products yet`}
              description="Add products from your inventory to build your routine."
              action={<Btn onClick={() => setShowPicker(true)}><Icon name="plus" size={14} />Add product</Btn>} />
          )}
          {periodItems.map((item, idx) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;
            return (
              <RoutineItemRow key={item.id} item={item} index={idx} total={periodItems.length}
                product={product} onMove={moveItem} onUpdate={updateItem} onRemove={removeItem} />
            );
          })}
          {periodItems.length > 0 && (
            <button onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-stone-200 dark:border-zinc-700 rounded-xl text-sm text-stone-400 dark:text-stone-500 hover:border-sage-400 hover:text-sage-500 transition-colors">
              <Icon name="plus" size={14} />Add product
            </button>
          )}
        </div>

        <div className="space-y-3">
          <Card className="p-4">
            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">{period} Summary</p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">Products</span>
                <span className="font-medium text-stone-700 dark:text-stone-300">{periodItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">Unique actives</span>
                <span className="font-medium text-stone-700 dark:text-stone-300">{allActives.length}</span>
              </div>
            </div>
            <BarrierLoadMeter score={load} />
          </Card>
          {allActives.length > 0 && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">Active ingredients</p>
              <div className="flex flex-wrap gap-1.5">
                {allActives.map(a => <Badge key={a} color="sage">{a}</Badge>)}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={showPicker} onClose={() => { setShowPicker(false); setPickerSearch(''); }}
        title={`Add to ${period} routine`} size="md">
        <div className="space-y-3">
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600" />
            <input className={`${inputCls} pl-8`} placeholder="Search products…"
              value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus />
          </div>
          {availableToAdd.length === 0 ? (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-4 text-center">
              {activeProducts.length === 0 ? 'Add products to your inventory first.' : 'All products already in this routine.'}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {availableToAdd.map(p => (
                <button key={p.id} onClick={() => addProduct(p.id)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800 text-left transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{p.name}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">{p.brand} · {p.type}</p>
                    {p.actives.length > 0 && <div className="mt-1"><ActivesBadges actives={p.actives} max={3} /></div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
