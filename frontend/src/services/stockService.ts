import api from './api';
import type { Stock, StockPrediction } from '../types/stock';
import { normalizeHistory, withHistory } from '../utils/stock';

function normalizeStockPayload(stock: Stock): Stock {
  const price = Number(stock.price);
  const change = Number(stock.change);

  return withHistory({
    ...stock,
    price: Number.isFinite(price) && price > 0 ? price : null,
    change: Number.isFinite(change) ? change : null,
    history: normalizeHistory(stock.history, Number.isFinite(price) && price > 0 ? price : null),
  });
}

function normalizePredictionPayload(prediction: StockPrediction): StockPrediction {
  return {
    ...prediction,
    prediction: prediction.prediction?.toUpperCase?.() ?? prediction.prediction,
    indicators: {
      sma20: prediction.indicators?.sma20 ?? null,
      ema20: prediction.indicators?.ema20 ?? null,
      rsi14: prediction.indicators?.rsi14 ?? null,
      macdHistogram: prediction.indicators?.macdHistogram ?? null,
    },
  };
}

export async function fetchStocks() {
  const { data } = await api.get<Stock[]>('/stocks');
  const normalized = data.map(normalizeStockPayload);
  console.debug('[stockService] fetched stocks', normalized);
  return normalized;
}

export async function fetchStockBySymbol(symbol: string) {
  const { data } = await api.get<Stock>(`/stocks/${symbol}`);
  const normalized = normalizeStockPayload(data);
  console.debug(`[stockService] fetched stock ${symbol}`, normalized);
  return normalized;
}

export async function fetchPrediction(symbol: string) {
  const { data } = await api.get<StockPrediction>(`/prediction/${symbol}`);
  const normalized = normalizePredictionPayload(data);
  console.debug(`[stockService] fetched prediction ${symbol}`, normalized);
  return normalized;
}
