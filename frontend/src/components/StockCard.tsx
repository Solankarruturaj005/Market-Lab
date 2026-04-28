import { ArrowDownRight, ArrowUpRight, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MiniSparkline } from './ChartComponent';
import type { Stock } from '../types/stock';
import { cn } from '../utils/cn';
import { formatCompactNumber, formatCurrency, formatPercent } from '../utils/formatters';
import { withHistory } from '../utils/stock';

interface StockCardProps {
  stock: Stock;
  highlighted?: boolean;
  inWatchlist?: boolean;
  pending?: boolean;
  onToggleWatchlist?: (stock: Stock) => void;
}

export function StockCard({
  stock,
  highlighted = false,
  inWatchlist = false,
  pending = false,
  onToggleWatchlist,
}: StockCardProps) {
  const displayStock = withHistory(stock);
  const previousPrice = useRef<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const displayPrice = displayStock.price;
  const displayChange = displayStock.change;

  // 🔥 FIX: Safe checks
  const hasValidPrice =
    displayPrice !== null &&
    displayPrice !== undefined &&
    displayPrice > 0;

  const hasValidChange =
    displayChange !== null &&
    displayChange !== undefined;

  const positive = displayChange == null ? true : displayChange >= 0;

  const sparkColor = positive ? '#10b981' : '#f43f5e';

  useEffect(() => {
    if (!hasValidPrice || displayPrice == null) {
      previousPrice.current = null;
      return;
    }

    if (previousPrice.current != null && previousPrice.current !== displayPrice) {
      setPriceFlash(displayPrice > previousPrice.current ? 'up' : 'down');
      const timeout = window.setTimeout(() => setPriceFlash(null), 900);
      previousPrice.current = displayPrice;
      return () => window.clearTimeout(timeout);
    }

    previousPrice.current = displayPrice;
  }, [displayPrice, hasValidPrice]);

  const latestSma =
    displayStock.history && displayStock.history.length >= 20
      ? Number(
          (
            displayStock.history
              .slice(-20)
              .reduce((total, point) => total + point.close, 0) / 20
          ).toFixed(2),
        )
      : null;

  return (
    <article
      className={cn(
        'card group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl',
        highlighted && 'ring-1 ring-cyan-300/20',
        positive
          ? 'hover:ring-1 hover:ring-emerald-400/15'
          : 'hover:ring-1 hover:ring-rose-400/15',
      )}
    >
      {/* Background glow */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          positive ? 'bg-emerald-400/[0.03]' : 'bg-rose-400/[0.03]',
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <Link to={`/stock/${displayStock.symbol}`} className="space-y-1 flex-1 min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            {displayStock.symbol}
          </p>
          <h3 className="truncate text-lg font-semibold text-white group-hover:text-cyan-100 transition-colors">
            {displayStock.name}
          </h3>
        </Link>

        <button
          type="button"
          onClick={() => onToggleWatchlist?.(stock)}
          disabled={pending}
          className={cn(
            'flex-shrink-0 rounded-full border p-2 transition active:scale-90',
            pending && 'cursor-not-allowed opacity-60',
            inWatchlist
              ? 'border-amber-300/30 bg-amber-400/10 text-amber-200'
              : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30 hover:text-cyan-200',
          )}
        >
          <Star size={16} className={cn(inWatchlist && 'fill-current')} />
        </button>
      </div>

      {/* Chart */}
      {displayStock.history && displayStock.history.length > 1 && (
        <div className="mt-3 -mx-1">
          <MiniSparkline data={displayStock.history} color={sparkColor} />
        </div>
      )}

      {/* Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {positive ? 'Positive momentum' : 'Under pressure'}
        </span>

        {latestSma != null && (
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
            20D SMA {formatCurrency(latestSma)}
          </span>
        )}

        {/* 🔥 NEW: Fallback indicator */}
        {displayStock.isFallback && (
          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-yellow-200">
            (cached)
          </span>
        )}
      </div>

      {/* Price + Change */}
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <div
            className={cn(
              'rounded-xl text-3xl font-semibold text-white transition-colors duration-500',
              priceFlash === 'up' && 'price-flash-up',
              priceFlash === 'down' && 'price-flash-down',
            )}
          >
            {/* Safe price display */}
            {hasValidPrice ? formatCurrency(displayStock.price) : 'N/A'}
          </div>

          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            Vol {formatCompactNumber(displayStock.volume)}
          </div>
        </div>

        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold',
            positive
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-rose-500/10 text-rose-300',
          )}
        >
          {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}

          {/*Safe change display */}
          {hasValidChange ? formatPercent(displayStock.change) : '--'}
        </div>
      </div>
    </article>
  );
}
