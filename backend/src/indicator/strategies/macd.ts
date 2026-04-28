import { calculateEMA } from './ema';

export function calculateMACD(data: number[]): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push(ema12[i] - ema26[i]);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate signal line (9-day EMA of MACD)
  const validMacd = macdLine.filter(val => val !== null);
  const signalEma = calculateEMA(validMacd, 9);
  
  const signalLine = [];
  const histogram = [];
  let signalIdx = 0;

  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
      histogram.push(null);
    } else {
      const sig = signalEma[signalIdx++];
      signalLine.push(sig);
      histogram.push(macdLine[i] - sig);
    }
  }

  return { macdLine, signalLine, histogram };
}
