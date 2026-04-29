// ── Sidebar Navigation ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id:'dashboard',  icon:'layout',   label:'Dashboard' },
  { id:'products',   icon:'package',  label:'Products' },
  { id:'routine',    icon:'sun',      label:'Routine' },
  { id:'reactions',  icon:'activity', label:'Reactions' },
  { id:'patchtest',  icon:'shield',   label:'Patch Tests' },
  { id:'calendar',   icon:'calendar', label:'Calendar' },
  { id:'timeline',   icon:'clock',    label:'Timeline' },
  { id:'settings',   icon:'settings', label:'Settings' },
];

const Sidebar = ({ page, onNavigate, mobileOpen, onMobileClose }) => {
  const { store, dispatch } = useContext(AppContext);

  const NavItem = ({ item }) => {
    const active = page === item.id;
    return (
      <button
        onClick={() => { onNavigate(item.id); onMobileClose(); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
          ${active
            ? 'bg-sage-500 text-white shadow-sm'
            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
      >
        <Icon name={item.icon} size={16} />
        <span>{item.label}</span>
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center flex-shrink-0">
          <Icon name="droplet" size={16} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 tracking-tight">Skin Journal</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-1 border-t border-stone-100 dark:border-zinc-800 pt-4">
        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-sage-100 dark:bg-sage-900/40 flex items-center justify-center text-sage-600 dark:text-sage-400 text-xs font-semibold flex-shrink-0">
            {(store.userProfile?.name || store.user?.name || 'U')[0].toUpperCase()}
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
          onClick={() => dispatch({ type:'LOGOUT' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          <Icon name="logout" size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-cream-50 dark:bg-zinc-950 border-r border-stone-100 dark:border-zinc-800 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-cream-50 dark:bg-zinc-950 border-r border-stone-100 dark:border-zinc-800 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

window.Sidebar = Sidebar;
