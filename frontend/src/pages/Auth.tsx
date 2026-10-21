import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  CandlestickChart,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  LineChart,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  Star,
  TrendingUp,
  User,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../components/ErrorMessage';
import { HeroChartPreview } from '../components/HeroChartPreview';
import { login, register } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.login);
  const shouldReduceMotion = useReducedMotion();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  // Form fields MUST start completely empty - never prefilled with audit credentials
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
    if (state.email) {
      setForm((current) => ({ ...current, email: state.email! }));
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register' && form.password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const data = await login({ email: form.email, password: form.password });
        setAuth(data.user, data.access_token);
        navigate('/');
      } else {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        navigate('/auth/verify-otp', { state: { email: form.email.trim() } });
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Authentication request failed. Please check your network and credentials.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  const handleSwitchToRegister = () => {
    setMode('register');
    setError('');
    scrollToSection('auth-card');
  };

  return (
    <div className="relative min-h-screen bg-[#1E293B] text-white selection:bg-[#60A5FA]/30 selection:text-white">
      {/* Restrained Global Background Graphic Accents */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-10"
        style={{
          backgroundImage: 'url(/stacked-waves-haikei.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'top right',
        }}
      />
      <div
        className="pointer-events-none fixed -top-40 right-0 z-0 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          backgroundImage: 'url(/blurry-gradient-haikei.svg)',
          backgroundSize: 'cover',
        }}
      />

      {/* Top Floating Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-[#334155]/80 bg-[#1E293B]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#334155] bg-[#0F172A] text-white shadow-sm">
              <LineChart size={20} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white">MarketLab</span>
              <span className="hidden rounded border border-[#334155] bg-[#0F172A] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] sm:inline-block">
                Workspace
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-medium text-[#94A3B8] md:flex">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded px-1.5 py-0.5"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('preview')}
              className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded px-1.5 py-0.5"
            >
              Chart Workbench
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded px-1.5 py-0.5"
            >
              About
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                scrollToSection('auth-card');
              }}
              className="text-xs font-semibold text-[#94A3B8] hover:text-white transition"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleSwitchToRegister}
              className="rounded-lg border border-sky-500/40 bg-sky-950/40 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-900/40 transition"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-20 sm:space-y-24">
        {/* STEP 2 — HERO SECTION (TWO-COLUMN RESPONSIVE) */}
        <section className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] lg:gap-12 items-start pt-4 sm:pt-8">
          {/* LEFT COLUMN: HERO HEADLINE & PREVIEW */}
          <div className="space-y-6 lg:pr-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Activity size={13} />
              <span>Quantitative Market Intelligence</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Read the market.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-300">
                  Understand the trend.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-xl">
                Structured equity monitoring, multi-timeframe candlestick analysis, quantitative
                indicator models (SMA, EMA, RSI, MACD), and Google Gemini-powered thesis synthesis in a
                unified, distraction-free analytical workspace.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="primary-button inline-flex items-center gap-2 text-xs font-semibold px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E293B]"
                aria-label="Explore MarketLab capabilities"
              >
                <span>Explore MarketLab</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className="secondary-button inline-flex items-center gap-2 text-xs font-semibold px-5 py-3 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E293B]"
                aria-label="Create a new account"
              >
                <span>Create Account</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Step 4: Interactive Stock Chart Preview */}
            <div id="preview" className="pt-2">
              <HeroChartPreview />
            </div>

            {/* Compact feature highlights */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center sm:text-left">
              <div className="rounded-lg border border-[#334155]/60 bg-[#0F172A]/60 p-3">
                <div className="font-mono text-base sm:text-lg font-bold text-white">21 Assets</div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">8 Equities · 13 Indices</div>
              </div>
              <div className="rounded-lg border border-[#334155]/60 bg-[#0F172A]/60 p-3">
                <div className="font-mono text-base sm:text-lg font-bold text-white">Deterministic</div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">Mathematical Indicators</div>
              </div>
              <div className="rounded-lg border border-[#334155]/60 bg-[#0F172A]/60 p-3">
                <div className="font-mono text-base sm:text-lg font-bold text-white">Gemini AI</div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">Contextual Synthesis</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AUTHENTICATION CARD */}
          <div id="auth-card" className="relative scroll-mt-24">
            {/* Ambient Lighting Backdrop */}
            <div
              className="pointer-events-none absolute -inset-4 rounded-3xl opacity-25 blur-2xl"
              style={{
                backgroundImage: 'url(/blurry-gradient-haikei.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            <div className="relative card p-6 sm:p-8 space-y-6 shadow-2xl border-[#334155] bg-[#0F172A]/95 backdrop-blur-md">
              {/* Segmented Selector */}
              <div className="grid grid-cols-2 rounded-lg border border-[#334155] bg-[#1E293B] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`rounded-md py-2 text-xs font-semibold transition ${
                    mode === 'login'
                      ? 'bg-[#0F172A] text-white shadow-sm border border-[#334155]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className={`rounded-md py-2 text-xs font-semibold transition ${
                    mode === 'register'
                      ? 'bg-[#0F172A] text-white shadow-sm border border-[#334155]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {mode === 'login' ? 'Sign in to your workspace' : 'Create an analyst account'}
                </h2>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  {mode === 'login'
                    ? 'Enter your registered credentials to launch your terminal.'
                    : 'Register with your institutional or individual email to receive an OTP code.'}
                </p>
              </div>

              {/* Form with Motion Animation */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleSubmit}
                  autoComplete="off"
                  className="space-y-4"
                >
                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#94A3B8]" htmlFor="name-input">
                        Full Name
                      </label>
                      <div className="relative flex items-center">
                        <User size={16} className="absolute left-3 text-[#94A3B8] pointer-events-none" />
                        <input
                          id="name-input"
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Analyst Name"
                          required
                          className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-2.5 pl-9 pr-3 text-xs text-white placeholder-[#64748B] focus:border-[#F8FAFC] focus:outline-none transition sm:text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#94A3B8]" htmlFor="email-input">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-3 text-[#94A3B8] pointer-events-none" />
                      <input
                        id="email-input"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="analyst@domain.com"
                        required
                        autoComplete="email"
                        className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-2.5 pl-9 pr-3 text-xs text-white placeholder-[#64748B] focus:border-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-[#94A3B8]" htmlFor="password-input">
                        Password
                      </label>
                      {mode === 'register' && (
                        <span className="text-[11px] text-[#94A3B8]">Min. 8 characters</span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-3 text-[#94A3B8] pointer-events-none" />
                      <input
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••••••"
                        required
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-2.5 pl-9 pr-10 text-xs text-white placeholder-[#64748B] focus:border-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition sm:text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 text-[#94A3B8] hover:text-white"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && <ErrorMessage message={error} />}

                  {success && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-800/40 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                      <CheckCircle2 size={16} className="flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* White Primary Button with Dark Text */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-[#F8FAFC] py-3 text-xs sm:text-sm font-bold text-[#0F172A] hover:bg-slate-100 transition shadow-md active:scale-[0.99] disabled:opacity-50 mt-2"
                  >
                    {isSubmitting
                      ? 'Processing...'
                      : mode === 'login'
                        ? 'Sign In to Workspace'
                        : 'Register Account & Send OTP'}
                  </button>
                </motion.form>
              </AnimatePresence>

              {/* Trust Badge Strip */}
              <div className="pt-2 border-t border-[#334155]/60 flex items-center justify-between text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <Shield size={13} className="text-emerald-400" />
                  <span>Stateless JWT Auth</span>
                </span>
                <span>Argon2 / Bcrypt Encrypted</span>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3 GRAPHIC DIVIDER (Wave Haikei) */}
        <div
          className="h-16 w-full opacity-20 bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: 'url(/wave-haikei.svg)',
            backgroundSize: '100% 100%',
          }}
        />

        {/* STEP 6 — PRODUCT SHOWCASE */}
        <section id="features" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Integrated Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Everything you need to study a market.
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Institutional-grade analytical tools engineered for objective research, trend validation,
              and portfolio monitoring without speculative noise.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Advanced Stock Charts */}
            <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors group">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white group-hover:border-sky-500/50 transition">
                  <CandlestickChart size={20} className="text-sky-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Advanced Stock Charts</h3>
                <p className="text-xs leading-relaxed text-[#94A3B8]">
                  Highcharts Stock-powered interactive terminal featuring Candlestick, OHLC bar, Line,
                  and Area visualizations. Supports daily timeframes (5D, 1M, 3M, 6M, 1Y, 3Y, All),
                  linked volume panes, drawing tools, and PNG/SVG/CSV exports.
                </p>
              </div>
              <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#059669]" />
                <span>Zero synthetic bars · PostgreSQL-backed</span>
              </div>
            </div>

            {/* Card 2: Technical Indicators */}
            <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors group">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white group-hover:border-emerald-500/50 transition">
                  <TrendingUp size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Technical Indicators</h3>
                <p className="text-xs leading-relaxed text-[#94A3B8]">
                  Automated mathematical evaluations for 20-period and 50-period moving averages
                  (SMA/EMA), Bollinger Bands, 14-period RSI momentum oscillators, and MACD divergence
                  histograms computed natively on available price histories.
                </p>
              </div>
              <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#059669]" />
                <span>Deterministic mathematical formulations</span>
              </div>
            </div>

            {/* Card 3: AI-Assisted Research */}
            <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors group">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white group-hover:border-purple-500/50 transition">
                  <Brain size={20} className="text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-white">AI-Assisted Research</h3>
                <p className="text-xs leading-relaxed text-[#94A3B8]">
                  Qualitative research synthesis powered by Google Gemini. Serializes deterministic
                  indicator snapshots and price action into structured analytical summaries, key
                  risk factors, and educational thesis reviews.
                </p>
              </div>
              <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#059669]" />
                <span>Schema-validated Gemini 2.5 synthesis</span>
              </div>
            </div>

            {/* Card 4: Personalized Watchlists */}
            <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors group">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white group-hover:border-amber-500/50 transition">
                  <Star size={20} className="text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Personalized Watchlists</h3>
                <p className="text-xs leading-relaxed text-[#94A3B8]">
                  Curate and monitor your focused portfolio of priority equities and global benchmarks.
                  Watchlist entries persist securely per authenticated user in PostgreSQL, allowing fast
                  scanning and instant terminal navigation.
                </p>
              </div>
              <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#059669]" />
                <span>Isolated relational database persistence</span>
              </div>
            </div>

            {/* Card 5: Price Alerts */}
            <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors group">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white group-hover:border-red-500/50 transition">
                  <Bell size={20} className="text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Price Target Triggers</h3>
                <p className="text-xs leading-relaxed text-[#94A3B8]">
                  Establish custom ceiling and floor price thresholds on any tracked instrument to flag
                  key technical breakouts or pullbacks. Evaluated on-demand against active snapshot
                  prices during terminal sessions.
                </p>
              </div>
              <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#059669]" />
                <span>Session-based threshold evaluation</span>
              </div>
            </div>

            {/* Card 6: Market Overview */}
            <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors group">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white group-hover:border-indigo-500/50 transition">
                  <BarChart3 size={20} className="text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Market Overview &amp; Breadth</h3>
                <p className="text-xs leading-relaxed text-[#94A3B8]">
                  Browse the complete 21-instrument universe, search symbols in real time, examine
                  volume leaders, top movers, advance/decline ratios, and transparent quote freshness
                  indicators distinguishing live feeds from cached data.
                </p>
              </div>
              <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#059669]" />
                <span>Multi-currency aware ($ USD / pts Points)</span>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 8 — ABOUT MARKETLAB (PRODUCT-FOCUSED) */}
        <section id="about" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Platform Philosophy
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              About MarketLab
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Designed to help analysts, self-directed investors, and students evaluate market behavior
              through objective, transparent data.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 text-xs leading-relaxed text-[#94A3B8]">
            <div className="card p-6 space-y-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers size={16} className="text-sky-400" />
                <span>What MarketLab Helps You Accomplish</span>
              </h3>
              <p>
                MarketLab combines price action history, mathematical indicators, custom watchlists, and
                generative AI synthesis into a single terminal. It eliminates fragmented tools and noisy
                speculative social feeds, allowing you to focus on disciplined technical observation.
              </p>
            </div>

            <div className="card p-6 space-y-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <span>Technical Indicators &amp; Price Action</span>
              </h3>
              <p>
                Indicators such as SMA, EMA, RSI, and MACD quantify historical trend velocity,
                overbought/oversold levels, and momentum divergence. They are strictly mathematical
                calculations based on observed price bars; they do not predict the future or guarantee
                market direction.
              </p>
            </div>

            <div className="card p-6 space-y-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Star size={16} className="text-amber-400" />
                <span>Watchlists &amp; Price Thresholds</span>
              </h3>
              <p>
                Watchlists persist across your login sessions in PostgreSQL, giving you immediate access
                to your selected securities. Price threshold alerts allow you to set floor or ceiling
                levels evaluated on-demand during active terminal sessions.
              </p>
            </div>

            <div className="card p-6 space-y-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain size={16} className="text-purple-400" />
                <span>AI Synthesis &amp; Data Transparency</span>
              </h3>
              <p>
                Integrated Google Gemini AI synthesizes computed numerical indicators into readable
                narratives. Quotes originate from the Alpha Vantage API (with standard 10-minute in-memory
                caching to protect rate limits) and failover to seeded PostgreSQL baseline records when
                limits are reached.
              </p>
            </div>
          </div>

          {/* Financial Risk Disclaimer Card */}
          <div className="rounded-xl border border-red-900/40 bg-gradient-to-br from-red-950/30 to-[#0F172A] p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-[#DC2626]">
              <ShieldAlert size={20} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Financial Risk Disclaimer &amp; Boundaries
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              MarketLab is an educational and analytical research demonstration workspace. Calculated
              indicators, algorithmic consensus signals (BUY, HOLD, SELL), and AI-generated narratives
              do not constitute personalized investment advice, trading endorsements, or financial
              guarantees. Financial markets involve substantial risk of capital loss. Past algorithmic
              behavior does not predict future market outcomes.
            </p>
          </div>

          {/* Final Hero Back-to-Auth CTA */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => scrollToSection('auth-card')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-white transition"
            >
              <span>Ready to begin? Return to sign in</span>
              <ArrowDown size={14} />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#334155]/80 bg-[#0F172A] py-8 text-xs text-[#64748B] mt-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">MarketLab</span>
            <span>· Market Intelligence &amp; Quantitative Analytics Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Local Instance v2.1</span>
            <span>•</span>
            <span>Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
