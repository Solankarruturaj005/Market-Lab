import { create } from 'zustand';
import type { Stock } from '../types/stock';
import api, { getLiveStock } from '../services/api';

const MAX_LIVE_QUOTES_PER_REFRESH = 5;
let latestRequestId = 0;

interface MarketState {
  stocks: Stock[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  loadStocks: () => Promise<void>;
  refreshStocks: () => Promise<void>;
}

async function fetchBaseStocks() {
  const response = await api.get<Stock[]>('/stocks');
  return response.data;
}

function isValidPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isLiveOrCachedQuote(live: any) {
  return live?.source === 'live' || live?.source === 'cache' || live?.isFallback === false;
}

async function mergeLiveQuotes(stocks: Stock[]) {
  const liveCandidates = stocks.slice(0, MAX_LIVE_QUOTES_PER_REFRESH);
  const liveResults = await Promise.allSettled(
    liveCandidates.map(async (stock) => ({
      symbol: stock.symbol,
      live: await getLiveStock(stock.symbol),
    })),
  );

  const liveBySymbol = new Map<string, Partial<Stock>>();

  for (const result of liveResults) {
    if (result.status !== 'fulfilled') {
      continue;
    }

    const stock = stocks.find((item) => item.symbol === result.value.symbol);
    const live = result.value.live;
    const shouldOverrideFromLive = isLiveOrCachedQuote(live);

    console.log('DB:', stock?.price);
    console.log('LIVE:', live.price);

    liveBySymbol.set(result.value.symbol, {
      price: shouldOverrideFromLive && isValidPrice(live.price) ? live.price : null,
      change: shouldOverrideFromLive && isValidNumber(live.change) ? live.change : null,
      isFallback: shouldOverrideFromLive
        ? Boolean(live.isFallback && live.source !== 'cache')
        : stock?.isFallback,
      source: live.source,
    });
  }

  return stocks.map((stock) => {
    const live = liveBySymbol.get(stock.symbol);
    const merged = live
      ? {
          ...stock,
          price: isValidPrice(live.price) ? live.price : stock.price,
          change: isValidNumber(live.change) ? live.change : stock.change,
          isFallback: live.isFallback ?? stock.isFallback,
          source: live.source ?? stock.source,
        }
      : stock;

    if (live) {
      console.log('FINAL:', merged.price);
    }

    return merged;
  });
}

function preserveLiveValues(nextStocks: Stock[], currentStocks: Stock[]) {
  const currentBySymbol = new Map(currentStocks.map((stock) => [stock.symbol, stock]));

  return nextStocks.map((stock) => {
    const current = currentBySymbol.get(stock.symbol);

    if (!current) {
      return stock;
    }

    return {
      ...stock,
      price: isValidPrice(current.price) ? current.price : stock.price,
      change: isValidNumber(current.change) ? current.change : stock.change,
      isFallback: current.isFallback ?? stock.isFallback,
      source: current.source ?? stock.source,
    };
  });
}

export const useMarketStore = create<MarketState>((set, get) => ({
  stocks: [],
  isLoading: false,
  error: null,
  hasLoaded: false,

  /** Initial load — fetches all stocks from the DB. Called once on mount. */
  loadStocks: async () => {
    if (get().isLoading) {
      return;
    }

    const requestId = ++latestRequestId;

    try {
      set({ isLoading: true, error: null });

      const stocks = await fetchBaseStocks();
      const preservedStocks = preserveLiveValues(stocks, get().stocks);
      const mergedStocks = await mergeLiveQuotes(preservedStocks);

      if (requestId !== latestRequestId) {
        return;
      }

      set({
        stocks: mergedStocks,
        isLoading: false,
        error: null,
        hasLoaded: true,
      });
    } catch (error: any) {
      set({
        error: error?.message ?? 'Unable to load stocks.',
        isLoading: false,
      });
    }
  },
  /**
   * Silent background refresh — does NOT show a loading spinner.
   * Only updates prices from DB. Does NOT call the live Alpha Vantage API
   * to avoid hammering the 5 req/min free-tier rate limit.
   *
   * If you want live prices, call /stocks/live/:symbol for individual symbols
   * from the StockDetails page only, NOT in bulk on every interval.
   */
  refreshStocks: async () => {
    if (get().isLoading) {
      return;
    }

    const requestId = ++latestRequestId;

    try {
      const stocks = await fetchBaseStocks();
      const mergedStocks = preserveLiveValues(stocks, get().stocks);
      const updatedStocks = await mergeLiveQuotes(mergedStocks);

      if (requestId !== latestRequestId) {
        return;
      }

      console.debug('[marketStore] Background refresh — updated', stocks.length, 'stocks');
      set({ stocks: updatedStocks, error: null, hasLoaded: true });
    } catch (error: any) {
      // Silent fail for background refresh — don't flash error on screen
      console.warn('[marketStore] Background refresh failed:', error?.message ?? error);
    }
  },
}));
