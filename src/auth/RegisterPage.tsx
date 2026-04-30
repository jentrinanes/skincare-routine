import { useState } from 'react';
import AuthLayout from './AuthLayout';
import { Card, Btn, Select } from '../components';
import FormField, { inputCls } from '../components/FormField';
import { useAppContext } from '../context/AppContext';
import { SKIN_TYPES } from '../store/data';
import type { AuthPage } from '../types';

export default function RegisterPage({ onNavigate }: { onNavigate: (page: AuthPage) => void }) {
  const { dispatch } = useAppContext();
  const [form, setForm] = useState({ name: '', email: '', pass: '', skinType: 'Normal' });
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.pass) { setError('Please fill in all fields.'); return; }
    dispatch({ type: 'LOGIN', payload: { name: form.name, email: form.email, skinType: form.skinType } });
  };

  return (
    <AuthLayout>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-1">Create account</h2>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Start your skin journal</p>
        <form onSubmit={handleRegister} className="space-y-4">
          <FormField label="Your name" required>
            <input className={inputCls} placeholder="Alex" value={form.name} onChange={e => set('name', e.target.value)} />
          </FormField>
          <FormField label="Email" required>
            <input className={inputCls} type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </FormField>
          <FormField label="Password" required>
            <input className={inputCls} type="password" placeholder="••••••••" value={form.pass} onChange={e => set('pass', e.target.value)} />
          </FormField>
          <FormField label="Skin type">
            <Select value={form.skinType} onChange={v => set('skinType', v)} options={SKIN_TYPES} />
          </FormField>
          {error && <p className="text-xs text-terra-500">{error}</p>}
          <Btn className="w-full justify-center" type="submit">Create account</Btn>
        </form>
      </Card>
      <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-4">
        Have an account?{' '}
        <button onClick={() => onNavigate('login')} className="text-sage-600 dark:text-sage-400 hover:underline font-medium">
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}
