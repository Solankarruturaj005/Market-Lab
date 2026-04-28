export type TradeSignal = 'BUY' | 'SELL' | 'HOLD';

export interface HistoryPoint {
  date: string;
  close: number;
}

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  volume: number;
  isFallback?: boolean;
  source?: 'live' | 'cache' | 'database' | 'fallback';
  history?: HistoryPoint[];
}

export interface StockPrediction {
  symbol: string;
  prediction: TradeSignal | string;
  confidence: number;
  indicators: {
    sma20?: number | null;
    ema20?: number | null;
    rsi14?: number | null;
    macdHistogram?: number | null;
  };
}

export interface WatchlistItem {
  id: number;
  stockId: number;
  stock: Stock;
}

export interface AlertItem {
  id: number;
  stockId: number;
  targetPrice: number;
  triggerType: 'ABOVE' | 'BELOW';
  isActive: boolean;
  stock: Stock;
}
