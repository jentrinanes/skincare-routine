import { Icon } from '../components';
import { useAppContext } from '../context/AppContext';

const FEATURES = [
  { icon: 'layout',   title: 'Build your routine',  desc: 'AM & PM schedules with frequency controls.' },
  { icon: 'shield',   title: 'Track barrier load',  desc: "See how many actives you're layering per session." },
  { icon: 'activity', title: 'Log reactions',        desc: 'Record sensitivities and pin the suspected culprit.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { store } = useAppContext();

  return (
    <div className={`min-h-screen flex ${store.darkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-cream-50 dark:bg-zinc-950">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-sage-500 flex items-center justify-center">
            <Icon name="droplet" size={22} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-stone-800 dark:text-stone-100 tracking-tight">Skin Journal</span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <div className="hidden lg:flex w-[420px] flex-col items-center justify-center bg-sage-500 px-10 text-white gap-8">
        <div className="space-y-6 max-w-xs">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                <Icon name={f.icon} size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-white/70 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
