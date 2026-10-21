export interface OhlcvBar {
  timestamp: number; // Unix epoch in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export type TimeframeRange = '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | 'All';

export type ChartType = 'candlestick' | 'ohlc' | 'line' | 'area';

export type DataSourceType = 'live' | 'cached' | 'fallback' | 'seeded' | 'database' | 'unknown';

export interface StockHistoryResponse {
  symbol: string;
  companyName?: string;
  currency?: string;
  interval: '1d' | '1h' | '15m' | '5m';
  dataSource: DataSourceType;
  lastUpdated: string | null;
  bars: OhlcvBar[];
}

export type IndicatorType = 'sma' | 'ema' | 'bb' | 'rsi' | 'macd' | 'atr';

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  name: string;
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  stdDev?: number;
  color?: string;
}

export type DrawingToolType =
  | 'trendline'
  | 'ray'
  | 'horizontal-line'
  | 'vertical-line'
  | 'fibonacci'
  | 'rectangle'
  | 'label'
  | null;

export interface DrawingAnnotation {
  id: string;
  type: string;
  options: Record<string, unknown>;
  createdAt: number;
}
