import api from '../../services/api';
import type { OhlcvBar, StockHistoryResponse, TimeframeRange } from './chartTypes';
import { validateAndSanitizeOhlcv } from './validateOhlcv';

export async function fetchStockHistory(
  symbol: string,
  range: TimeframeRange = '1Y',
  signal?: AbortSignal,
): Promise<StockHistoryResponse> {
  const normalizedSymbol = symbol.trim().toUpperCase();

  try {
    const { data } = await api.get<StockHistoryResponse>(
      `/stocks/${normalizedSymbol}/history`,
      {
        params: { range: range.toLowerCase(), interval: '1d' },
        signal,
        timeout: 15000,
      },
    );

    const { validBars } = validateAndSanitizeOhlcv(data.bars);

    return {
      symbol: data.symbol || normalizedSymbol,
      companyName: data.companyName,
      currency: data.currency || 'USD',
      interval: '1d',
      dataSource: data.dataSource || 'database',
      lastUpdated: data.lastUpdated,
      bars: validBars,
    };
  } catch (err: any) {
    // If /stocks/:symbol/history is not supported or failed, try adapting /stocks/:symbol
    if (signal?.aborted) {
      throw err;
    }

    const { data: stock } = await api.get(`/stocks/${normalizedSymbol}`, {
      signal,
      timeout: 15000,
    });

    const rawBars: any[] = (stock.history ?? []).map((point: any) => {
      const ts = new Date(point.date).getTime();
      const close = Number(point.close);
      const open = Number(point.open ?? point.close);
      const high = Number(point.high ?? Math.max(open, close));
      const low = Number(point.low ?? Math.min(open, close));
      const volume = Number(point.volume) || null;

      return {
        timestamp: ts,
        open,
        high,
        low,
        close,
        volume,
      };
    });

    const { validBars } = validateAndSanitizeOhlcv(rawBars);

    return {
      symbol: stock.symbol,
      companyName: stock.name,
      currency: 'USD',
      interval: '1d',
      dataSource: stock.source === 'database' ? 'database' : 'fallback',
      lastUpdated: stock.history?.at(-1)?.date ?? null,
      bars: validBars,
    };
  }
}

/**
 * Filter an already-loaded bars array by TimeframeRange client-side for rapid switching.
 */
export function filterBarsByTimeframe(bars: OhlcvBar[], range: TimeframeRange): OhlcvBar[] {
  if (range === 'All' || bars.length === 0) {
    return bars;
  }

  const lastBar = bars[bars.length - 1];
  const lastTime = lastBar.timestamp;

  let days = 365;
  switch (range) {
    case '5D':
      return bars.slice(-5);
    case '1M':
      days = 30;
      break;
    case '3M':
      days = 90;
      break;
    case '6M':
      days = 180;
      break;
    case '1Y':
      days = 365;
      break;
    case '3Y':
      days = 365 * 3;
      break;
  }

  const cutoff = lastTime - days * 24 * 60 * 60 * 1000;
  const filtered = bars.filter((b) => b.timestamp >= cutoff);
  return filtered.length >= 2 ? filtered : bars;
}
