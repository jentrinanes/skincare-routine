// ── Auth Pages: Login · Register · Forgot Password ───────────────────────────

const AuthLayout = ({ children }) => {
  const { store } = useContext(AppContext);
  return (
    <div className={`min-h-screen flex ${store.darkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-cream-50 dark:bg-zinc-950">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-sage-500 flex items-center justify-center">
            <Icon name="droplet" size={22} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-stone-800 dark:text-stone-100 tracking-tight">Skin Journal</span>
        </div>
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
      {/* Right panel – decorative, hidden on small screens */}
      <div className="hidden lg:flex w-[420px] flex-col items-center justify-center bg-sage-500 px-10 text-white gap-8">
        <div className="space-y-6 max-w-xs">
          {[
            { icon:'layout', title:'Build your routine', desc:'AM & PM schedules with frequency controls.' },
            { icon:'shield', title:'Track barrier load', desc:'See how many actives you\'re layering per session.' },
            { icon:'activity', title:'Log reactions', desc:'Record sensitivities and pin the suspected culprit.' },
          ].map(f => (
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
};

// ── Login ────────────────────────────────────────────────────────────────────
const LoginPage = ({ onNavigate }) => {
  const { dispatch } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !pass) { setError('Please fill in all fields.'); return; }
    // Demo: accept any credentials
    dispatch({ type:'LOGIN', payload:{ name: email.split('@')[0], email } });
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
          <Btn className="w-full justify-center" type="submit">Sign in</Btn>
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
};

// ── Register ─────────────────────────────────────────────────────────────────
const RegisterPage = ({ onNavigate }) => {
  const { dispatch } = useContext(AppContext);
  const [form, setForm] = useState({ name:'', email:'', pass:'', skinType:'Normal' });
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const handleRegister = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.pass) { setError('Please fill in all fields.'); return; }
    dispatch({ type:'LOGIN', payload:{ name:form.name, email:form.email, skinType:form.skinType } });
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
            <Select value={form.skinType} onChange={v => set('skinType', v)}
              options={['Normal','Dry','Oily','Combination','Sensitive']} />
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
};

// ── Forgot Password ───────────────────────────────────────────────────────────
const ForgotPage = ({ onNavigate }) => {
  const { store } = useContext(AppContext);
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
};

Object.assign(window, { LoginPage, RegisterPage, ForgotPage });
