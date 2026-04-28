import {
  ArrowDownRight,
  ArrowUpRight,
  CandlestickChart,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useDeferredValue, useMemo } from 'react';
import { ChartComponent, MarketIndexChart } from '../components/ChartComponent';
import { ErrorMessage } from '../components/ErrorMessage';
import { SkeletonLoader } from '../components/Loader';
import { StockCard } from '../components/StockCard';
import { SummaryCard } from '../components/SummaryCard';
import { useStocks } from '../hooks/useStocks';
import { useWatchlist } from '../hooks/useWatchlist';
import { useUiStore } from '../store/uiStore';
import { formatCompactNumber, formatCurrency, formatPercent, isFiniteNumber } from '../utils/formatters';
import { buildMarketIndexData } from '../utils/technicals';

export default function Dashboard() {
  const { stocks, isLoading, error, refreshStocks } = useStocks();
  const { items, addStock, removeStock, isInWatchlist, isStockPending } = useWatchlist();
  const searchQuery = useUiStore((state) => state.searchQuery);
  const sortBy = useUiStore((state) => state.sortBy);
  const setSortBy = useUiStore((state) => state.setSortBy);
  const showOnlyGainers = useUiStore((state) => state.showOnlyGainers);
  const toggleGainersFilter = useUiStore((state) => state.toggleGainersFilter);

  const showOnlyLosers = useUiStore((state) => state.showOnlyLosers);
  const toggleLosersFilter = useUiStore((state) => state.toggleLosersFilter);

  const deferredSearch = useDeferredValue(searchQuery);
  const numericValue = (value: number | null | undefined, fallback = 0) =>
    isFiniteNumber(value) ? value : fallback;

  const filteredStocks = useMemo(() => {
    const search = deferredSearch.trim().toLowerCase();

    return stocks
      .filter((stock) => {
        const matchesSearch =
          !search ||
          stock.name.toLowerCase().includes(search) ||
          stock.symbol.toLowerCase().includes(search);

        if (showOnlyGainers && !showOnlyLosers) return matchesSearch && numericValue(stock.change) > 0;
        if (showOnlyLosers && !showOnlyGainers) return matchesSearch && numericValue(stock.change) < 0;
        return matchesSearch;
      })
      .sort((left, right) => {
        switch (sortBy) {
          case 'price-asc':
            return numericValue(left.price) - numericValue(right.price);
          case 'price-desc':
            return numericValue(right.price) - numericValue(left.price);
          case 'change-asc':
            return numericValue(left.change) - numericValue(right.change);
          case 'change-desc':
            return numericValue(right.change) - numericValue(left.change);
          case 'market-cap':
          default:
            return right.volume - left.volume;
        }
      });
  }, [deferredSearch, showOnlyGainers, showOnlyLosers, sortBy, stocks]);

  const topGainer = useMemo(() => [...stocks].sort((a, b) => numericValue(b.change) - numericValue(a.change))[0], [stocks]);
  const topLoser = useMemo(() => [...stocks].sort((a, b) => numericValue(a.change) - numericValue(b.change))[0], [stocks]);
  const volumeLeader = useMemo(() => [...stocks].sort((a, b) => b.volume - a.volume)[0], [stocks]);
  const featuredStock = filteredStocks[0] ?? stocks[0];
  const marketIndexData = useMemo(() => buildMarketIndexData(stocks), [stocks]);
  const averageChange = useMemo(() => {
    if (filteredStocks.length === 0) {
      return 0;
    }

    return filteredStocks.reduce((sum, stock) => sum + numericValue(stock.change), 0) / filteredStocks.length;
  }, [filteredStocks]);
  const advancers = useMemo(
    () => filteredStocks.filter((stock) => numericValue(stock.change) > 0).length,
    [filteredStocks],
  );
  const decliners = useMemo(
    () => filteredStocks.filter((stock) => numericValue(stock.change) < 0).length,
    [filteredStocks],
  );
  const compositeIndexValue = marketIndexData[marketIndexData.length - 1]?.index ?? 100;
  const activeFilterLabel = showOnlyGainers
    ? 'Top gainers'
    : showOnlyLosers
      ? 'Top losers'
      : 'All movers';
  const cachedCount = filteredStocks.filter((stock) => stock.isFallback).length;

  if (isLoading && stocks.length === 0) {
    return <SkeletonLoader type="dashboard" />;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="card overflow-hidden p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                Dashboard overview
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Market pulse &amp; live stock momentum
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Explore major movers, review trend lines, and keep your watchlist in sync with
                backend market data.
              </p>
            </div>
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
                Tracked symbols
              </div>
              <div className="mt-2 text-3xl font-semibold text-white">{stocks.length}</div>
            </div>
          </div>

          {featuredStock?.history && featuredStock.history.length > 0 ? (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">{featuredStock.name}</div>
                  <div className="text-sm text-slate-400">{featuredStock.symbol} — 90-day trend</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">
                    {formatCurrency(featuredStock.price)}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      numericValue(featuredStock.change) >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {formatPercent(featuredStock.change)}
                    {featuredStock.isFallback ? ' (cached)' : ''}
                  </div>
                </div>
              </div>
              {/* SMA overlay enabled on featured chart */}
              <ChartComponent data={featuredStock.history} showSMA showEMA />
            </div>
          ) : featuredStock ? (
            <div className="mt-8 flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
              No price history for {featuredStock.symbol}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SummaryCard
            title="Top gainer"
            value={topGainer ? topGainer.symbol : '--'}
            subtitle={
              topGainer
                ? `${formatCurrency(topGainer.price)} · ${formatPercent(topGainer.change)}${topGainer.isFallback ? ' (cached)' : ''}`
                : 'No data'
            }
            icon={<ArrowUpRight size={22} />}
            variant="positive"
          />
          <SummaryCard
            title="Top loser"
            value={topLoser ? topLoser.symbol : '--'}
            subtitle={
              topLoser
                ? `${formatCurrency(topLoser.price)} · ${formatPercent(topLoser.change)}${topLoser.isFallback ? ' (cached)' : ''}`
                : 'No data'
            }
            icon={<ArrowDownRight size={22} />}
            variant="negative"
          />
          <SummaryCard
            title="Volume leader"
            value={volumeLeader ? formatCompactNumber(volumeLeader.volume) : '--'}
            subtitle={volumeLeader ? `${volumeLeader.symbol}${volumeLeader.isFallback ? ' (cached)' : ''} - highest activity` : 'No data'}
            icon={<CandlestickChart size={22} />}
            variant="neutral"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                Composite index
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Synthetic market baseline</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                Rebased from the tracked symbols so the dashboard still shows broad market context
                even when the backend feed is unavailable.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Last composite
              </div>
              <div className="mt-2 text-3xl font-semibold text-white">
                {compositeIndexValue.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <MarketIndexChart data={marketIndexData} />
          </div>
        </div>

        <div className="card p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Breadth</div>
          <h2 className="mt-3 text-2xl font-semibold text-white">Market breadth snapshot</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Quick internal benchmark built from the same symbols that power the dashboard cards.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                Advancing
              </div>
              <div className="mt-3 text-3xl font-semibold text-emerald-200">{advancers}</div>
            </div>
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-rose-200/80">
                Declining
              </div>
              <div className="mt-3 text-3xl font-semibold text-rose-200">{decliners}</div>
            </div>
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
                Avg change
              </div>
              <div className="mt-3 text-3xl font-semibold text-cyan-100">
                {averageChange >= 0 ? '+' : ''}
                {averageChange.toFixed(2)}%
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Universe size
              </div>
              <div className="mt-3 text-3xl font-semibold text-white">{filteredStocks.length}</div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <ErrorMessage
          message={error}
          actionLabel="Retry"
          onAction={() => void refreshStocks()}
        />
      ) : null}

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Stocks</h2>
            <p className="mt-2 text-sm text-slate-400">
              Search, sort, and monitor major tickers in one responsive grid.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Gainers filter */}
            <button
              type="button"
              onClick={toggleGainersFilter}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                showOnlyGainers
                  ? 'bg-emerald-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:border-emerald-400/30 hover:text-emerald-300'
              }`}
            >
              <TrendingUp size={15} />
              Gainers
            </button>

            {/* Losers filter */}
            <button
              type="button"
              onClick={toggleLosersFilter}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                showOnlyLosers
                  ? 'bg-rose-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:border-rose-400/30 hover:text-rose-300'
              }`}
            >
              <TrendingDown size={15} />
              Losers
            </button>

            {/* Sort dropdown */}
            <label className="dropdown-shell cursor-pointer rounded-full text-sm">
              <SlidersHorizontal size={16} />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                className="dropdown-select min-w-[150px]"
              >
                <option className="dropdown-option" value="change-desc">
                  Top change
                </option>
                <option className="dropdown-option" value="change-asc">
                  Lowest change
                </option>
                <option className="dropdown-option" value="price-desc">
                  Highest price
                </option>
                <option className="dropdown-option" value="price-asc">
                  Lowest price
                </option>
                <option className="dropdown-option" value="market-cap">
                  Highest volume
                </option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
            {filteredStocks.length} results
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
            {items.length} in watchlist
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
            {activeFilterLabel}
          </span>
          {cachedCount > 0 ? (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-yellow-200">
              {cachedCount} (cached)
            </span>
          ) : null}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
            Avg change {averageChange >= 0 ? '+' : ''}
            {averageChange.toFixed(2)}%
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredStocks.map((stock, index) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              highlighted={index === 0}
              inWatchlist={isInWatchlist(stock.id)}
              pending={isStockPending(stock.id)}
              onToggleWatchlist={(selectedStock) =>
                isInWatchlist(selectedStock.id)
                  ? void removeStock(selectedStock.id)
                  : void addStock(selectedStock)
              }
            />
          ))}
        </div>

        {filteredStocks.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-slate-400">
            {showOnlyGainers
              ? 'No gainers found with the current search.'
              : showOnlyLosers
              ? 'No losers found with the current search.'
              : 'No stocks matched the current search or filter.'}
          </div>
        ) : null}
      </section>
    </div>
  );
}
