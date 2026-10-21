import { Bot, Brain, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { SignalBadge } from './SignalBadge';
import {
  analyzeStock,
  type AnalyzeStockInput,
  type AnalyzeStockResult,
} from '../services/aiService';

interface AiAnalysisPanelProps {
  input: AnalyzeStockInput;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? 'bg-[#059669]' : pct >= 45 ? 'bg-slate-400' : 'bg-[#DC2626]';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#94A3B8]">Algorithmic Confidence:</span>
        <span className="font-mono font-semibold text-white">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#1E293B] border border-[#334155] overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
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
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete AI analysis. Check backend connectivity or model quotas.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#334155] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
            <Brain size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Automated Synthesis
            </div>
            <h2 className="text-lg font-semibold text-white">Gemini AI Stock Analysis</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading}
          className="primary-button text-xs py-2 px-4"
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Synthesizing...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {result ? 'Re-run Analysis' : 'Run AI Analysis'}
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/10 p-4 text-xs text-white">
          <span className="font-semibold text-[#DC2626]">Analysis Service Notice: </span>
          <span className="text-[#94A3B8]">{error}</span>
        </div>
      )}

      {/* Initial Empty / Prompt State */}
      {!result && !isLoading && !error && (
        <div className="rounded-lg border border-dashed border-[#334155] p-8 text-center space-y-3">
          <Bot size={28} className="mx-auto text-[#64748B]" />
          <h3 className="text-sm font-semibold text-white">On-Demand AI Synthesis</h3>
          <p className="mx-auto max-w-md text-xs text-[#94A3B8] leading-relaxed">
            Click &ldquo;Run AI Analysis&rdquo; to serialize the latest historical OHLCV data and
            quantitative technicals into Google Gemini for an institutional thesis review.
          </p>
        </div>
      )}

      {/* Analysis Results Display */}
      {result && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 items-center rounded-lg border border-[#334155] bg-[#1E293B]/40 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#94A3B8]">Model Signal:</span>
              <SignalBadge signal={result.signal} />
            </div>
            <ConfidenceBar value={result.confidence} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Executive Summary
            </h3>
            <div className="rounded-lg border border-[#334155] bg-[#1E293B]/30 p-4 text-xs text-white leading-relaxed">
              {result.summary}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Technical Rationale &amp; Key Factors
            </h3>
            <div className="rounded-lg border border-[#334155] bg-[#1E293B]/30 p-4 text-xs text-[#94A3B8] leading-relaxed">
              {result.reasoning}
            </div>
          </div>

          <div className="text-[11px] text-[#64748B] pt-1 border-t border-[#334155]">
            * Analytical output generated by Google Gemini model based on serialized indicator
            inputs. Not personalized investment advice.
          </div>
        </div>
      )}
    </section>
  );
}
