import type { HistoryPoint, Stock } from '../types/stock';

const FALLBACK_HISTORY_DAYS = 90;

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function createHistory(currentPrice: number, volatility: number, drift: number): HistoryPoint[] {
  const today = new Date();
  const terminalWave =
    Math.sin((FALLBACK_HISTORY_DAYS - 1) / 4.8) * volatility +
    Math.cos((FALLBACK_HISTORY_DAYS - 1) / 11) * (volatility * 0.45);

  return Array.from({ length: FALLBACK_HISTORY_DAYS }, (_, index) => {
    const dayOffset = FALLBACK_HISTORY_DAYS - index - 1;
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);

    const wave =
      Math.sin(index / 4.8) * volatility + Math.cos(index / 11) * (volatility * 0.45);
    const trend = -dayOffset * drift;
    const close = Math.max(1, currentPrice + trend + (wave - terminalWave));

    return {
      date: date.toISOString(),
      close: round(close),
    };
  });
}

function getFallbackHistory(price: number, volatility = 5.3) {
  const drift = Math.max(price * 0.0015, 0.18);
  return createHistory(price, volatility, drift);
}

export const fallbackStocks: Stock[] = [
  {
    id: 1,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 214.63,
    change: 2.31,
    volume: 64320000,
    history: createHistory(214.63, 4.2, 0.16),
  },
  {
    id: 2,
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 428.21,
    change: 1.82,
    volume: 31800000,
    history: createHistory(428.21, 6.3, 0.24),
  },
  {
    id: 3,
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 967.88,
    change: 4.76,
    volume: 52240000,
    history: createHistory(967.88, 15.2, 0.55),
  },
  {
    id: 4,
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 178.55,
    change: -3.41,
    volume: 48760000,
    history: createHistory(178.55, 8.5, 0.12),
  },
  {
    id: 5,
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 182.94,
    change: 0.92,
    volume: 28400000,
    history: createHistory(182.94, 5.1, 0.14),
  },
  {
    id: 6,
    symbol: 'META',
    name: 'Meta Platforms',
    price: 496.27,
    change: -1.14,
    volume: 19650000,
    history: createHistory(496.27, 7.6, 0.2),
  },
];

function normalizeDateLabel(value: unknown, fallbackIndex: number) {
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    return value;
  }

  const date = new Date();
  date.setDate(date.getDate() - fallbackIndex);
  return date.toISOString();
}

function normalizeClose(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? round(numeric) : round(fallback);
}

function getUsablePrice(value: number | null | undefined, fallback = 100) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function normalizeHistory(
  history: unknown,
  fallbackPrice: number | null | undefined = 100,
  fallbackVolatility = 5.3,
): HistoryPoint[] {
  const safeFallbackPrice = getUsablePrice(fallbackPrice);

  if (!Array.isArray(history) || history.length === 0) {
    return getFallbackHistory(safeFallbackPrice, fallbackVolatility);
  }

  const normalized = history
    .map((point, index) => {
      const item = point as Record<string, unknown>;
      const close = normalizeClose(item.close ?? item.price ?? item.value, safeFallbackPrice);

      return {
        date: normalizeDateLabel(item.date ?? item.datetime ?? item.timestamp, history.length - index),
        close,
      } satisfies HistoryPoint;
    })
    .filter((point) => Number.isFinite(point.close));

  if (normalized.length === 0) {
    return getFallbackHistory(safeFallbackPrice, fallbackVolatility);
  }

  return normalized;
}

export function findFallbackStockBySymbol(symbol: string) {
  return fallbackStocks.find((item) => item.symbol === symbol.toUpperCase());
}

export function withHistory(stock: Stock): Stock {
  const fallback = findFallbackStockBySymbol(stock.symbol);

  if (stock.history?.length) {
    return {
      ...stock,
      history: normalizeHistory(stock.history, getUsablePrice(stock.price, fallback?.price ?? 100)),
    };
  }

  return {
    ...stock,
    history:
      fallback?.history ??
      getFallbackHistory(getUsablePrice(stock.price, fallback?.price ?? 100)),
  };
}
