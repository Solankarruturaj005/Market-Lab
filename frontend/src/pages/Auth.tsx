import { BarChart3, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../components/ErrorMessage';
import { login, register } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.login);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;

    if (!state?.message) {
      return;
    }

    setMode('login');
    setSuccess(state.message);
    setForm((current) => ({ ...current, email: state.email ?? current.email }));
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const data = await login({ email: form.email, password: form.password });
        setAuth(data.user, data.access_token);
        navigate('/');
      } else {
        await register(form);
        navigate('/auth/verify-otp', { state: { email: form.email } });
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Authentication failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.24),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            <BarChart3 size={16} />
            Market Lab
          </div>
          <div className="max-w-2xl">
            <h1 className="display-title">
              Professional stock intelligence with clean signals and modern workflow.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Track equities, compare momentum, monitor watchlists, and surface buy, sell, or
              hold signals from one polished analysis workspace.
            </p>
          </div>
        </section>

        <section className="card p-8 sm:p-10">
          <div className="mb-8 flex rounded-full border border-white/10 bg-white/5 p-1">
            {(['login', 'register'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold capitalize transition ${
                  mode === item
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {mode === 'login'
                ? 'Sign in to continue tracking your market positions.'
                : 'Register to save watchlists and stay synced with alerts.'}
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className="field">
                <UserRound size={18} className="text-slate-500" />
                <input
                  value={form.name}
                  onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
                  placeholder="Full name"
                  className="field-input"
                  required
                />
              </label>
            ) : null}

            <label className="field">
              <Mail size={18} className="text-slate-500" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
                placeholder="Email address"
                className="field-input"
                required
              />
            </label>

            <label className="field">
              <LockKeyhole size={18} className="text-slate-500" />
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((state) => ({ ...state, password: event.target.value }))
                }
                placeholder="Password"
                className="field-input"
                required
              />
            </label>

            {error ? <ErrorMessage message={error} /> : null}
            {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

            <button type="submit" disabled={isSubmitting} className="primary-button w-full">
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
