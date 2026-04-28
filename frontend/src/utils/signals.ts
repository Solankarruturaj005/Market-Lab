import type { TradeSignal } from '../types/stock';

export function normalizeSignal(signal?: string): TradeSignal {
  const normalized = signal?.toUpperCase();

  if (normalized === 'BUY' || normalized === 'SELL') {
    return normalized;
  }

  return 'HOLD';
}
