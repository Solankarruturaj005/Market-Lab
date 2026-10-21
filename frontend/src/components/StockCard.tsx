import { ArrowDownRight, ArrowUpRight, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataBadge } from './DataBadge';
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

  const hasValidPrice = displayPrice !== null && displayPrice !== undefined && displayPrice > 0;
  const positive = displayChange == null ? true : displayChange >= 0;
  const sparkColor = positive ? '#059669' : '#DC2626';

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

  return (
    <article
      className={cn(
        'card group relative p-4 transition-colors hover:border-[#475569]',
        highlighted && 'border-slate-500 bg-[#1E293B]/40',
      )}
    >
      {/* Header: Symbol, Name & Watchlist Toggle */}
      <div className="flex items-start justify-between gap-3">
        <Link to={`/stock/${displayStock.symbol}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white group-hover:underline">
              {displayStock.symbol}
            </span>
            {displayStock.isFallback ? (
              <DataBadge variant="fallback" label="Cached" />
            ) : displayStock.source === 'live' ? (
              <DataBadge variant="live" label="Live" />
            ) : null}
          </div>
          <h3 className="truncate text-xs font-normal text-[#94A3B8] mt-0.5">
            {displayStock.name}
          </h3>
        </Link>

        {onToggleWatchlist && (
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onToggleWatchlist(displayStock);
            }}
            className={cn(
              'rounded p-1.5 transition',
              inWatchlist
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-[#64748B] hover:bg-[#1E293B] hover:text-white',
              pending && 'opacity-50 cursor-not-allowed',
            )}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Star size={16} fill={inWatchlist ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Mini Sparkline Chart */}
      <div className="my-3">
        {displayStock.history && displayStock.history.length > 1 ? (
          <MiniSparkline
            data={displayStock.history}
            currentPrice={displayPrice}
            color={sparkColor}
          />
        ) : (
          <div className="h-10 rounded border border-dashed border-[#334155]/60 flex items-center justify-center text-[10px] text-[#64748B]">
            No sparkline data
          </div>
        )}
      </div>

      {/* Price & Change Row */}
      <div className="flex items-baseline justify-between pt-1 border-t border-[#334155]/60">
        <div>
          <span
            className={cn(
              'font-mono text-base font-semibold text-white transition-colors duration-300',
              priceFlash === 'up' && 'text-[#059669]',
              priceFlash === 'down' && 'text-[#DC2626]',
            )}
          >
            {hasValidPrice ? formatCurrency(displayPrice!, displayStock.symbol) : '—'}
          </span>
          <span className="block text-[10px] text-[#64748B]">
            Vol: {displayStock.volume ? formatCompactNumber(displayStock.volume) : 'N/A'}
          </span>
        </div>

        <div className="text-right">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-mono text-xs font-semibold',
              positive ? 'text-[#059669]' : 'text-[#DC2626]',
            )}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {displayChange != null ? formatPercent(displayChange) : '0.00%'}
          </span>
        </div>
      </div>
    </article>
  );
}
