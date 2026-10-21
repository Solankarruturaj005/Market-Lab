import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Info,
  Layers,
  LineChart,
  ShieldAlert,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'universe',
    question: 'Which securities and instruments can I view in Market Lab?',
    answer:
      'Market Lab monitors a curated universe of 21 financial instruments comprising 8 leading US large-cap equities (NVDA, TSLA, AAPL, MSFT, GOOGL, AMZN, META, AMD) and 13 major international exchange indices (including HSI, NYA, IXIC, N225, GDAXI, and NSEI). Equities are denominated in USD ($) while exchange benchmarks are expressed in index points (pts).',
  },
  {
    id: 'sources',
    question: 'Where does the market data originate from?',
    answer:
      'Current market quotes query the Alpha Vantage public market data API. Historical daily OHLCV candlestick series are stored in a local PostgreSQL relational database seeded from historical trading records. Real-time quote availability depends on third-party provider quotas and response latency.',
  },
  {
    id: 'cache',
    question: 'Why might an instrument display a "Cached" or "Seeded" status badge?',
    answer:
      'To provide instantaneous page navigation and protect upstream provider rate limits (Alpha Vantage standard tier limits requests to 5 calls/minute and 25 calls/day), quotes are cached in-memory for up to 10 minutes. When third-party provider quotas are exhausted or offline, Market Lab automatically falls back to seeded PostgreSQL baseline records to maintain continuous operational availability.',
  },
  {
    id: 'indicators',
    question: 'What do the technical indicators and consensus signals represent?',
    answer:
      'The indicators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR) are purely deterministic mathematical functions calculated from available historical price sequences. The algorithmic consensus verdict (BUY, HOLD, SELL) applies rule-based scoring across these calculated values. None of these indicators represent proprietary black-box predictions or guarantees of future market trends.',
  },
  {
    id: 'alerts',
    question: 'How do price threshold alerts operate?',
    answer:
      'You can establish ceiling (rises above) and floor (falls below) price triggers on any tracked instrument. Price alerts are evaluated on-demand against active snapshot quotes during terminal sessions. Continuous 24/7 background worker monitoring and automated push/email notifications represent planned roadmap enhancements.',
  },
  {
    id: 'ai',
    question: 'Does the AI feature offer guaranteed price forecasts or investment advice?',
    answer:
      'No. The integrated Google Gemini AI engine provides natural-language research commentary by synthesizing deterministic numerical indicators and price metrics into structured analytical summaries. AI responses are interpretive and educational; they should never be relied upon as personalized financial advice, trade recommendations, or guarantees of future price direction.',
  },
];

export default function About() {
  const [openFaq, setOpenFaq] = useState<string | null>('universe');

  const toggleFaq = (id: string) => {
    setOpenFaq((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-12">
      {/* SECTION 1 — PRODUCT HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-[#334155] bg-gradient-to-b from-[#1E293B]/80 via-[#0F172A] to-[#0F172A] p-6 sm:p-10 lg:p-12 shadow-xl">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
            <Activity size={13} className="text-emerald-400" />
            <span>Market Intelligence Workspace</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Structured Equity Analysis &amp; Quantitative Market Monitoring
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-[#94A3B8]">
            Market Lab unifies historical price action, technical momentum indicators, customizable
            watchlists, and AI-assisted synthesis into a focused, distraction-free analytical
            workspace. Engineered for self-directed investors, students, and analysts evaluating market
            behavior through objective data.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/"
              className="primary-button inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <span>Launch Terminal Dashboard</span>
              <ArrowRight size={14} />
            </Link>
            <a
              href="#capabilities"
              className="secondary-button inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <span>Explore Platform Capabilities</span>
              <ChevronDown size={14} />
            </a>
          </div>
        </div>

        {/* Key Product Metrics Strip */}
        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-[#334155]/80 pt-6 sm:grid-cols-4">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Tracked Assets
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-white">21 Instruments</div>
            <p className="text-[11px] text-[#64748B]">8 US Equities · 13 Global Indices</p>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Chart History
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-white">260 Daily Bars</div>
            <p className="text-[11px] text-[#64748B]">PostgreSQL Relational OHLCV</p>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Indicators
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-white">6 Formulations</div>
            <p className="text-[11px] text-[#64748B]">SMA, EMA, RSI, MACD, BB, ATR</p>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              AI Research
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-white">Gemini Context</div>
            <p className="text-[11px] text-[#64748B]">Contextual Technical Synthesis</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — PRODUCT CAPABILITIES */}
      <section id="capabilities" className="space-y-6 scroll-mt-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Core Functionality
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Analytical Tools Built for Clarity</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Every module in Market Lab is designed to provide actionable clarity without speculative hype.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card A: Market Overview */}
          <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Market Overview &amp; Explorer</h3>
              <p className="text-xs leading-relaxed text-[#94A3B8]">
                Browse the complete monitored universe, search equities and global indices in real time,
                and inspect current price levels, net changes, and volume. Each asset displays clear
                data-freshness indicators distinguishing live provider quotes from cached responses and
                seeded historical baselines.
              </p>
            </div>
            <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#059669]" />
              <span>Multi-currency aware ($ USD / pts Points)</span>
            </div>
          </div>

          {/* Card B: Advanced Chart Workbench */}
          <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
                <LineChart size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Advanced Chart Workbench</h3>
              <p className="text-xs leading-relaxed text-[#94A3B8]">
                Highcharts Stock-powered interactive terminal featuring Candlestick, OHLC bar, Line,
                and Area visualizations. Supports customizable daily timeframes (5D, 1M, 3M, 6M, 1Y, 3Y,
                All), linked volume pane, horizontal/vertical drawing lines, callout annotations, and
                PNG/SVG/CSV data export.
              </p>
            </div>
            <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#059669]" />
              <span>PostgreSQL OHLCV history with zero synthetic bars</span>
            </div>
          </div>

          {/* Card C: Technical Analysis */}
          <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Deterministic Technical Engine</h3>
              <p className="text-xs leading-relaxed text-[#94A3B8]">
                Native client-side and server-side mathematical evaluations for SMA and EMA trend averages,
                Bollinger Bands, 14-period RSI momentum oscillators, MACD signal line divergence, and
                Average True Range (ATR). Computed transparently without hidden predictive black boxes.
              </p>
            </div>
            <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#059669]" />
              <span>Independent mathematical formulas</span>
            </div>
          </div>

          {/* Card D: Personalized Watchlist */}
          <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
                <Star size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Personalized Watchlists</h3>
              <p className="text-xs leading-relaxed text-[#94A3B8]">
                Authenticate securely to curate a focused portfolio of priority instruments. Watchlist
                entries persist across your sessions in PostgreSQL, allowing rapid scanning of price action,
                percentage changes, and instant one-click drill-downs into full technical diagnostics.
              </p>
            </div>
            <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#059669]" />
              <span>User-isolated relational persistence</span>
            </div>
          </div>

          {/* Card E: Price Alerts */}
          <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
                <Bell size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Price Target Triggers</h3>
              <p className="text-xs leading-relaxed text-[#94A3B8]">
                Set custom ceiling and floor price thresholds on any tracked instrument to flag key
                breakouts or pullbacks. Evaluated on-demand against active snapshot prices during
                terminal sessions with visual trigger state indicators and safe deletion confirmation.
              </p>
            </div>
            <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#059669]" />
              <span>Session-based snapshot evaluation</span>
            </div>
          </div>

          {/* Card F: AI-Assisted Research */}
          <div className="card p-6 flex flex-col justify-between space-y-4 hover:border-[#64748B] transition-colors">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
                <Brain size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">AI-Assisted Research Synthesis</h3>
              <p className="text-xs leading-relaxed text-[#94A3B8]">
                Leverage Google Gemini Generative AI to generate contextual technical narratives. The AI
                analyzes computed mathematical indicators, trend direction, and volume to provide
                structured executive summaries and key risk factors for educational thesis validation.
              </p>
            </div>
            <div className="pt-2 border-t border-[#334155]/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#059669]" />
              <span>Schema-validated analytical outputs</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW TO USE MARKET LAB */}
      <section className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            User Workflow
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">How to Use Market Lab</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Follow this six-step structured workflow to conduct comprehensive technical research.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[#334155] bg-[#1E293B]/40 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F172A] font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                01
              </span>
              <h3 className="text-sm font-semibold text-white">Select an Instrument</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Browse the dashboard or utilize the search bar to locate any supported US equity or global
              benchmark index.
            </p>
          </div>

          <div className="rounded-xl border border-[#334155] bg-[#1E293B]/40 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F172A] font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                02
              </span>
              <h3 className="text-sm font-semibold text-white">Open Symbol Terminal</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Click into the instrument’s dedicated terminal view to access the full Highcharts Stock
              workbench and detailed stats.
            </p>
          </div>

          <div className="rounded-xl border border-[#334155] bg-[#1E293B]/40 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F172A] font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                03
              </span>
              <h3 className="text-sm font-semibold text-white">Analyze Price Action</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Switch between Candlestick, OHLC, Line, and Area modes. Adjust timeframes (5D to 3Y) and
              inspect trading volume.
            </p>
          </div>

          <div className="rounded-xl border border-[#334155] bg-[#1E293B]/40 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F172A] font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                04
              </span>
              <h3 className="text-sm font-semibold text-white">Apply Technical Indicators</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Overlay moving averages (SMA, EMA), Bollinger Bands, RSI momentum, and MACD divergence to
              assess trend strength.
            </p>
          </div>

          <div className="rounded-xl border border-[#334155] bg-[#1E293B]/40 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F172A] font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                05
              </span>
              <h3 className="text-sm font-semibold text-white">Save Watchlist &amp; Triggers</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Add the symbol to your private watchlist for fast reference or set price target triggers to
              monitor price levels.
            </p>
          </div>

          <div className="rounded-xl border border-[#334155] bg-[#1E293B]/40 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F172A] font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                06
              </span>
              <h3 className="text-sm font-semibold text-white">Review AI-Assisted Synthesis</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Generate qualitative AI summaries that interpret calculated parameters alongside the
              deterministic consensus verdict.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — MARKET DATA TRANSPARENCY */}
      <section className="card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#334155] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Market Data Transparency &amp; Provenance</h2>
            <p className="text-xs text-[#94A3B8]">
              Honest operational disclosure regarding sources, caching tiers, and limitations
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 text-xs leading-relaxed text-[#94A3B8]">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock size={15} className="text-amber-400" />
                <span>Provider Rate Limits &amp; In-Memory Cache</span>
              </h3>
              <p>
                Market Lab integrates with the Alpha Vantage public market data API. The free provider
                tier enforces strict quotas (5 calls per minute and 25 calls per day). To ensure stable
                performance, quotes are cached in server memory for 10 minutes (600 seconds). Cached
                responses reflect the timestamp of the last successful provider query.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database size={15} className="text-sky-400" />
                <span>Seeded Demonstration History</span>
              </h3>
              <p>
                Historical OHLCV candlestick series are persisted in PostgreSQL. For local demonstration
                and evaluation, series are seeded from established historical reference baselines. Each
                bar represents a valid daily trading session with mathematically validated high, low,
                open, and close values. These bars represent daily granularity, not real-time intraday tick
                streams.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers size={15} className="text-emerald-400" />
                <span>Equities vs. Market Indices</span>
              </h3>
              <p>
                The 21 monitored instruments encompass both individual equities (e.g., Apple, Nvidia,
                Microsoft) and global market indices (e.g., Hang Seng Index, NASDAQ Composite, DAX).
                Market Lab distinguishes them clearly: equities are quoted in USD currency, whereas
                market indices are quoted in index points.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Info size={15} className="text-indigo-400" />
                <span>Tracked Basket vs. Exchange Benchmarks</span>
              </h3>
              <p>
                Market breadth statistics (advance/decline ratio and equal-weighted aggregate index) on
                the Dashboard represent the internal 21-instrument coverage universe. They are calculated
                platform metrics, not official exchange-wide benchmarks like the S&amp;P 500 index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — ANALYSIS AND FINANCIAL RISK */}
      <section className="rounded-xl border border-red-900/40 bg-gradient-to-br from-red-950/30 to-[#0F172A] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-[#DC2626]">
          <ShieldAlert size={22} />
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Analytical Nature &amp; Financial Risk Disclaimer
            </h2>
            <p className="text-xs text-red-300">
              Important regulatory and methodological boundaries
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-[#94A3B8]">
          <p>
            <strong className="text-white">Calculated Technical Indicators: </strong>
            Moving averages (SMA, EMA), oscillators (RSI, MACD), and volatility envelopes (Bollinger
            Bands, ATR) are computed strictly from observed historical prices. They reflect past market
            momentum and dispersion; they do not predict future market direction, prevent losses, or
            account for unforeseen geopolitical, macro-economic, or corporate events.
          </p>

          <p>
            <strong className="text-white">Algorithmic Signals &amp; AI Commentary: </strong>
            The rule-based consensus tags (BUY, HOLD, SELL) and generative AI summaries represent
            automated quantitative heuristics and qualitative interpretations of mathematical snapshots.
            Neither the algorithmic scoring nor the AI commentary constitutes personalized financial,
            tax, or investment advice, nor an endorsement to trade any security.
          </p>

          <p>
            <strong className="text-white">Educational &amp; Analytical Purpose: </strong>
            Market Lab is designed solely as an educational, analytical, and technology demonstration
            workspace. Financial markets involve substantial risk of capital loss. Users must conduct
            their own independent due diligence or consult a licensed professional before making
            financial decisions.
          </p>
        </div>
      </section>

      {/* SECTION 6 — FREQUENTLY ASKED QUESTIONS */}
      <section className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Platform FAQ
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Concise answers regarding data handling, analytical calculations, and feature behavior.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="card overflow-hidden transition-all duration-200 border-[#334155]"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white hover:bg-[#1E293B]/40 transition"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-[#94A3B8] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#334155]/60 bg-[#0F172A]/40 p-5 text-xs leading-relaxed text-[#94A3B8]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 7 — FINAL CTA */}
      <section className="rounded-2xl border border-[#334155] bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-8 text-center space-y-4 shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
          <TrendingUp size={24} />
        </div>
        <div className="space-y-1 max-w-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Ready to Explore the Market Workspace?
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Launch the interactive terminal dashboard to analyze multi-period candlestick action, inspect
            technical indicators, and manage your watchlist.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="primary-button inline-flex items-center gap-2 text-xs font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition"
          >
            <span>Open Terminal Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
