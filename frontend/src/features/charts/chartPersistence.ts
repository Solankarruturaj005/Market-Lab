import type { DrawingAnnotation } from './chartTypes';

const STORAGE_PREFIX = 'marketlab_v1_drawings';

/**
 * Generates a strictly namespaced key per user ID and stock symbol.
 */
function getStorageKey(userId: number | string | null | undefined, symbol: string): string {
  const safeUser = userId ? String(userId) : 'guest';
  const safeSymbol = symbol.trim().toUpperCase();
  return `${STORAGE_PREFIX}_${safeUser}_${safeSymbol}`;
}

export function saveAnnotations(
  userId: number | string | null | undefined,
  symbol: string,
  annotations: DrawingAnnotation[],
): boolean {
  try {
    const key = getStorageKey(userId, symbol);
    localStorage.setItem(key, JSON.stringify(annotations));
    return true;
  } catch (err) {
    console.warn('[chartPersistence] Failed to persist drawings to localStorage', err);
    return false;
  }
}

export function loadAnnotations(
  userId: number | string | null | undefined,
  symbol: string,
): DrawingAnnotation[] {
  try {
    const key = getStorageKey(userId, symbol);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[chartPersistence] Failed to load drawings from localStorage', err);
    return [];
  }
}

export function clearAnnotations(
  userId: number | string | null | undefined,
  symbol: string,
): void {
  try {
    const key = getStorageKey(userId, symbol);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[chartPersistence] Failed to clear drawings from localStorage', err);
  }
}
