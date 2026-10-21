import test from 'node:test';
import assert from 'node:assert';

import { validateAndSanitizeOhlcv } from '../validateOhlcv.ts';
import { filterBarsByTimeframe } from '../stockHistoryAdapter.ts';
import { clearAnnotations, loadAnnotations, saveAnnotations } from '../chartPersistence.ts';
import { computeMACD, computeRSI, computeSMA } from '../../../utils/technicals.ts';

// -------------------------------------------------------------
// 1. OHLCV Validation & Sanitization Tests
// -------------------------------------------------------------
test('validateAndSanitizeOhlcv: correctly sorts unsorted timestamps in ascending order', () => {
  const unsorted = [
    { timestamp: 1700000000000 + 86400000 * 2, open: 150, high: 155, low: 149, close: 152, volume: 1000 },
    { timestamp: 1700000000000, open: 140, high: 145, low: 139, close: 142, volume: 2000 },
    { timestamp: 1700000000000 + 86400000, open: 145, high: 150, low: 144, close: 149, volume: 1500 },
  ];

  const result = validateAndSanitizeOhlcv(unsorted);
  assert.strictEqual(result.validBars.length, 3);
  assert.strictEqual(result.validBars[0].timestamp, 1700000000000);
  assert.strictEqual(result.validBars[1].timestamp, 1700000000000 + 86400000);
  assert.strictEqual(result.validBars[2].timestamp, 1700000000000 + 86400000 * 2);
  assert.strictEqual(result.rejectedCount, 0);
});

test('validateAndSanitizeOhlcv: deduplicates identical timestamps deterministically', () => {
  const withDuplicates = [
    { timestamp: 1700000000000, open: 140, high: 145, low: 139, close: 142, volume: 1000 },
    { timestamp: 1700000000000, open: 141, high: 146, low: 140, close: 143, volume: 2000 }, // duplicate
    { timestamp: 1700000000000 + 86400000, open: 143, high: 148, low: 142, close: 147, volume: 1500 },
  ];

  const result = validateAndSanitizeOhlcv(withDuplicates);
  assert.strictEqual(result.validBars.length, 2);
  // Keeps the latest deterministic entry
  assert.strictEqual(result.validBars[0].close, 143);
  assert.strictEqual(result.validBars[1].close, 147);
});

test('validateAndSanitizeOhlcv: rejects NaN, infinite, negative, or zero price entries', () => {
  const invalidRows = [
    { timestamp: 1700000000000, open: NaN, high: 150, low: 140, close: 145, volume: 1000 },
    { timestamp: 1700000001000, open: 140, high: Infinity, low: 140, close: 145, volume: 1000 },
    { timestamp: 1700000002000, open: 140, high: 150, low: -10, close: 145, volume: 1000 },
    { timestamp: 1700000003000, open: 0, high: 150, low: 0, close: 145, volume: 1000 },
    { timestamp: 1700000004000, open: 100, high: 105, low: 95, close: 102, volume: 500 }, // valid
  ];

  const result = validateAndSanitizeOhlcv(invalidRows);
  assert.strictEqual(result.validBars.length, 1);
  assert.strictEqual(result.rejectedCount, 4);
  assert.strictEqual(result.validBars[0].timestamp, 1700000004000);
});

test('validateAndSanitizeOhlcv: enforces high >= max(open, close) and low <= min(open, close)', () => {
  const boundaryViolations = [
    // high is lower than open
    { timestamp: 1700000000000, open: 150, high: 140, low: 130, close: 135, volume: 100 },
    // low is higher than close
    { timestamp: 1700000001000, open: 150, high: 160, low: 155, close: 152, volume: 100 },
    // high < low
    { timestamp: 1700000002000, open: 150, high: 140, low: 160, close: 145, volume: 100 },
  ];

  const result = validateAndSanitizeOhlcv(boundaryViolations);
  assert.strictEqual(result.validBars.length, 0);
  assert.strictEqual(result.rejectedCount, 3);
});

test('validateAndSanitizeOhlcv: empty history returns empty valid bars array', () => {
  const result = validateAndSanitizeOhlcv([]);
  assert.deepStrictEqual(result.validBars, []);
  assert.strictEqual(result.rejectedCount, 0);
  assert.deepStrictEqual(result.errors, []);
});

test('validateAndSanitizeOhlcv: preserves missing volume as null without synthesizing fake bars', () => {
  const withoutVolume = [
    { timestamp: 1700000000000, open: 100, high: 110, low: 95, close: 105, volume: null },
    { timestamp: 1700000001000, open: 105, high: 115, low: 100, close: 112 },
  ];

  const result = validateAndSanitizeOhlcv(withoutVolume);
  assert.strictEqual(result.validBars.length, 2);
  assert.strictEqual(result.validBars[0].volume, null);
  assert.strictEqual(result.validBars[1].volume, null);
});

// -------------------------------------------------------------
// 2. Timeframe Filtering Tests
// -------------------------------------------------------------
test('filterBarsByTimeframe: returns exact 5 latest bars for 5D range', () => {
  const bars = Array.from({ length: 30 }, (_, i) => ({
    timestamp: 1700000000000 + i * 86400000,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
    volume: 1000,
  }));

  const fiveDays = filterBarsByTimeframe(bars, '5D');
  assert.strictEqual(fiveDays.length, 5);
  assert.strictEqual(fiveDays[4].timestamp, bars[29].timestamp);
  assert.strictEqual(fiveDays[0].timestamp, bars[25].timestamp);
});

test('filterBarsByTimeframe: All returns the original bar set unchanged', () => {
  const bars = Array.from({ length: 15 }, (_, i) => ({
    timestamp: 1700000000000 + i * 86400000,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
    volume: 1000,
  }));

  const all = filterBarsByTimeframe(bars, 'All');
  assert.strictEqual(all.length, 15);
  assert.deepStrictEqual(all, bars);
});

// -------------------------------------------------------------
// 3. User & Symbol Namespaced Drawing Persistence Tests
// -------------------------------------------------------------
test('chartPersistence: saves and loads drawings namespaced by userId and symbol', () => {
  const mockStorage: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => {},
    length: 0,
    key: () => null,
  };

  const userId = 42;
  const symbol = 'AAPL';
  const annotations = [
    { id: 'h-1', type: 'horizontal-line', options: { y: 150 }, createdAt: 1700000000000 },
  ];

  // Save for user 42 on AAPL
  saveAnnotations(userId, symbol, annotations);

  // Load for user 42 on AAPL
  const loaded = loadAnnotations(userId, symbol);
  assert.strictEqual(loaded.length, 1);
  assert.strictEqual(loaded[0].id, 'h-1');

  // Verify symbol isolation: TSLA has no drawings
  const tslaLoaded = loadAnnotations(userId, 'TSLA');
  assert.strictEqual(tslaLoaded.length, 0);

  // Verify user isolation: User 99 has no drawings on AAPL
  const otherUserLoaded = loadAnnotations(99, symbol);
  assert.strictEqual(otherUserLoaded.length, 0);

  // Clear drawings
  clearAnnotations(userId, symbol);
  assert.strictEqual(loadAnnotations(userId, symbol).length, 0);
});

// -------------------------------------------------------------
// 4. Indicator Calculation Invariants Tests
// -------------------------------------------------------------
test('computeRSI: output strictly stays between 0 and 100 on valid fixture data', () => {
  const fixtureData = Array.from({ length: 60 }, (_, i) => ({
    date: new Date(1700000000000 + i * 86400000).toISOString(),
    close: 100 + Math.sin(i / 5) * 20 + (i % 3 === 0 ? 5 : -3),
  }));

  const rsi = computeRSI(fixtureData, 14);
  assert.strictEqual(rsi.length, 60);

  // First 14 should be null warm-up
  for (let i = 0; i < 14; i++) {
    assert.strictEqual(rsi[i], null);
  }

  // From index 14 onwards, must be bounded in [0, 100]
  for (let i = 14; i < rsi.length; i++) {
    const val = rsi[i];
    assert.ok(val !== null && typeof val === 'number');
    if (val !== null) {
      assert.ok(val >= 0 && val <= 100, `RSI at ${i} is ${val}, expected between 0 and 100`);
    }
  }
});

test('computeMACD: histogram strictly equals MACD line minus signal line', () => {
  const fixtureData = Array.from({ length: 60 }, (_, i) => ({
    date: new Date(1700000000000 + i * 86400000).toISOString(),
    close: 150 + i * 0.5 + (i % 2 === 0 ? 2 : -2),
  }));

  const { macdLine, signalLine, histogram } = computeMACD(fixtureData, 12, 26, 9);
  assert.strictEqual(macdLine.length, 60);
  assert.strictEqual(signalLine.length, 60);
  assert.strictEqual(histogram.length, 60);

  for (let i = 0; i < 60; i++) {
    const m = macdLine[i];
    const s = signalLine[i];
    const h = histogram[i];

    if (m !== null && s !== null) {
      assert.ok(h !== null);
      const expectedDiff = Number((m - s).toFixed(3));
      assert.strictEqual(h, expectedDiff, `At index ${i}: histogram ${h} != macd ${m} - signal ${s}`);
    } else {
      assert.strictEqual(h, null);
    }
  }
});

test('computeSMA: properly calculates simple moving average with exact period warm-up', () => {
  const fixture = [
    { date: '2026-01-01', close: 10 },
    { date: '2026-01-02', close: 20 },
    { date: '2026-01-03', close: 30 },
    { date: '2026-01-04', close: 40 },
    { date: '2026-01-05', close: 50 },
  ];

  const sma3 = computeSMA(fixture, 3);
  assert.strictEqual(sma3[0], null);
  assert.strictEqual(sma3[1], null);
  assert.strictEqual(sma3[2], 20); // (10+20+30)/3 = 20
  assert.strictEqual(sma3[3], 30); // (20+30+40)/3 = 30
  assert.strictEqual(sma3[4], 40); // (30+40+50)/3 = 40
});
