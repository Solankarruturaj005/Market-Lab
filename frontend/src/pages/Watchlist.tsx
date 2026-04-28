import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ErrorMessage } from '../components/ErrorMessage';
import { SkeletonLoader } from '../components/Loader';
import { StockCard } from '../components/StockCard';
import { useWatchlist } from '../hooks/useWatchlist';
import { useUiStore } from '../store/uiStore';
import { isFiniteNumber } from '../utils/formatters';


export default function Watchlist() {
  const { items, isLoading, error, removeStock, loadWatchlist, isStockPending } = useWatchlist();
  const searchQuery = useUiStore((state) => state.searchQuery);
  const filteredItems = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    if (!search) {
      return items;
    }

    return items.filter((item) => {
      const stock = item.stock;

      return (
        stock?.symbol.toLowerCase().includes(search) ||
        stock?.name.toLowerCase().includes(search)
      );
    });
  }, [items, searchQuery]);

  if (isLoading && items.length === 0) {
    return <SkeletonLoader type="watchlist" />;
  }

  // Aggregate stats for header
  const gainers = filteredItems.filter((i) => isFiniteNumber(i.stock?.change) && i.stock.change > 0).length;
  const losers = filteredItems.filter((i) => isFiniteNumber(i.stock?.change) && i.stock.change < 0).length;
  const cached = filteredItems.filter((i) => i.stock?.isFallback).length;

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Watchlist</div>
            <h1 className="mt-3 text-3xl font-semibold text-white">Your saved market focus</h1>
            <p className="mt-3 text-sm text-slate-400">
              Keep a tighter view on the stocks you care about most.
            </p>
            {filteredItems.length > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <ArrowUpRight size={13} />
                  {gainers} gaining
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-300">
                  <ArrowDownRight size={13} />
                  {losers} losing
                </span>
                {cached > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/10 px-3 py-1.5 text-xs font-semibold text-yellow-200">
                    {cached} (cached)
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Saved stocks</div>
            <div className="mt-2 text-3xl font-semibold text-white">{filteredItems.length}</div>
          </div>
        </div>
      </section>

      {error ? (
        <ErrorMessage
          message={error}
          actionLabel="Reload"
          onAction={() => void loadWatchlist(true)}
        />
      ) : null}

      {filteredItems.length === 0 && !error ? (
        <section className="card flex min-h-[260px] flex-col items-center justify-center p-10 text-center">
          <div className="mb-4 rounded-full border border-white/10 bg-white/5 p-5">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white">Your watchlist is empty</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
            {searchQuery
              ? 'No watchlist symbols matched the current search.'
              : 'Add stocks from the dashboard to keep quick access to your favorite symbols and signals.'}
          </p>
          <Link to="/" className="primary-button mt-6">
            Explore dashboard
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredItems.map((item) => {
            const stock = item.stock;
            if (!stock) return null;

            return (
              <StockCard
                key={item.id}
                stock={stock}
                inWatchlist
                pending={isStockPending(stock.id)}
                onToggleWatchlist={() => void removeStock(item.id)}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}
