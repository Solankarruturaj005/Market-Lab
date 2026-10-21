import { ArrowDownRight, ArrowLeft, ArrowUpRight, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AiAnalysisPanel } from '../components/AiAnalysisPanel';
import { MacdChart, RsiChart } from '../components/ChartComponent';
import { AdvancedStockChart } from '../features/charts/AdvancedStockChart';
import { DataBadge } from '../components/DataBadge';
import { ErrorMessage } from '../components/ErrorMessage';
import { SkeletonLoader } from '../components/Loader';
import { SignalBadge } from '../components/SignalBadge';
import { useWatchlist } from '../hooks/useWatchlist';
import { fetchPrediction, fetchStockBySymbol } from '../services/stockService';
import { useMarketStore } from '../store/marketStore';
import type { Stock, StockPrediction } from '../types/stock';
import { formatCompactNumber, formatCurrency, formatPercent, isFiniteNumber, isIndexSymbol } from '../utils/formatters';
import { getIndicatorSnapshot } from '../utils/technicals';
import { findFallbackStockBySymbol, withHistory } from '../utils/stock';

export default function StockDetails() {
  const { symbol = '' } = useParams();
  const normalizedSymbol = symbol.toUpperCase();
  const cachedStock = useMarketStore((state) =>
    state.stocks.find((item) => item.symbol === normalizedSymbol),
  );
  const fallbackStock = findFallbackStockBySymbol(normalizedSymbol) ?? null;
  const { addStock, removeStock, isInWatchlist, isStockPending } = useWatchlist();

  const [stock, setStock] = useState<Stock | null>(
    cachedStock ? withHistory(cachedStock) : fallbackStock,
  );
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedStock && !fallbackStock);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      const initialStock = cachedStock ? withHistory(cachedStock) : fallbackStock;
      setIsLoading(!initialStock);
      setError(null);
      setStock(initialStock);

      const [stockResult, predictionResult] = await Promise.allSettled([
        fetchStockBySymbol(normalizedSymbol),
        fetchPrediction(normalizedSymbol),
      ]);

      if (!active) return;

      if (stockResult.status === 'fulfilled') {
        setStock(stockResult.value);
      } else {
        const message =
          stockResult.reason instanceof Error
            ? stockResult.reason.message
            : 'Unable to fetch stock details.';
        if (initialStock) {
          setStock(initialStock);
          setError(`${message} Showing seeded/cached history for ${normalizedSymbol}.`);
        } else {
          setError(message);
        }
      }

      if (predictionResult.status === 'fulfilled') {
        setPrediction(predictionResult.value);
      } else {
        setPrediction(null);
      }

      setIsLoading(false);
    }

    void loadDetails();

    return () => {
      active = false;
    };
  }, [cachedStock, fallbackStock, normalizedSymbol]);

  // Derive quantitative snapshot metrics from actual history
  const technicals = useMemo(() => {
    if (!stock) return null;
    return getIndicatorSnapshot(stock);
  }, [stock]);

  // Calculate Support, Resistance, High, Low from real history
  const priceStats = useMemo(() => {
    if (!stock?.history || stock.history.length === 0) return null;
    const closes = stock.history.map((p) => Number(p.close)).filter((c) => isFiniteNumber(c) && c > 0);
    if (closes.length === 0) return null;

    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const avg = closes.reduce((a, b) => a + b, 0) / closes.length;

    // Approximate support and resistance from recent 20-period swing lows/highs
    const recentCloses = closes.slice(-20);
    const support = Math.min(...recentCloses);
    const resistance = Math.max(...recentCloses);

    // Standard deviation of returns (volatility)
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const meanReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length || 1);
    const annualizedVol = Math.sqrt(variance) * Math.sqrt(252) * 100;

    return { min, max, avg, support, resistance, volatility: annualizedVol };
  }, [stock?.history]);

  if (isLoading && !stock) {
    return <SkeletonLoader type="details" />;
  }

  const inWatch = stock ? isInWatchlist(stock.id) : false;
  const isPending = stock ? isStockPending(stock.id) : false;
  const positive = (stock?.change ?? 0) >= 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#94A3B8] hover:text-white transition w-fit"
        >
          <ArrowLeft size={14} />
          <span>Back to Terminal Dashboard</span>
        </Link>

        <div className="flex flex-col gap-4 border-b border-[#334155] pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {stock?.symbol ?? normalizedSymbol}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{stock?.name}</h1>
              {stock?.isFallback ? (
                <DataBadge variant="fallback" label="Cached / Seeded Feed" />
              ) : stock?.source === 'live' ? (
                <DataBadge variant="live" label="Live Provider Feed" />
              ) : (
                <DataBadge variant="neutral" label="Relational Snapshot" />
              )}
            </div>
            <p className="text-xs text-[#94A3B8]">
              Active Market Lab Coverage · Tracking {stock?.history?.length ?? 0} historical periods
            </p>
          </div>

          {/* Price, Change, and Watchlist Button */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {formatCurrency(stock?.price ?? 0, stock?.symbol ?? normalizedSymbol)}
              </div>
              <div
                className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
                  positive ? 'text-[#059669]' : 'text-[#DC2626]'
                }`}
              >
                {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {formatPercent(stock?.change ?? 0)}
              </div>
            </div>

            {stock && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (inWatch) {
                    void removeStock(stock.id);
                  } else {
                    void addStock(stock);
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition ${
                  inWatch
                    ? 'border-amber-700/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40'
                    : 'secondary-button'
                }`}
              >
                <Star size={14} fill={inWatch ? 'currentColor' : 'none'} />
                {inWatch ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Main Two-Column Analytics Layout */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Left Column: Charts and Technical Indicators */}
        <div className="space-y-6">
          {/* 1. Primary Interactive Candlestick & OHLCV Chart Engine */}
          <section className="space-y-4">
            <AdvancedStockChart
              symbol={normalizedSymbol}
              currency={isIndexSymbol(normalizedSymbol) ? 'POINTS' : 'USD'}
              height={520}
            />
          </section>

          {/* 2. RSI Momentum Panel */}
          <section className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Momentum Oscillator
                </span>
                <h2 className="text-base font-semibold text-white">Relative Strength Index (RSI 14)</h2>
              </div>
              <div className="text-xs text-[#94A3B8] font-mono">
                Current:{' '}
                <span className="font-bold text-white">
                  {technicals?.latest?.rsi != null ? technicals.latest.rsi.toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>

            {stock?.history && stock.history.length > 0 ? (
              <RsiChart data={stock.history} />
            ) : null}
          </section>

          {/* 3. MACD Panel */}
          <section className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Trend Divergence
                </span>
                <h2 className="text-base font-semibold text-white">MACD (12, 26, 9) &amp; Histogram</h2>
              </div>
              <div className="text-xs text-[#94A3B8] font-mono">
                Histogram:{' '}
                <span
                  className={`font-bold ${
                    (technicals?.latest?.histogram ?? 0) >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                  }`}
                >
                  {technicals?.latest?.histogram != null
                    ? technicals.latest.histogram.toFixed(2)
                    : 'N/A'}
                </span>
              </div>
            </div>

            {stock?.history && stock.history.length > 0 ? (
              <MacdChart data={stock.history} />
            ) : null}
          </section>

          {/* 4. Calculated Statistical & Range Metrics */}
          {priceStats && (
            <section className="card p-6 space-y-4">
              <div className="border-b border-[#334155] pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Quantitative Parameters
                </span>
                <h2 className="text-base font-semibold text-white">
                  Calculated Volatility &amp; Range Levels
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="rounded-lg border border-[#334155] bg-[#1E293B]/40 p-3">
                  <div className="text-[#94A3B8]">Support (20-Period)</div>
                  <div className="mt-1 font-mono text-sm font-bold text-white">
                    {formatCurrency(priceStats.support, stock?.symbol ?? normalizedSymbol)}
                  </div>
                </div>

                <div className="rounded-lg border border-[#334155] bg-[#1E293B]/40 p-3">
                  <div className="text-[#94A3B8]">Resistance (20-Period)</div>
                  <div className="mt-1 font-mono text-sm font-bold text-white">
                    {formatCurrency(priceStats.resistance, stock?.symbol ?? normalizedSymbol)}
                  </div>
                </div>

                <div className="rounded-lg border border-[#334155] bg-[#1E293B]/40 p-3">
                  <div className="text-[#94A3B8]">Period Range Low</div>
                  <div className="mt-1 font-mono text-sm font-bold text-white">
                    {formatCurrency(priceStats.min, stock?.symbol ?? normalizedSymbol)}
                  </div>
                </div>

                <div className="rounded-lg border border-[#334155] bg-[#1E293B]/40 p-3">
                  <div className="text-[#94A3B8]">Annualized Volatility</div>
                  <div className="mt-1 font-mono text-sm font-bold text-white">
                    {priceStats.volatility.toFixed(1)}%
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Algorithmic Predictions & AI Analysis */}
        <div className="space-y-6">
          {/* Deterministic Rule-Based Prediction Card */}
          <section className="card p-6 space-y-4">
            <div className="border-b border-[#334155] pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Algorithmic Signal
              </span>
              <h2 className="text-base font-semibold text-white">Deterministic Indicator Verdict</h2>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#334155] bg-[#1E293B]/60 p-4">
              <div>
                <div className="text-xs text-[#94A3B8]">Consensus Signal</div>
                <div className="mt-1">
                  <SignalBadge signal={prediction?.prediction ?? 'HOLD'} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#94A3B8]">Rule Confidence</div>
                <div className="font-mono text-lg font-bold text-white">
                  {prediction?.confidence != null ? `${prediction.confidence}%` : '—'}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#334155]/60">
                <span className="text-[#94A3B8]">SMA 20 Level:</span>
                <span className="font-mono text-white">
                  {technicals?.latest?.sma != null ? formatCurrency(technicals.latest.sma, stock?.symbol ?? normalizedSymbol) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#334155]/60">
                <span className="text-[#94A3B8]">EMA 20 Level:</span>
                <span className="font-mono text-white">
                  {technicals?.latest?.ema != null ? formatCurrency(technicals.latest.ema, stock?.symbol ?? normalizedSymbol) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#334155]/60">
                <span className="text-[#94A3B8]">RSI (14-period):</span>
                <span className="font-mono text-white">
                  {technicals?.latest?.rsi != null ? technicals.latest.rsi.toFixed(2) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#94A3B8]">Trading Volume:</span>
                <span className="font-mono text-white">
                  {formatCompactNumber(stock?.volume ?? 0)}
                </span>
              </div>
            </div>
          </section>

          {/* Gemini AI Analysis Panel */}
          {stock && (
            <AiAnalysisPanel
              input={{
                symbol: stock.symbol,
                price: stock.price ?? 0,
                change: stock.change ?? 0,
                rsi: technicals?.latest?.rsi ?? 50,
                macd: technicals?.latest?.macd ?? 0,
                sma20: technicals?.latest?.sma ?? stock.price ?? 0,
                ema20: technicals?.latest?.ema ?? stock.price ?? 0,
                volume: stock.volume ?? 0,
              }}
            />
          )}

          {/* Disclaimer */}
          <div className="rounded-lg border border-[#334155] bg-[#1E293B]/20 p-4 text-[11px] text-[#94A3B8] leading-relaxed">
            <span className="font-semibold text-white">Analytical Notice: </span>
            Indicator signals and AI syntheses are mathematical models computed from historical
            snapshots. They do not constitute personalized investment advice or guaranteed return
            forecasts.
          </div>
        </div>
      </div>
    </div>
  );
}
