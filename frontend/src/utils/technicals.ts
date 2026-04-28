import type { HistoryPoint, Stock, StockPrediction, TradeSignal } from '../types/stock';
import { withHistory } from './stock';

export type NumericSeries = Array<number | null>;

export interface TechnicalChartPoint extends HistoryPoint {
  sma: number | null;
  ema: number | null;
  rsi: number | null;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
  normalizedClose: number;
  formattedDate: string;
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function getSafeDateLabel(rawDate: string) {
  const parsed = new Date(rawDate);

  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getCloses(history: HistoryPoint[]) {
  return history.map((point) => Number(point.close));
}

function getLatestValue(series: NumericSeries) {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const value = series[index];

    if (value != null && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function computeEMAFromValues(values: number[], window: number): NumericSeries {
  if (values.length === 0 || window <= 0) {
    return [];
  }

  const result: NumericSeries = Array.from({ length: values.length }, () => null);

  if (values.length < window) {
    return result;
  }

  const seed = values.slice(0, window).reduce((sum, value) => sum + value, 0) / window;
  const multiplier = 2 / (window + 1);
  let previous = seed;

  result[window - 1] = round(seed);

  for (let index = window; index < values.length; index += 1) {
    previous = (values[index] - previous) * multiplier + previous;
    result[index] = round(previous);
  }

  return result;
}

export function computeSMA(data: HistoryPoint[], window: number): NumericSeries {
  if (!data || data.length === 0 || window <= 0) {
    return [];
  }

  return data.map((_, index) => {
    if (index < window - 1) {
      return null;
    }

    const slice = data.slice(index - window + 1, index + 1);
    const sum = slice.reduce((accumulator, point) => accumulator + point.close, 0);
    return round(sum / window);
  });
}

export function computeEMA(data: HistoryPoint[], window: number): NumericSeries {
  return computeEMAFromValues(getCloses(data), window);
}

export function computeRSI(data: HistoryPoint[], period = 14): NumericSeries {
  const closes = getCloses(data);

  if (closes.length === 0 || period <= 0) {
    return [];
  }

  const result: NumericSeries = Array.from({ length: closes.length }, () => null);

  if (closes.length <= period) {
    return result;
  }

  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = closes[index] - closes[index - 1];
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;
  result[period] = round(100 - 100 / (1 + averageGain / (averageLoss || 1)));

  for (let index = period + 1; index < closes.length; index += 1) {
    const change = closes[index] - closes[index - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;

    const relativeStrength = averageGain / (averageLoss || 1);
    result[index] = round(100 - 100 / (1 + relativeStrength));
  }

  return result;
}

export function computeMACD(
  data: HistoryPoint[],
  shortWindow = 12,
  longWindow = 26,
  signalWindow = 9,
) {
  const closes = getCloses(data);
  const shortEma = computeEMAFromValues(closes, shortWindow);
  const longEma = computeEMAFromValues(closes, longWindow);

  const macdLine: NumericSeries = closes.map((_, index) => {
    const shortValue = shortEma[index];
    const longValue = longEma[index];

    if (shortValue == null || longValue == null) {
      return null;
    }

    return round(shortValue - longValue, 3);
  });

  const validMacd = macdLine.filter((value): value is number => value != null);
  const alignedSignal = computeEMAFromValues(validMacd, signalWindow);
  const signalLine: NumericSeries = Array.from({ length: macdLine.length }, () => null);
  const histogram: NumericSeries = Array.from({ length: macdLine.length }, () => null);
  let signalCursor = 0;

  for (let index = 0; index < macdLine.length; index += 1) {
    const macdValue = macdLine[index];

    if (macdValue == null) {
      continue;
    }

    const signalValue = alignedSignal[signalCursor] ?? null;
    signalLine[index] = signalValue;

    if (signalValue != null) {
      histogram[index] = round(macdValue - signalValue, 3);
    }

    signalCursor += 1;
  }

  return { macdLine, signalLine, histogram };
}

export function calculateVolatility(history: HistoryPoint[], period = 14) {
  if (!history.length || history.length < 2) {
    return null;
  }

  const windowed = history.slice(-(period + 1));

  if (windowed.length < 2) {
    return null;
  }

  const returns = windowed.slice(1).map((point, index) => {
    const previous = windowed[index].close;
    return ((point.close - previous) / previous) * 100;
  });

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;

  return round(Math.sqrt(variance));
}

export function calculatePriceRange(history: HistoryPoint[], period = 20) {
  if (!history.length) {
    return { support: null, resistance: null, rangePercent: null };
  }

  const windowed = history.slice(-period);
  const closes = windowed.map((point) => point.close);
  const support = Math.min(...closes);
  const resistance = Math.max(...closes);
  const latest = closes[closes.length - 1] || 1;

  return {
    support: round(support),
    resistance: round(resistance),
    rangePercent: round(((resistance - support) / latest) * 100),
  };
}

export function buildTechnicalChartData(history: HistoryPoint[], smaWindow = 20): TechnicalChartPoint[] {
  if (!history || history.length === 0) {
    return [];
  }

  const sma = computeSMA(history, smaWindow);
  const ema = computeEMA(history, smaWindow);
  const rsi = computeRSI(history);
  const { macdLine, signalLine, histogram } = computeMACD(history);
  const baseline = history[0]?.close || 1;

  return history.map((point, index) => ({
    ...point,
    sma: sma[index] ?? null,
    ema: ema[index] ?? null,
    rsi: rsi[index] ?? null,
    macd: macdLine[index] ?? null,
    signal: signalLine[index] ?? null,
    histogram: histogram[index] ?? null,
    normalizedClose: round((point.close / baseline) * 100),
    formattedDate: getSafeDateLabel(point.date),
  }));
}

export function derivePredictionFromHistory(
  symbol: string,
  history: HistoryPoint[],
): StockPrediction | null {
  if (!history.length) {
    return null;
  }

  const chartData = buildTechnicalChartData(history);
  const latest = chartData[chartData.length - 1];

  if (!latest) {
    return null;
  }

  let buyScore = 0;
  let sellScore = 0;

  if (latest.rsi != null) {
    if (latest.rsi < 30) {
      buyScore += 2;
    } else if (latest.rsi > 70) {
      sellScore += 2;
    }
  }

  if (latest.sma != null) {
    if (latest.close > latest.sma) {
      buyScore += 1;
    } else if (latest.close < latest.sma) {
      sellScore += 1;
    }
  }

  if (latest.histogram != null) {
    if (latest.histogram > 0) {
      buyScore += 1;
    } else if (latest.histogram < 0) {
      sellScore += 1;
    }
  }

  let prediction: TradeSignal = 'HOLD';
  let confidence = 55;

  if (buyScore > sellScore && buyScore >= 2) {
    prediction = 'BUY';
    confidence = Math.min(60 + buyScore * 10, 95);
  } else if (sellScore > buyScore && sellScore >= 2) {
    prediction = 'SELL';
    confidence = Math.min(60 + sellScore * 10, 95);
  }

  return {
    symbol,
    prediction,
    confidence,
    indicators: {
      sma20: latest.sma,
      ema20: latest.ema,
      rsi14: latest.rsi,
      macdHistogram: latest.histogram,
    },
  };
}

export function buildMarketIndexData(stocks: Stock[], points = 45) {
  const series = stocks
    .map((stock) => buildTechnicalChartData(withHistory(stock).history ?? []).slice(-points))
    .filter((history) => history.length > 0);

  if (series.length === 0) {
    return [];
  }

  const commonLength = Math.min(...series.map((history) => history.length));

  return Array.from({ length: commonLength }, (_, index) => {
    const alignedPoints = series.map((history) => history[history.length - commonLength + index]);
    const composite =
      alignedPoints.reduce((sum, point) => sum + point.normalizedClose, 0) / alignedPoints.length;

    return {
      date: alignedPoints[0].date,
      formattedDate: alignedPoints[0].formattedDate,
      index: round(composite),
    };
  });
}

export function getIndicatorSnapshot(stock: Stock) {
  const enrichedStock = withHistory(stock);
  const history = enrichedStock.history ?? [];
  const chartData = buildTechnicalChartData(history);
  const latest = chartData[chartData.length - 1] ?? null;
  const range = calculatePriceRange(history);
  const volatility = calculateVolatility(history);

  return {
    chartData,
    latest,
    range,
    volatility,
    derivedPrediction: derivePredictionFromHistory(stock.symbol, history),
    thirtyDayChange:
      history.length > 30
        ? round(
            ((history[history.length - 1].close - history[history.length - 31].close) /
              history[history.length - 31].close) *
              100,
          )
        : null,
    latestMacd: getLatestValue(chartData.map((point) => point.macd)),
    latestSignal: getLatestValue(chartData.map((point) => point.signal)),
  };
}
