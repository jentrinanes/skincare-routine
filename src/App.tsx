import { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import Sidebar from './layout/Sidebar';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import ForgotPage from './auth/ForgotPage';
import ResetPasswordPage from './auth/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Routine from './pages/Routine';
import Reactions from './pages/Reactions';
import PatchTests from './pages/PatchTests';
import CalendarPage from './pages/Calendar';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';
import { Icon } from './components';
import type { AppPage, AuthPage } from './types';

const PAGE_COMPONENTS: Record<AppPage, React.ComponentType> = {
  dashboard: Dashboard,
  products:  Products,
  routine:   Routine,
  reactions: Reactions,
  patchtest: PatchTests,
  calendar:  CalendarPage,
  timeline:  Timeline,
  settings:  Settings,
};

export default function App() {
  const { store, loading } = useAppContext();
  const [page, setPage] = useState<AppPage>('dashboard');
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('reset')
  );

  // Sync dark mode to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', store.darkMode);
  }, [store.darkMode]);

  // Notification scheduler
  useEffect(() => {
    const notif = store.userProfile?.notifications;
    if (!notif?.enabled) return;

    const interval = setInterval(() => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (notif.amTime && current === notif.amTime) {
        new Notification('☀️ AM Routine', { body: 'Time for your morning skincare routine.' });
      }
      if (notif.pmTime && current === notif.pmTime) {
        new Notification('🌙 PM Routine', { body: 'Time for your evening skincare routine.' });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [store.userProfile?.notifications]);

  const PageComponent = PAGE_COMPONENTS[page];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-100 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!store.user) {
    if (resetToken) {
      return (
        <ResetPasswordPage
          token={resetToken}
          onNavigate={page => {
            setResetToken(null);
            history.replaceState(null, '', window.location.pathname);
            setAuthPage(page);
          }}
        />
      );
    }
    return (
      <>
        {authPage === 'login'    && <LoginPage    onNavigate={setAuthPage} />}
        {authPage === 'register' && <RegisterPage onNavigate={setAuthPage} />}
        {authPage === 'forgot'   && <ForgotPage   onNavigate={setAuthPage} />}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream-100 dark:bg-zinc-950 font-sans">
        <Sidebar page={page} onNavigate={setPage} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

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

          <main className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-5xl w-full mx-auto">
            <PageComponent />
          </main>
        </div>
      </div>
  );
}
