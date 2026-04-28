export function calculateEMA(data: number[], period: number): number[] {
  const ema = [];
  const multiplier = 2 / (period + 1);
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[i]); // Start with the first data point
      continue;
    }
    const prevEma = ema[i - 1];
    const currentEma = (data[i] - prevEma) * multiplier + prevEma;
    ema.push(currentEma);
  }
  return ema;
}
