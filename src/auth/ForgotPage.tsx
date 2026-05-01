import { useState } from 'react';
import AuthLayout from './AuthLayout';
import { Card, Btn } from '../components';
import FormField, { inputCls } from '../components/FormField';
import type { AuthPage } from '../types';
import { api } from '../api/client';

export default function ForgotPage({ onNavigate }: { onNavigate: (page: AuthPage) => void }) {
  const [email, setEmail]       = useState('');
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { resetUrl: url } = await api.auth.forgotPassword(email.trim());
      if (url) {
        setResetUrl(url);
      } else {
        setNotFound(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-1">Reset password</h2>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">
          {notFound
            ? 'No account found with that email address.'
            : resetUrl
            ? 'Click the link below to set a new password. It expires in 1 hour.'
            : "Enter your email and we'll generate a reset link."}
        </p>

        {resetUrl ? (
          <a
            href={resetUrl}
            className="block text-center text-sm font-medium text-sage-600 dark:text-sage-400 hover:underline break-all"
          >
            Click here to reset your password
          </a>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" required>
              <input className={inputCls} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </FormField>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Btn className="w-full justify-center" type="submit" disabled={loading}>
              {loading ? 'Generating…' : 'Get reset link'}
            </Btn>
          </form>
        )}
      </Card>
      <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-4">
        <button onClick={() => onNavigate('login')} className="text-sage-600 dark:text-sage-400 hover:underline font-medium">
          ← Back to sign in
        </button>
      </p>
    </AuthLayout>
  );
}
