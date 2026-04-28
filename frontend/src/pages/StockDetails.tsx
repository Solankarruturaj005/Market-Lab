import { Activity, ArrowLeft, ChartNoAxesCombined, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AiAnalysisPanel } from '../components/AiAnalysisPanel';
import { EnhancedChart, MacdChart, RsiChart } from '../components/ChartComponent';
import { ErrorMessage } from '../components/ErrorMessage';
import { SkeletonLoader } from '../components/Loader';
import { SignalBadge } from '../components/SignalBadge';
import { useWatchlist } from '../hooks/useWatchlist';
import { fetchPrediction, fetchStockBySymbol } from '../services/stockService';
import { getLiveStock } from '../services/api';
import { useMarketStore } from '../store/marketStore';
import type { Stock, StockPrediction } from '../types/stock';
import { formatCurrency, formatPercent, isFiniteNumber } from '../utils/formatters';
import { getIndicatorSnapshot } from '../utils/technicals';
import { findFallbackStockBySymbol, withHistory } from '../utils/stock';

function isLiveOrCachedStock(stock: Stock | null) {
  return stock?.source === 'live' || stock?.source === 'cache' || stock?.isFallback === false;
}

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
  const previousPrice = useRef<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

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

      if (!active) {
        return;
      }

      if (stockResult.status === 'fulfilled') {
        console.log('[StockDetails] Stock loaded:', stockResult.value.symbol);
        setStock((current) =>
          current?.symbol === stockResult.value.symbol && isLiveOrCachedStock(current)
            ? {
                ...stockResult.value,
                price: current.price ?? stockResult.value.price,
                change: current.change ?? stockResult.value.change,
                isFallback: current.isFallback,
                source: current.source,
              }
            : stockResult.value,
        );
      } else {
        const message =
          stockResult.reason instanceof Error
            ? stockResult.reason.message
            : 'Unable to fetch stock details.';

        console.error('[StockDetails] Failed to load stock details', stockResult.reason);

        if (initialStock) {
          setStock(initialStock);
          setError(`${message} Showing preview history for ${normalizedSymbol}.`);
        } else {
          setError(message);
        }
      }

      if (predictionResult.status === 'fulfilled') {
        console.log('[StockDetails] Prediction loaded:', predictionResult.value.prediction);
        setPrediction(predictionResult.value);
      } else {
        setPrediction(null);
        console.warn(
          '[StockDetails] Prediction unavailable:',
          predictionResult.reason instanceof Error
            ? predictionResult.reason.message
            : predictionResult.reason,
        );
      }

      setIsLoading(false);
      return;

      /*

      // CRITICAL FIX: Load stock and prediction separately so prediction failure
      // does NOT prevent stock details from rendering.
      const [stockResult, predictionResult] = await Promise.allSettled([
        fetchStockBySymbol(normalizedSymbol),
        fetchPrediction(normalizedSymbol),
      ]);

      if (!active) {
        return;
      }

      if (stockResult.status === 'fulfilled') {
        console.log('[StockDetails] Stock loaded:', stockResult.value.symbol);
        setStock(stockResult.value);
      } else {
        const message =
          stockResult.reason instanceof Error
            ? stockResult.reason.message
            : 'Unable to fetch data. Please try again.';

        console.error('[StockDetails] Failed to load stock details', stockResult.reason);
        setError(message);
      }

      // Load prediction independently — failure is non-fatal
      try {
        const predictionData = await fetchPrediction(symbol);
        if (active) {
          console.log('[StockDetails] Prediction loaded:', predictionData.prediction);
          setPrediction(predictionData);
        }
      } catch (predErr) {
        // Prediction failure is non-fatal — we just won't show indicators
        if (active) {
          console.warn('[StockDetails] Prediction unavailable:', predErr instanceof Error ? predErr.message : predErr);
        }
      } finally {
        if (active) setIsLoading(false);
      }
      */
    }

    void loadDetails();

    return () => {
      active = false;
    };
  }, [cachedStock, fallbackStock, normalizedSymbol]);

  useEffect(() => {
    let active = true;

    async function refreshLiveQuote() {
      try {
        const live = await getLiveStock(normalizedSymbol);

        if (!active) {
          return;
        }

        setStock((current) => {
          if (!current) {
            return current;
          }

          const shouldUseLiveQuote =
            live.source === 'live' || live.source === 'cache' || live.isFallback === false;

          return {
            ...current,
            price:
              shouldUseLiveQuote && isFiniteNumber(live.price) && live.price > 0
                ? live.price
                : current.price,
            change:
              shouldUseLiveQuote && isFiniteNumber(live.change) ? live.change : current.change,
            isFallback: shouldUseLiveQuote
              ? Boolean(live.isFallback && live.source !== 'cache')
              : current.isFallback,
            source: shouldUseLiveQuote ? live.source : current.source,
          };
        });
      } catch (liveError) {
        console.warn(
          '[StockDetails] Live quote refresh unavailable:',
          liveError instanceof Error ? liveError.message : liveError,
        );
      }
    }

    void refreshLiveQuote();
    const interval = window.setInterval(refreshLiveQuote, 20_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [normalizedSymbol]);

  const resolvedStock = useMemo(() => (stock ? withHistory(stock) : null), [stock]);
  useEffect(() => {
    const price = resolvedStock?.price;

    if (!isFiniteNumber(price) || price <= 0) {
      previousPrice.current = null;
      return;
    }

    if (previousPrice.current != null && previousPrice.current !== price) {
      setPriceFlash(price > previousPrice.current ? 'up' : 'down');
      const timeout = window.setTimeout(() => setPriceFlash(null), 900);
      previousPrice.current = price;
      return () => window.clearTimeout(timeout);
    }

    previousPrice.current = price;
  }, [resolvedStock?.price]);

  const indicatorSnapshot = useMemo(
    () => (resolvedStock ? getIndicatorSnapshot(resolvedStock) : null),
    [resolvedStock],
  );
  const effectivePrediction = useMemo(() => {
    if (!resolvedStock) {
      return prediction;
    }

    const hasPredictionValues = Boolean(
      prediction?.indicators?.sma20 != null ||
        prediction?.indicators?.ema20 != null ||
        prediction?.indicators?.rsi14 != null ||
        prediction?.indicators?.macdHistogram != null,
    );

    return hasPredictionValues ? prediction : indicatorSnapshot?.derivedPrediction ?? prediction;
  }, [indicatorSnapshot?.derivedPrediction, prediction, resolvedStock]);
  const metrics = useMemo(() => {
    if (!effectivePrediction || !indicatorSnapshot) return [];

    return [
      {
        label: 'SMA (20)',
        value: effectivePrediction.indicators?.sma20?.toFixed(2) ?? '--',
        color: 'text-cyan-300',
      },
      {
        label: 'EMA (20)',
        value: effectivePrediction.indicators?.ema20?.toFixed(2) ?? '--',
        color: 'text-purple-300',
      },
      {
        label: 'RSI (14)',
        value: effectivePrediction.indicators?.rsi14?.toFixed(2) ?? '--',
        color:
          effectivePrediction.indicators?.rsi14 != null
            ? effectivePrediction.indicators.rsi14 > 70
              ? 'text-rose-300'
              : effectivePrediction.indicators.rsi14 < 30
                ? 'text-emerald-300'
                : 'text-slate-300'
            : 'text-slate-400',
      },
      {
        label: 'MACD Histogram',
        value: effectivePrediction.indicators?.macdHistogram?.toFixed(3) ?? '--',
        color:
          effectivePrediction.indicators?.macdHistogram != null
            ? effectivePrediction.indicators.macdHistogram >= 0
              ? 'text-emerald-300'
              : 'text-rose-300'
            : 'text-slate-400',
      },
      {
        label: 'Volatility (14D)',
        value:
          indicatorSnapshot.volatility != null ? `${indicatorSnapshot.volatility.toFixed(2)}%` : '--',
        color: 'text-cyan-100',
      },
      {
        label: '30D Change',
        value:
          indicatorSnapshot.thirtyDayChange != null
            ? `${indicatorSnapshot.thirtyDayChange >= 0 ? '+' : ''}${indicatorSnapshot.thirtyDayChange.toFixed(2)}%`
            : '--',
        color:
          indicatorSnapshot.thirtyDayChange != null && indicatorSnapshot.thirtyDayChange >= 0
            ? 'text-emerald-300'
            : 'text-rose-300',
      },
      {
        label: 'Support (20D)',
        value:
          indicatorSnapshot.range.support != null
            ? formatCurrency(indicatorSnapshot.range.support)
            : '--',
        color: 'text-slate-200',
      },
      {
        label: 'Resistance (20D)',
        value:
          indicatorSnapshot.range.resistance != null
            ? formatCurrency(indicatorSnapshot.range.resistance)
            : '--',
        color: 'text-slate-200',
      },
    ];
  }, [effectivePrediction, indicatorSnapshot]);

  if (isLoading) {
    return <SkeletonLoader type="detail" />;
  }

  if (!stock) {
    return (
      <ErrorMessage
        message={error ?? 'Stock not found.'}
        actionLabel="Back to Dashboard"
        onAction={() => window.history.back()}
      />
    );
  }

  const displayStock = resolvedStock ?? stock;
  const positive = (displayStock.change ?? 0) >= 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </div>

      {error ? (
        <ErrorMessage
          message={error}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Stock details
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                {displayStock.symbol}
                <span className="ml-3 text-slate-400"> — {stock.name}</span>
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div
                  className={`rounded-xl text-4xl font-semibold text-white transition-colors duration-500 ${
                    priceFlash === 'up'
                      ? 'price-flash-up'
                      : priceFlash === 'down'
                        ? 'price-flash-down'
                        : ''
                  }`}
                >
                  {formatCurrency(displayStock.price)}
                </div>
                <div
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    positive
                      ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20'
                      : 'bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20'
                  }`}
                >
                  {formatPercent(displayStock.change)}
                </div>
                {displayStock.isFallback ? (
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200">
                    (cached)
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                isInWatchlist(displayStock.id)
                  ? void removeStock(displayStock.id)
                  : void addStock(displayStock)
              }
              disabled={isStockPending(displayStock.id)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Star
                size={16}
                className={
                  isInWatchlist(displayStock.id) ? 'fill-current text-amber-300' : ''
                }
              />
              {isInWatchlist(displayStock.id) ? 'Remove from watchlist' : 'Add to watchlist'}
            </button>
          </div>

          <div className="mt-8">
            {displayStock.history && displayStock.history.length > 0 ? (
              <EnhancedChart data={displayStock.history} color="#10b981" showSMA showEMA />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
                No price history available for this stock.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <article className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Trading signal
                </div>
                <div className="mt-3">
                  <SignalBadge signal={effectivePrediction?.prediction} />
                </div>
              </div>
              <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                <Activity size={20} />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-400">
              {effectivePrediction
                ? `Confidence ${effectivePrediction.confidence?.toFixed(0) ?? '--'}%`
                : 'Derived from chart history when the prediction endpoint is unavailable.'}
            </div>
          </article>

          <article className="card p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Volume snapshot
              </div>
              <ChartNoAxesCombined size={18} className="text-cyan-300" />
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">
              {displayStock.volume.toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-slate-400">Daily volume on the current record</div>
          </article>

          <article className="card p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Price range
              </div>
              <ChartNoAxesCombined size={18} className="text-cyan-300" />
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">
              {indicatorSnapshot?.range.rangePercent != null
                ? `${indicatorSnapshot.range.rangePercent.toFixed(2)}%`
                : '--'}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {indicatorSnapshot?.range.support != null &&
              indicatorSnapshot?.range.resistance != null
                ? `Support ${formatCurrency(indicatorSnapshot.range.support)} / Resistance ${formatCurrency(indicatorSnapshot.range.resistance)}`
                : 'Waiting for enough history to map support and resistance.'}
            </div>
          </article>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-semibold text-white">Technical indicators</h2>
        <p className="mt-2 text-sm text-slate-400">
          {effectivePrediction
            ? 'Key metrics blended from the prediction engine and client-side history analysis.'
            : 'Technical indicator data is not available for this stock at this time.'}
        </p>

        {metrics.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/8">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{metric.label}</div>
                <div className={`mt-4 text-3xl font-semibold ${metric.color}`}>{metric.value}</div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-slate-500">
            Indicators require sufficient historical price data to compute.
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="card p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">RSI</div>
          <h2 className="mt-3 text-2xl font-semibold text-white">Momentum oscillator</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Tracks overbought and oversold zones using 14-day relative strength.
          </p>
          <div className="mt-6">
            <RsiChart data={displayStock.history ?? []} />
          </div>
        </article>

        <article className="card p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">MACD</div>
          <h2 className="mt-3 text-2xl font-semibold text-white">Trend acceleration</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Histogram bars and signal lines reveal momentum shifts based on the available price
            history.
          </p>
          <div className="mt-6">
            <MacdChart data={displayStock.history ?? []} />
          </div>
        </article>
      </section>

      {/* AI Analysis Panel */}
      <AiAnalysisPanel
        input={{
          symbol: displayStock.symbol,
          price: displayStock.price,
          change: displayStock.change,
          rsi: effectivePrediction?.indicators?.rsi14 ?? indicatorSnapshot?.latest?.rsi ?? null,
          macd: effectivePrediction?.indicators?.macdHistogram ?? null,
          sma20: effectivePrediction?.indicators?.sma20 ?? null,
          ema20: effectivePrediction?.indicators?.ema20 ?? null,
        }}
      />
    </div>
  );
}
