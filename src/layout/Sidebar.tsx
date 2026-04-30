import { Icon } from '../components';
import { useAppContext } from '../context/AppContext';
import type { AppPage } from '../types';

const NAV_ITEMS: { id: AppPage; icon: string; label: string }[] = [
  { id: 'dashboard', icon: 'layout',   label: 'Dashboard' },
  { id: 'products',  icon: 'package',  label: 'Products' },
  { id: 'routine',   icon: 'sun',      label: 'Routine' },
  { id: 'reactions', icon: 'activity', label: 'Reactions' },
  { id: 'patchtest', icon: 'shield',   label: 'Patch Tests' },
  { id: 'calendar',  icon: 'calendar', label: 'Calendar' },
  { id: 'timeline',  icon: 'clock',    label: 'Timeline' },
  { id: 'settings',  icon: 'settings', label: 'Settings' },
];

interface SidebarProps {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ page, onNavigate, onMobileClose }: Omit<SidebarProps, 'mobileOpen'>) {
  const { store, dispatch } = useAppContext();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center flex-shrink-0">
          <Icon name="droplet" size={16} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 tracking-tight">Skin Journal</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onMobileClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-sage-500 text-white shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-5 space-y-1 border-t border-stone-100 dark:border-zinc-800 pt-4">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center text-sage-600 dark:text-sage-400 text-xs font-semibold flex-shrink-0">
            {(store.userProfile?.name || store.user?.name || 'U')[0]!.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">
              {store.userProfile?.name || store.user?.name || 'My Account'}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
              {store.userProfile?.skinType || store.user?.skinType || 'Normal skin'}
            </p>
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'LOGOUT' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          <Icon name="logout" size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ page, onNavigate, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-cream-50 dark:bg-zinc-950 border-r border-stone-100 dark:border-zinc-800 h-screen sticky top-0">
        <SidebarContent page={page} onNavigate={onNavigate} onMobileClose={onMobileClose} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-cream-50 dark:bg-zinc-950 border-r border-stone-100 dark:border-zinc-800 z-50">
            <SidebarContent page={page} onNavigate={onNavigate} onMobileClose={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
