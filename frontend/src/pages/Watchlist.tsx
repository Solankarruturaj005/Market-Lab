import { ArrowDownRight, ArrowUpRight, Star } from 'lucide-react';
import { useMemo } from 'react';
import { DataBadge } from '../components/DataBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { SkeletonLoader } from '../components/Loader';
import { PageHeader } from '../components/PageHeader';
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

  const gainers = filteredItems.filter(
    (i) => isFiniteNumber(i.stock?.change) && i.stock.change > 0,
  ).length;
  const losers = filteredItems.filter(
    (i) => isFiniteNumber(i.stock?.change) && i.stock.change < 0,
  ).length;
  const cachedCount = filteredItems.filter((i) => i.stock?.isFallback).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Saved Equities Watchlist"
        subtitle="Dedicated watchlist tracking active price movements and technical signals for your curated symbols."
        badge={
          <DataBadge
            variant="neutral"
            label={`${filteredItems.length} Focus Symbol${filteredItems.length === 1 ? '' : 's'}`}
          />
        }
      />

      {error ? (
        <ErrorMessage
          message={error}
          actionLabel="Reload Watchlist"
          onAction={() => void loadWatchlist(true)}
        />
      ) : null}

      {/* Overview Stats Strip */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#334155] bg-[#0F172A] p-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#94A3B8]">Portfolio Breadth:</span>
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#059669]">
              <ArrowUpRight size={13} /> {gainers} Advancing
            </span>
            <span className="text-[#64748B]">·</span>
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#DC2626]">
              <ArrowDownRight size={13} /> {losers} Declining
            </span>
          </div>

          {cachedCount > 0 && (
            <div className="ml-auto">
              <DataBadge variant="cached" label={`${cachedCount} Cached Feed(s)`} />
            </div>
          )}
        </div>
      )}

      {/* Grid or Empty State */}
      {filteredItems.length === 0 && !error ? (
        <EmptyState
          icon={<Star size={24} />}
          title={searchQuery ? 'No Matching Watchlist Equities' : 'Your Watchlist is Empty'}
          description={
            searchQuery
              ? `No symbols in your watchlist matched "${searchQuery}". Clear your search query to view all saved stocks.`
              : 'Add equities from the dashboard to track your focused portfolio, monitor real-time momentum, and evaluate algorithmic predictions.'
          }
          actionLabel="Explore Market Dashboard"
          actionTo="/"
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <StockCard
              key={item.id}
              stock={item.stock}
              inWatchlist={true}
              pending={isStockPending(item.stockId)}
              onToggleWatchlist={() => void removeStock(item.stockId)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
