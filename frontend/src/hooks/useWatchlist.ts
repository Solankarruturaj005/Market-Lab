import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWatchlistStore } from '../store/watchlistStore';

export function useWatchlist() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const items = useWatchlistStore((state) => state.items);
  const isLoading = useWatchlistStore((state) => state.isLoading);
  const error = useWatchlistStore((state) => state.error);
  const hasLoaded = useWatchlistStore((state) => state.hasLoaded);
  const loadWatchlist = useWatchlistStore((state) => state.loadWatchlist);
  const addStock = useWatchlistStore((state) => state.addStock);
  const removeStock = useWatchlistStore((state) => state.removeStock);
  const isInWatchlist = useWatchlistStore((state) => state.isInWatchlist);
  const isStockPending = useWatchlistStore((state) => state.isStockPending);

  useEffect(() => {
    if (isAuthenticated && !hasLoaded && !isLoading) {
      void loadWatchlist();
    }
  }, [hasLoaded, isAuthenticated, isLoading, loadWatchlist]);

  return {
    items,
    isLoading,
    error,
    loadWatchlist,
    addStock,
    removeStock,
    isInWatchlist,
    isStockPending,
  };
}
