import type { HistoryPoint } from '../types/stock';

/**
 * Computes Simple Moving Average (SMA) over a window of N periods.
 * Returns an array aligned with the input data — first (window-1) entries are null.
 */
export function computeSMA(data: HistoryPoint[], window: number): (number | null)[] {
  if (!data || data.length === 0) return [];

  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - window + 1, i + 1);
      const sum = slice.reduce((acc, p) => acc + p.close, 0);
      result.push(Number((sum / window).toFixed(2)));
    }
  }

  return result;
}

/**
 * Merges SMA values into history data for chart rendering.
 */
export interface ChartDataPoint extends HistoryPoint {
  sma?: number | null;
  formattedDate?: string;
}

export function buildChartData(
  history: HistoryPoint[],
  smaWindow = 20,
): ChartDataPoint[] {
  if (!history || history.length === 0) return [];

  const smaValues = computeSMA(history, smaWindow);

  return history.map((point, i) => ({
    ...point,
    sma: smaValues[i],
    // Format dates as "Apr 7" style for better readability
    formattedDate: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));
}
