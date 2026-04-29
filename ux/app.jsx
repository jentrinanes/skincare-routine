// ── App Root ──────────────────────────────────────────────────────────────────

const initialStore = loadStore();

function reducer(state, action) {
  let next;
  switch (action.type) {
    case 'LOGIN':
      next = { ...state, user: action.payload, userProfile: { ...state.userProfile, ...action.payload } };
      break;
    case 'LOGOUT':
      next = { ...state, user: null };
      break;
    case 'UPDATE_PROFILE':
      next = { ...state, userProfile: action.payload, user: { ...state.user, ...action.payload } };
      break;
    case 'SET_DARK_MODE':
      next = { ...state, darkMode: action.payload };
      break;

    // Products
    case 'ADD_PRODUCT':
      next = { ...state, products: [...state.products, action.payload] };
      break;
    case 'UPDATE_PRODUCT':
      next = { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
      break;
    case 'DELETE_PRODUCT':
      next = {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
        routine: state.routine.filter(r => r.productId !== action.payload),
      };
      break;

    // Routine
    case 'ADD_ROUTINE_ITEM':
      next = { ...state, routine: [...state.routine, action.payload] };
      break;
    case 'UPDATE_ROUTINE_ITEM':
      next = { ...state, routine: state.routine.map(r => r.id === action.payload.id ? { ...r, ...action.payload.changes } : r) };
      break;
    case 'REMOVE_ROUTINE_ITEM':
      next = { ...state, routine: state.routine.filter(r => r.id !== action.payload.id) };
      break;

    // Logs
    case 'ADD_LOG':
      next = { ...state, logs: [...state.logs, action.payload] };
      break;
    case 'REMOVE_LOG':
      next = {
        ...state,
        logs: state.logs.filter(l => !(l.date === action.payload.date && l.routineItemId === action.payload.routineItemId && l.period === action.payload.period))
      };
      break;
    case 'SKIP_TODAY':
      // Add a skip entry (skipped:true) — remove any existing for same item+period+date
      next = {
        ...state,
        logs: [
          ...state.logs.filter(l => !(l.date === action.payload.date && l.routineItemId === action.payload.routineItemId && l.period === action.payload.period)),
          { ...action.payload, completed: false, skipped: true },
        ]
      };
      break;
    case 'UNSKIP_TODAY':
      next = {
        ...state,
        logs: state.logs.filter(l => !(l.date === action.payload.date && l.routineItemId === action.payload.routineItemId && l.period === action.payload.period && l.skipped)),
      };
      break;
    case 'CLEAR_LOGS':
      next = { ...state, logs: [] };
      break;

    // Patch tests
    case 'ADD_PATCH_TEST':
      next = { ...state, patchTests: [...(state.patchTests||[]), action.payload] };
      break;
    case 'UPDATE_PATCH_TEST':
      next = { ...state, patchTests: (state.patchTests||[]).map(t => t.id === action.payload.id ? action.payload : t) };
      break;
    case 'DELETE_PATCH_TEST':
      next = { ...state, patchTests: (state.patchTests||[]).filter(t => t.id !== action.payload) };
      break;

    // Reactions
    case 'ADD_REACTION':
      next = { ...state, reactions: [...state.reactions, action.payload] };
      break;
    case 'UPDATE_REACTION':
      next = { ...state, reactions: state.reactions.map(r => r.id === action.payload.id ? action.payload : r) };
      break;
    case 'DELETE_REACTION':
      next = { ...state, reactions: state.reactions.filter(r => r.id !== action.payload) };
      break;

    default:
      return state;
  }
  saveStore(next);
  return next;
}

function useStore() {
  const [store, dispatch] = React.useReducer(reducer, initialStore);
  return { store, dispatch };
}

const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  products:  Products,
  routine:   Routine,
  calendar:  CalendarPage,
  patchtest: PatchTests,
  reactions: Reactions,
  timeline:  Timeline,
  settings:  Settings,
};

function App() {
  const { store, dispatch } = useStore();
  const [page, setPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync dark mode to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', store.darkMode);
  }, [store.darkMode]);

  // ── Notification scheduler ──────────────────────────────────────────────────
  useEffect(() => {
    const notif = store.userProfile?.notifications;
    if (!notif?.enabled) return;

    function tryNotify(title, body) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '' });
      }
    }

    const interval = setInterval(() => {
      const now = new Date();
      const hh  = String(now.getHours()).padStart(2, '0');
      const mm  = String(now.getMinutes()).padStart(2, '0');
      const current = `${hh}:${mm}`;
      if (notif.amTime && current === notif.amTime) {
        tryNotify('☀️ AM Routine', 'Time for your morning skincare routine.');
      }
      if (notif.pmTime && current === notif.pmTime) {
        tryNotify('🌙 PM Routine', 'Time for your evening skincare routine.');
      }
    }, 30000); // check every 30s

    return () => clearInterval(interval);
  }, [store.userProfile?.notifications]);

  const contextValue = { store, dispatch };
  const PageComponent = PAGE_COMPONENTS[page] || Dashboard;

  if (!store.user) {
    return (
      <AppContext.Provider value={contextValue}>
        {authPage === 'login'    && <LoginPage    onNavigate={setAuthPage} />}
        {authPage === 'register' && <RegisterPage onNavigate={setAuthPage} />}
        {authPage === 'forgot'   && <ForgotPage   onNavigate={setAuthPage} />}
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`flex min-h-screen bg-cream-100 dark:bg-zinc-950 font-sans`}>
        <Sidebar
          page={page}
          onNavigate={setPage}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-cream-50 dark:bg-zinc-950 border-b border-stone-100 dark:border-zinc-800 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sage-500 flex items-center justify-center">
                <Icon name="droplet" size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">Skin Journal</span>
            </div>
            <button onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 dark:text-stone-400 transition-colors">
              <Icon name="menu" size={18} />
            </button>
          </div>

          {/* Page content */}
          <main className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-5xl w-full mx-auto">
            <PageComponent />
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
