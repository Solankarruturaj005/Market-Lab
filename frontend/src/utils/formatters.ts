export const MARKET_INDEX_SYMBOLS = new Set([
  'HSI',
  'NYA',
  'IXIC',
  '000001.SS',
  'N225',
  'N100',
  '399001.SZ',
  'GSPTSE',
  'NSEI',
  'GDAXI',
  'SSMI',
  'TWII',
  'J203.JO',
]);

export function isIndexSymbol(symbol?: string | null): boolean {
  if (!symbol) return false;
  return MARKET_INDEX_SYMBOLS.has(symbol.trim().toUpperCase());
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Formats price values.
 * Formats exchange market indices as points ("pts") and equities as currency ("$").
 */
export function formatPrice(value: number | null | undefined, symbol?: string | null): string {
  if (!isFiniteNumber(value) || value <= 0) {
    return 'N/A';
  }

  if (isIndexSymbol(symbol)) {
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value)} pts`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Backward-compatible formatCurrency accepting optional symbol parameter.
 */
export function formatCurrency(value: number | null | undefined, symbol?: string | null): string {
  return formatPrice(value, symbol);
}

export function formatCompactNumber(value: number | null | undefined, _symbol?: string | null): string {
  if (!isFiniteNumber(value)) {
    return '--';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

  // If index, append "shares/pts" context if needed, or compact units
  return formatted;
}

export function formatPercent(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) {
    return '--';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}
