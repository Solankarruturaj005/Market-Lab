import { Injectable } from '@nestjs/common';
import { calculateSMA } from './strategies/sma';
import { calculateEMA } from './strategies/ema';
import { calculateRSI } from './strategies/rsi';
import { calculateMACD } from './strategies/macd';

@Injectable()
export class IndicatorService {
  analyzeStock(history: any[]) {
    if (!history || history.length < 30) {
       return { signal: 'HOLD', confidence: 50, indicators: {} };
    }

    // Extract close prices (assuming history is sorted chronological)
    const closes = history.map(item => Number(item.close));

    const sma20 = calculateSMA(closes, 20);
    const ema20 = calculateEMA(closes, 20);
    const rsi14 = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);

    const currentPrice = closes[closes.length - 1];
    const currentSMA = sma20[sma20.length - 1];
    const currentRSI = rsi14[rsi14.length - 1];
    const currentMACDHistogram = macd.histogram[macd.histogram.length - 1];

    let buyScore = 0;
    let sellScore = 0;

    // RSI Logic
    if (currentRSI < 30) buyScore += 2; // Oversold
    else if (currentRSI > 70) sellScore += 2; // Overbought

    // Price vs SMA
    if (currentPrice > currentSMA) buyScore += 1; // Uptrend
    else if (currentPrice < currentSMA) sellScore += 1; // Downtrend

    // MACD logic
    if (currentMACDHistogram > 0) buyScore += 1;
    else if (currentMACDHistogram < 0) sellScore += 1;

    let signal = 'HOLD';
    let confidence = 50;

    if (buyScore > sellScore && buyScore >= 2) {
      signal = 'BUY';
      confidence = 60 + (buyScore * 10);
    } else if (sellScore > buyScore && sellScore >= 2) {
      signal = 'SELL';
      confidence = 60 + (sellScore * 10);
    }

    return {
      signal,
      confidence: Math.min(confidence, 100),
      indicators: {
        sma20: currentSMA,
        ema20: ema20[ema20.length - 1],
        rsi14: currentRSI,
        macdHistogram: currentMACDHistogram,
      }
    };
  }
}
