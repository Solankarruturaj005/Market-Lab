import { create } from 'zustand';
import type { Stock, WatchlistItem } from '../types/stock';
import {
  addToWatchlist,
  fetchWatchlist,
  removeFromWatchlist,
} from '../services/watchlistService';
import { useAuthStore } from './authStore';
import { withHistory } from '../utils/stock';

interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  pendingStockIds: number[];
  loadWatchlist: (force?: boolean) => Promise<void>;
  addStock: (stock: Stock) => Promise<void>;
  removeStock: (identifier: number) => Promise<void>;
  isInWatchlist: (stockId: number) => boolean;
  isStockPending: (stockId: number) => boolean;
  clear: () => void;
}

const WATCHLIST_CACHE_KEY = 'stock-dashboard-watchlist-cache';

function normalizeWatchlistItem(item: WatchlistItem): WatchlistItem {
  return {
    ...item,
    stock: withHistory(item.stock),
  };
}

function readCachedWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_CACHE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as WatchlistItem[];
    return parsed.map(normalizeWatchlistItem);
  } catch {
    return [];
  }
}

function writeCachedWatchlist(items: WatchlistItem[]) {
  localStorage.setItem(WATCHLIST_CACHE_KEY, JSON.stringify(items));
}

function addPendingId(ids: number[], stockId: number) {
  return ids.includes(stockId) ? ids : [...ids, stockId];
}

function removePendingId(ids: number[], stockId: number) {
  return ids.filter((id) => id !== stockId);
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
  pendingStockIds: [],
  loadWatchlist: async (force = false) => {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      set({
        items: [],
        isLoading: false,
        error: null,
        hasLoaded: false,
        pendingStockIds: [],
      });
      return;
    }

    if (get().isLoading || (!force && get().hasLoaded)) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const items = (await fetchWatchlist()).map(normalizeWatchlistItem);
      console.debug('[WatchlistStore] Loaded watchlist into cache', items);
      writeCachedWatchlist(items);
      set({ items, isLoading: false, error: null, hasLoaded: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load watchlist.';
      const cachedItems = readCachedWatchlist();

      console.error('[WatchlistStore] Failed to load watchlist', error);
      set({
        items: cachedItems,
        isLoading: false,
        error:
          cachedItems.length > 0
            ? `${message} Showing your last saved watchlist snapshot.`
            : message,
        hasLoaded: cachedItems.length > 0,
      });
    }
  },
  addStock: async (stock) => {
    if (get().isInWatchlist(stock.id) || get().isStockPending(stock.id)) {
      return;
    }

    const optimisticItem: WatchlistItem = {
      id: -Date.now(),
      stockId: stock.id,
      stock,
    };

    set((state) => ({
      items: [optimisticItem, ...state.items],
      error: null,
      hasLoaded: true,
      pendingStockIds: addPendingId(state.pendingStockIds, stock.id),
    }));
    writeCachedWatchlist(get().items);

    try {
      const created = normalizeWatchlistItem(await addToWatchlist(stock.id));
      set((state) => ({
        items: state.items.map((item) => (item.id === optimisticItem.id ? created : item)),
        pendingStockIds: removePendingId(state.pendingStockIds, stock.id),
      }));
      writeCachedWatchlist(get().items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update your watchlist.';

      console.error('[WatchlistStore] Failed to add stock', error);
      set((state) => ({
        items: state.items.filter((item) => item.id !== optimisticItem.id),
        error: message,
        pendingStockIds: removePendingId(state.pendingStockIds, stock.id),
      }));
      writeCachedWatchlist(get().items);
      throw error;
    }
  },
  removeStock: async (identifier) => {
    const target = get().items.find((item) => item.id === identifier || item.stockId === identifier);

    if (!target || get().isStockPending(target.stockId)) {
      return;
    }

    set((state) => ({
      items: state.items.filter((item) => item.id !== target.id),
      error: null,
      pendingStockIds: addPendingId(state.pendingStockIds, target.stockId),
    }));
    writeCachedWatchlist(get().items);

    try {
      await removeFromWatchlist(target.id);
      set((state) => ({
        pendingStockIds: removePendingId(state.pendingStockIds, target.stockId),
      }));
      writeCachedWatchlist(get().items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update your watchlist.';

      console.error('[WatchlistStore] Failed to remove stock', error);
      set((state) => ({
        items: [target, ...state.items],
        error: message,
        pendingStockIds: removePendingId(state.pendingStockIds, target.stockId),
      }));
      writeCachedWatchlist(get().items);
      throw error;
    }
  },
  isInWatchlist: (stockId) => get().items.some((item) => item.stockId === stockId),
  isStockPending: (stockId) => get().pendingStockIds.includes(stockId),
  clear: () =>
    {
      localStorage.removeItem(WATCHLIST_CACHE_KEY);
      set({
        items: [],
        isLoading: false,
        error: null,
        hasLoaded: false,
        pendingStockIds: [],
      });
    },
}));
