import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon, Btn, Card, FormField, Select, PageHeader } from '../components';
import { inputCls } from '../components/FormField';
import { SKIN_TYPES } from '../store/data';
import type { UserProfile } from '../types';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 rounded-full transition-colors duration-200 ${checked ? 'bg-sage-500' : 'bg-stone-200 dark:bg-zinc-700'}`}
      style={{ height: '22px' }}>
      <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">{title}</h3>
      <Card className="divide-y divide-stone-50 dark:divide-zinc-800">{children}</Card>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</p>
        {description && <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _intl = Intl as any;
const ALL_TIMEZONES: string[] = typeof _intl.supportedValuesOf === 'function'
  ? _intl.supportedValuesOf('timeZone') as string[]
  : ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Sao_Paulo',
     'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata',
     'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland'];

export default function Settings() {
  const { store, dispatch } = useAppContext();
  const [profile, setProfile] = useState<UserProfile>({ ...store.userProfile, ...store.user });
  const [saved, setSaved] = useState(false);
  const setP = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => setProfile(p => ({ ...p, [k]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'UPDATE_PROFILE', payload: profile });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'skin-journal-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const notif = store.userProfile?.notifications;

  const updateNotif = (changes: Partial<NonNullable<UserProfile['notifications']>>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { ...store.userProfile, notifications: { ...notif, enabled: notif?.enabled ?? false, ...changes } } });
  };

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      {/* Profile */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Profile</h3>
        <Card className="p-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Display name">
                <input className={inputCls} value={profile.name || ''} onChange={e => setP('name', e.target.value)} placeholder="Your name" />
              </FormField>
              <FormField label="Email">
                <input className={inputCls} type="email" value={profile.email || ''} onChange={e => setP('email', e.target.value)} placeholder="you@example.com" />
              </FormField>
            </div>
            <FormField label="Skin type">
              <Select value={profile.skinType || 'Normal'} onChange={v => setP('skinType', v)} options={SKIN_TYPES} />
            </FormField>
            <FormField label="Timezone" hint="Used to determine today's date for your routine">
              <select className={inputCls} value={profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                onChange={e => setP('timezone', e.target.value)}>
                {ALL_TIMEZONES.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
            <FormField label="Skin concerns" hint="Optional — helps personalise insights">
              <input className={inputCls} value={profile.concerns || ''} onChange={e => setP('concerns', e.target.value)}
                placeholder="e.g. Hyperpigmentation, acne, sensitivity" />
            </FormField>
            <div className="flex items-center gap-3 pt-1">
              <Btn type="submit"><Icon name="check" size={14} />Save profile</Btn>
              {saved && <span className="text-xs text-sage-600 dark:text-sage-400 flex items-center gap-1"><Icon name="check" size={12} />Saved</span>}
            </div>
          </form>
        </Card>
      </div>

      {/* Notifications */}
      <Section title="Notifications">
        <SettingRow label="Routine reminders" description="Browser notifications for AM and PM routines">
          <Toggle checked={!!notif?.enabled} onChange={async v => {
            if (v && Notification.permission !== 'granted') {
              const perm = await Notification.requestPermission();
              if (perm !== 'granted') return;
            }
            updateNotif({ enabled: v });
          }} />
        </SettingRow>
        {notif?.enabled && (
          <>
            <SettingRow label="AM reminder" description="Time for your morning routine reminder">
              <input type="time"
                className="px-3 py-1.5 text-sm rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-sage-400"
                value={notif?.amTime ?? '07:30'}
                onChange={e => updateNotif({ amTime: e.target.value })} />
            </SettingRow>
            <SettingRow label="PM reminder" description="Time for your evening routine reminder">
              <input type="time"
                className="px-3 py-1.5 text-sm rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-sage-400"
                value={notif?.pmTime ?? '21:00'}
                onChange={e => updateNotif({ pmTime: e.target.value })} />
            </SettingRow>
            <SettingRow label="Permission status" description="Browser notification permission">
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                Notification.permission === 'granted' ? 'bg-sage-100 dark:bg-sage-900/30 text-sage-600 dark:text-sage-400'
                : Notification.permission === 'denied'  ? 'bg-terra-100 dark:bg-terra-900/30 text-terra-500'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-500'
              }`}>{Notification.permission}</span>
            </SettingRow>
          </>
        )}
      </Section>

      <Section title="Appearance">
        <SettingRow label="Dark mode" description="Switch to a darker interface">
          <Toggle checked={store.darkMode} onChange={v => dispatch({ type: 'SET_DARK_MODE', payload: v })} />
        </SettingRow>
      </Section>

      <Section title="Data">
        <SettingRow label="Export data" description="Download all your data as JSON">
          <Btn variant="outline" size="sm" onClick={handleExport}>Export</Btn>
        </SettingRow>
        <SettingRow label="Clear daily logs" description="Remove all check-in history (keeps products & routine)">
          <Btn variant="outline" size="sm" onClick={() => dispatch({ type: 'CLEAR_LOGS' })}>Clear logs</Btn>
        </SettingRow>
      </Section>

      <Section title="About">
        <SettingRow label="Skin Journal" description="Version 1.0 — A calm place for your skincare practice">
          <span className="text-xs text-stone-300 dark:text-stone-600">v1.0</span>
        </SettingRow>
        <SettingRow label="Barrier load scoring" description="Each active ingredient earns points based on its potential for irritation. Retinoids = 2–3, acids = 1–2, hydrators = 0.">
          <Icon name="info" size={15} className="text-stone-300 dark:text-stone-600" />
        </SettingRow>
      </Section>

      <Section title="Stats at a glance">
        {([
          { label: 'Total products',      value: store.products.length },
          { label: 'Active products',     value: store.products.filter(p => p.status === 'active').length },
          { label: 'Routine items (AM)',   value: store.routine.filter(r => r.period === 'AM').length },
          { label: 'Routine items (PM)',   value: store.routine.filter(r => r.period === 'PM').length },
          { label: 'Reactions logged',    value: store.reactions.length },
          { label: 'Check-ins logged',    value: store.logs.length },
        ]).map(({ label, value }) => (
          <SettingRow key={label} label={label}>
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">{value}</span>
          </SettingRow>
        ))}
      </Section>
    </div>
  );
}
