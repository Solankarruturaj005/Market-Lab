import { Bot, Brain, RefreshCw, Sparkles, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useState } from 'react';
import { analyzeStock, type AnalyzeStockInput, type AnalyzeStockResult } from '../services/aiService';

interface AiAnalysisPanelProps {
  input: AnalyzeStockInput;
}

function SignalIcon({ signal }: { signal: string }) {
  if (signal === 'BUY') return <TrendingUp size={18} className="text-emerald-300" />;
  if (signal === 'SELL') return <TrendingDown size={18} className="text-rose-300" />;
  return <Minus size={18} className="text-slate-300" />;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? 'bg-emerald-400' : pct >= 45 ? 'bg-cyan-400' : 'bg-rose-400';

  return (
    <div className="relative mt-2 h-1.5 w-full rounded-full bg-white/10">
      <div
        className={`h-1.5 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function AiAnalysisPanel({ input }: AiAnalysisPanelProps) {
  const [result, setResult] = useState<AnalyzeStockResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await analyzeStock(input);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch AI analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const signalColor =
    result?.signal === 'BUY'
      ? 'text-emerald-300 bg-emerald-400/10 ring-1 ring-emerald-400/20'
      : result?.signal === 'SELL'
        ? 'text-rose-300 bg-rose-400/10 ring-1 ring-rose-400/20'
        : 'text-slate-200 bg-white/5 ring-1 ring-white/10';

  return (
    <section className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-purple-400/10 p-3 text-purple-300">
            <Brain size={20} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-purple-300/80">AI Feature</div>
            <h2 className="text-xl font-semibold text-white">Intelligent stock analysis</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2.5 text-sm font-semibold text-purple-200 transition hover:border-purple-400/40 hover:bg-purple-400/15 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles size={15} />
              {result ? 'Re-analyze' : 'Analyze with AI'}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Placeholder before analysis */}
      {!result && !isLoading && !error && (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-8 text-center text-sm text-slate-500">
          <Bot size={28} className="mx-auto mb-3 opacity-40" />
          Click <span className="text-purple-300 font-semibold">Analyze with AI</span> to get an AI-powered
          Buy / Sell / Hold signal and market summary for {input.symbol}.
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          <div className="skeleton h-4 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-5/6 rounded-lg" />
        </div>
      )}

      {/* Result */}
      {result && !isLoading && (
        <div className="space-y-4">
          {/* Signal + confidence */}
          <div className="flex flex-wrap items-center gap-4">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${signalColor}`}>
              <SignalIcon signal={result.signal} />
              {result.signal}
            </div>
            <div className="text-sm text-slate-400">
              Confidence: <span className="font-semibold text-white">{result.confidence}%</span>
              <ConfidenceBar value={result.confidence} />
            </div>
            {result.source === 'openai' ? (
              <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs text-purple-300">
                GPT-powered
              </span>
            ) : (
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                Rule-based
              </span>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
            <p className="font-semibold text-white mb-1">Summary</p>
            <p>{result.summary}</p>
          </div>

          {/* Reasoning */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
            <p className="font-semibold text-white mb-1">Reasoning</p>
            <p>{result.reasoning}</p>
          </div>

          <p className="text-xs text-slate-600">
            ⚠ AI analysis is for educational purposes only and does not constitute investment advice.
          </p>
        </div>
      )}
    </section>
  );
}
