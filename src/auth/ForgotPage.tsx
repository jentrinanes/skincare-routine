import { useState } from 'react';
import AuthLayout from './AuthLayout';
import { Card, Btn, Icon } from '../components';
import FormField, { inputCls } from '../components/FormField';
import type { AuthPage } from '../types';

export default function ForgotPage({ onNavigate }: { onNavigate: (page: AuthPage) => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <AuthLayout>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-1">Reset password</h2>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">
          {sent ? 'If that address exists, a reset link is on its way.' : "Enter your email and we'll send you a reset link."}
        </p>
        {!sent ? (
          <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-4">
            <FormField label="Email" required>
              <input className={inputCls} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </FormField>
            <Btn className="w-full justify-center" type="submit">Send reset link</Btn>
          </form>
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center text-sage-500">
            <Icon name="check" size={20} />
          </div>
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
