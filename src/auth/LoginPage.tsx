import { useState } from 'react';
import AuthLayout from './AuthLayout';
import { Card, Btn } from '../components';
import FormField, { inputCls } from '../components/FormField';
import { useAppContext } from '../context/AppContext';
import { api } from '../api/client';
import type { AuthPage } from '../types';

export default function LoginPage({ onNavigate }: { onNavigate: (page: AuthPage) => void }) {
  const { dispatch } = useAppContext();
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !pass) { setError('Please fill in all fields.'); return; }

    setLoading(true);
    try {
      const profile = await api.auth.login({ email: email.trim(), password: pass });
      dispatch({
        type: 'LOGIN',
        payload: { id: profile.id!, name: profile.name, email: profile.email, skinType: profile.skinType },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes('401') ? 'Invalid email or password.' : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-1">Welcome back</h2>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Sign in to your skin journal</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <FormField label="Email" required>
            <input className={inputCls} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Password" required>
            <input className={inputCls} type="password" placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)} />
          </FormField>
          {error && <p className="text-xs text-terra-500">{error}</p>}
          <button type="button" onClick={() => onNavigate('forgot')}
            className="text-xs text-sage-600 dark:text-sage-400 hover:underline">
            Forgot password?
          </button>
          <Btn className="w-full justify-center" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Btn>
        </form>
      </Card>
      <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-4">
        No account?{' '}
        <button onClick={() => onNavigate('register')} className="text-sage-600 dark:text-sage-400 hover:underline font-medium">
          Create one
        </button>
      </p>
    </AuthLayout>
  );
}
