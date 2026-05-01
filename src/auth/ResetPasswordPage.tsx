import { useState } from 'react';
import AuthLayout from './AuthLayout';
import { Card, Btn, Icon } from '../components';
import FormField, { inputCls } from '../components/FormField';
import type { AuthPage } from '../types';
import { api } from '../api/client';

interface Props {
  token: string;
  onNavigate: (page: AuthPage) => void;
}

export default function ResetPasswordPage({ token, onNavigate }: Props) {
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [done, setDone]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.auth.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('invalid or has expired')
        ? 'This reset link is invalid or has expired. Please request a new one.'
        : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-1">
          {done ? 'Password updated' : 'Choose a new password'}
        </h2>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">
          {done
            ? 'Your password has been reset. You can now sign in with your new password.'
            : 'Enter a new password for your account.'}
        </p>

        {done ? (
          <div className="flex flex-col items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center text-sage-500">
              <Icon name="check" size={20} />
            </div>
            <Btn className="w-full justify-center" onClick={() => onNavigate('login')}>
              Sign in
            </Btn>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="New password" required>
              <input className={inputCls} type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </FormField>
            <FormField label="Confirm password" required>
              <input className={inputCls} type="password" placeholder="••••••••"
                value={confirm} onChange={e => setConfirm(e.target.value)} />
            </FormField>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Btn className="w-full justify-center" type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Set new password'}
            </Btn>
          </form>
        )}
      </Card>
      {!done && (
        <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-4">
          <button onClick={() => onNavigate('login')} className="text-sage-600 dark:text-sage-400 hover:underline font-medium">
            ← Back to sign in
          </button>
        </p>
      )}
    </AuthLayout>
  );
}
