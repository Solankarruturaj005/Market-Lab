import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Filter,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { ChartComponent, MarketIndexChart } from '../components/ChartComponent';
import { AdvancedStockChart } from '../features/charts/AdvancedStockChart';
import { DataBadge } from '../components/DataBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { SkeletonLoader } from '../components/Loader';
import { PageHeader } from '../components/PageHeader';
import { StockCard } from '../components/StockCard';
import { SummaryCard } from '../components/SummaryCard';
import { useStocks } from '../hooks/useStocks';
import { useWatchlist } from '../hooks/useWatchlist';
import { useUiStore } from '../store/uiStore';
import { formatCompactNumber, formatCurrency, formatPercent, isFiniteNumber, isIndexSymbol } from '../utils/formatters';
import { buildMarketIndexData } from '../utils/technicals';

export default function Dashboard() {
  const { stocks, isLoading, error, refreshStocks } = useStocks();
  const { addStock, removeStock, isInWatchlist, isStockPending } = useWatchlist();

  const searchQuery = useUiStore((state) => state.searchQuery);
  const sortBy = useUiStore((state) => state.sortBy);
  const setSortBy = useUiStore((state) => state.setSortBy);
  const showOnlyGainers = useUiStore((state) => state.showOnlyGainers);
  const toggleGainersFilter = useUiStore((state) => state.toggleGainersFilter);
  const showOnlyLosers = useUiStore((state) => state.showOnlyLosers);
  const toggleLosersFilter = useUiStore((state) => state.toggleLosersFilter);

  const [chartView, setChartView] = useState<'featured' | 'candlestick' | 'basket'>('featured');
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);

  const deferredSearch = useDeferredValue(searchQuery);
  const numericValue = (value: number | null | undefined, fallback = 0) =>
    isFiniteNumber(value) ? value : fallback;

  // Filter & Sort
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

  // Aggregate Key Metrics
  const topGainer = useMemo(
    () => [...stocks].sort((a, b) => numericValue(b.change) - numericValue(a.change))[0],
    [stocks],
  );
  const topLoser = useMemo(
    () => [...stocks].sort((a, b) => numericValue(a.change) - numericValue(b.change))[0],
    [stocks],
  );
  const volumeLeader = useMemo(
    () => [...stocks].sort((a, b) => b.volume - a.volume)[0],
    [stocks],
  );

  const featuredStock = filteredStocks[0] ?? stocks[0];
  const marketIndexData = useMemo(() => buildMarketIndexData(stocks), [stocks]);

  const advancers = useMemo(
    () => stocks.filter((stock) => numericValue(stock.change) > 0).length,
    [stocks],
  );
  const decliners = useMemo(
    () => stocks.filter((stock) => numericValue(stock.change) < 0).length,
    [stocks],
  );
  const unchanged = stocks.length - advancers - decliners;
  const cachedCount = stocks.filter((stock) => stock.isFallback).length;

  if (isLoading && stocks.length === 0) {
    return <SkeletonLoader type="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Compact Page Header & Data Status */}
      <PageHeader
        title="Institutional Equity Overview"
        subtitle="Tracking multi-period price action, moving averages, and quantitative breadth across coverage."
        badge={
          cachedCount > 0 ? (
            <DataBadge variant="cached" label={`${cachedCount} Cached Feed(s)`} />
          ) : (
            <DataBadge variant="live" label="Live Stream" />
          )
        }
        actions={
          <button
            type="button"
            onClick={() => refreshStocks()}
            className="secondary-button text-xs py-2 px-3"
            title="Refresh Quotes"
          >
            <RefreshCw size={13} />
            <span>Sync Feeds</span>
          </button>
        }
      />

      {error && (
        <ErrorMessage
          message={error}
          actionLabel="Retry Synchronize"
          onAction={() => refreshStocks()}
        />
      )}

      {/* 2. Key Summary Metrics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Coverage Universe"
          value={String(stocks.length)}
          subtitle={`${advancers} advancing · ${decliners} declining`}
          icon={<BarChart3 size={18} />}
          variant="neutral"
        />

        <SummaryCard
          title="Top Gainer"
          value={topGainer ? topGainer.symbol : '—'}
          subtitle={
            topGainer
              ? `${formatPercent(topGainer.change ?? 0)} · ${formatCurrency(topGainer.price ?? 0, topGainer.symbol)}`
              : 'No mover data'
          }
          icon={<TrendingUp size={18} />}
          variant="positive"
        />

        <SummaryCard
          title="Top Decliners"
          value={topLoser ? topLoser.symbol : '—'}
          subtitle={
            topLoser
              ? `${formatPercent(topLoser.change ?? 0)} · ${formatCurrency(topLoser.price ?? 0, topLoser.symbol)}`
              : 'No mover data'
          }
          icon={<TrendingDown size={18} />}
          variant="negative"
        />

        <SummaryCard
          title="Volume Leader"
          value={volumeLeader ? volumeLeader.symbol : '—'}
          subtitle={
            volumeLeader
              ? `${formatCompactNumber(volumeLeader.volume)} shares traded`
              : 'No volume data'
          }
          icon={<Volume2 size={18} />}
          variant="neutral"
        />
      </section>

      {/* 3. Main Trend Chart with Moving Average Overlays & Breadth Panel */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
        {/* Main Chart Panel */}
        <div className="card p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#334155] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  {chartView === 'featured' ? 'Selected Equities Trend' : 'Tracked Basket Aggregate'}
                </span>
                <span className="text-xs text-[#64748B]">
                  {chartView === 'featured' && featuredStock ? `(${featuredStock.symbol})` : '(Equal-Weighted)'}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white mt-1">
                {chartView === 'featured' && featuredStock
                  ? `${featuredStock.name} Price Action`
                  : 'Tracked 21-Asset Performance Index'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Chart Switcher */}
              <div className="flex rounded-md border border-[#334155] bg-[#1E293B] p-0.5">
                <button
                  type="button"
                  onClick={() => setChartView('featured')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    chartView === 'featured'
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Line Trend
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('candlestick')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    chartView === 'candlestick'
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  🕯 Candlestick
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('basket')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    chartView === 'basket'
                      ? 'bg-[#0F172A] text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Equal-Weighted
                </button>
              </div>

              {/* Indicator Toggles (Available in featured mode) */}
              {chartView === 'featured' && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-[#334155]">
                  <button
                    type="button"
                    onClick={() => setShowSMA((prev) => !prev)}
                    className={`rounded px-2 py-1 text-xs font-mono transition border ${
                      showSMA
                        ? 'border-[#94A3B8] bg-[#1E293B] text-white'
                        : 'border-[#334155] bg-[#0F172A] text-[#64748B]'
                    }`}
                  >
                    SMA 20
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEMA((prev) => !prev)}
                    className={`rounded px-2 py-1 text-xs font-mono transition border ${
                      showEMA
                        ? 'border-[#64748B] bg-[#1E293B] text-white'
                        : 'border-[#334155] bg-[#0F172A] text-[#64748B]'
                    }`}
                  >
                    EMA 20
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chart Rendering */}
          {chartView === 'candlestick' ? (
            featuredStock ? (
              <AdvancedStockChart
                symbol={featuredStock.symbol}
                height={380}
                initialChartType="candlestick"
                currency={isIndexSymbol(featuredStock.symbol) ? 'POINTS' : 'USD'}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-xs text-[#94A3B8]">
                Select a stock to view candlestick terminal...
              </div>
            )
          ) : chartView === 'featured' ? (
            featuredStock && featuredStock.history && featuredStock.history.length > 0 ? (
              <ChartComponent
                data={featuredStock.history}
                currentPrice={featuredStock.price}
                showSMA={showSMA}
                showEMA={showEMA}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-xs text-[#94A3B8]">
                Historical price points loading for primary symbol...
              </div>
            )
          ) : (
            <MarketIndexChart data={marketIndexData} />
          )}

          <div className="text-[11px] text-[#64748B]">
            * Note: Equal-weighted basket is a calculated aggregate of tracked database symbols,
            not an official exchange benchmark (S&amp;P 500 / NASDAQ).
          </div>
        </div>

        {/* Market Breadth & Distribution Panel */}
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Market Breadth
            </div>
            <h2 className="text-base font-semibold text-white mt-1">Coverage Distribution</h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Advance/Decline ratio across all active database equities.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#059669] font-medium flex items-center gap-1">
                    <ArrowUpRight size={13} /> Advancing
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {advancers} ({stocks.length ? ((advancers / stocks.length) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#059669]"
                    style={{
                      width: `${stocks.length ? (advancers / stocks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#DC2626] font-medium flex items-center gap-1">
                    <ArrowDownRight size={13} /> Declining
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {decliners} ({stocks.length ? ((decliners / stocks.length) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#DC2626]"
                    style={{
                      width: `${stocks.length ? (decliners / stocks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#94A3B8] font-medium">Unchanged</span>
                  <span className="font-mono text-white font-semibold">{unchanged}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#334155] bg-[#1E293B]/40 p-3.5 space-y-1">
            <div className="text-[11px] font-semibold text-white">Breadth Sentiment</div>
            <div className="text-xs text-[#94A3B8]">
              {advancers > decliners
                ? 'Positive market breadth across coverage with leading gainers outperforming.'
                : decliners > advancers
                  ? 'Defensive market breadth with majority of symbols contracting.'
                  : 'Neutral balanced distribution across coverage.'}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Controls: Filters & Sorting */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#334155] pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#94A3B8] flex items-center gap-1 mr-1">
            <Filter size={13} /> Filter:
          </span>
          <button
            type="button"
            onClick={() => {
              if (showOnlyGainers) toggleGainersFilter();
              if (showOnlyLosers) toggleLosersFilter();
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              !showOnlyGainers && !showOnlyLosers
                ? 'bg-[#F8FAFC] text-[#0F172A] font-semibold'
                : 'border border-[#334155] bg-[#0F172A] text-[#94A3B8] hover:text-white'
            }`}
          >
            All Symbols ({stocks.length})
          </button>
          <button
            type="button"
            onClick={toggleGainersFilter}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              showOnlyGainers
                ? 'bg-[#059669] text-white font-semibold'
                : 'border border-[#334155] bg-[#0F172A] text-[#94A3B8] hover:text-white'
            }`}
          >
            Gainers ({advancers})
          </button>
          <button
            type="button"
            onClick={toggleLosersFilter}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              showOnlyLosers
                ? 'bg-[#DC2626] text-white font-semibold'
                : 'border border-[#334155] bg-[#0F172A] text-[#94A3B8] hover:text-white'
            }`}
          >
            Decliners ({decliners})
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-[#94A3B8]">
            Sort By:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-md border border-[#334155] bg-[#0F172A] px-2.5 py-1.5 text-xs text-white focus:border-[#F8FAFC] focus:outline-none"
          >
            <option value="market-cap">Highest Volume</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="change-desc">Highest % Gain</option>
            <option value="change-asc">Lowest % Change</option>
          </select>
        </div>
      </section>

      {/* 5. Searchable Stock Grid */}
      {filteredStocks.length === 0 ? (
        <EmptyState
          title="No Matching Equities"
          description={`No tracked stocks matched the search filter "${searchQuery}". Clear your search query or reset the active filter.`}
          actionLabel="Clear Filters"
          onAction={() => {
            if (showOnlyGainers) toggleGainersFilter();
            if (showOnlyLosers) toggleLosersFilter();
          }}
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStocks.map((stock) => (
            <StockCard
              key={stock.id || stock.symbol}
              stock={stock}
              inWatchlist={isInWatchlist(stock.id)}
              pending={isStockPending(stock.id)}
              onToggleWatchlist={(s) => {
                if (isInWatchlist(s.id)) {
                  void removeStock(s.id);
                } else {
                  void addStock(s);
                }
              }}
            />
          ))}
        </section>
      )}
    </div>
  );
}
