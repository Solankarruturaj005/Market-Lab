import type { OhlcvBar } from './chartTypes';

export interface ValidationResult {
  validBars: OhlcvBar[];
  rejectedCount: number;
  errors: string[];
}

/**
 * Validates, sanitizes, sorts ascending, and deduplicates raw OHLCV bars.
 * Enforces strict financial charting invariants:
 * - finite positive prices
 * - high >= max(open, close)
 * - low <= min(open, close)
 * - high >= low
 * - volume >= 0 or null
 */
export function validateAndSanitizeOhlcv(rawBars: unknown[]): ValidationResult {
  if (!Array.isArray(rawBars) || rawBars.length === 0) {
    return { validBars: [], rejectedCount: 0, errors: [] };
  }

  const validBars: OhlcvBar[] = [];
  const errors: string[] = [];
  let rejectedCount = 0;

  for (let i = 0; i < rawBars.length; i++) {
    const raw = rawBars[i] as any;
    if (!raw || typeof raw !== 'object') {
      rejectedCount++;
      continue;
    }

    // Timestamp parsing
    let ts = Number(raw.timestamp);
    if (!Number.isFinite(ts) || ts <= 0) {
      if (raw.date) {
        const parsed = new Date(raw.date).getTime();
        if (Number.isFinite(parsed) && parsed > 0) {
          ts = parsed;
        }
      }
    }

    if (!Number.isFinite(ts) || ts <= 0) {
      rejectedCount++;
      errors.push(`Row ${i}: Invalid timestamp ${raw.timestamp ?? raw.date}`);
      continue;
    }

    // Price parsing
    const open = Number(raw.open);
    const high = Number(raw.high);
    const low = Number(raw.low);
    const close = Number(raw.close);

    if (
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close) ||
      open <= 0 ||
      high <= 0 ||
      low <= 0 ||
      close <= 0
    ) {
      rejectedCount++;
      errors.push(`Row ${i} (${ts}): Non-finite or non-positive price detected`);
      continue;
    }

    // Financial boundary checks
    if (high < low) {
      rejectedCount++;
      errors.push(`Row ${i} (${ts}): Invariant violation (high ${high} < low ${low})`);
      continue;
    }

    const maxOC = Math.max(open, close);
    const minOC = Math.min(open, close);

    if (high < maxOC - 0.0001 || low > minOC + 0.0001) {
      rejectedCount++;
      errors.push(`Row ${i} (${ts}): High/Low outside Open/Close boundary`);
      continue;
    }

    // Volume validation
    let volume: number | null = null;
    if (raw.volume !== undefined && raw.volume !== null) {
      const parsedVol = Number(raw.volume);
      if (Number.isFinite(parsedVol) && parsedVol >= 0) {
        volume = parsedVol;
      }
    }

    validBars.push({
      timestamp: ts,
      open,
      high: Math.max(high, maxOC),
      low: Math.min(low, minOC),
      close,
      volume,
    });
  }

  // Sort ascending by timestamp
  validBars.sort((a, b) => a.timestamp - b.timestamp);

  // Deduplicate timestamps deterministically by keeping the latest record
  const deduplicated: OhlcvBar[] = [];
  const seenTimestamps = new Map<number, OhlcvBar>();

  for (const bar of validBars) {
    seenTimestamps.set(bar.timestamp, bar);
  }

  for (const bar of seenTimestamps.values()) {
    deduplicated.push(bar);
  }

  deduplicated.sort((a, b) => a.timestamp - b.timestamp);

  return {
    validBars: deduplicated,
    rejectedCount,
    errors,
  };
}
