import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';

/**
 * Custom hook for consuming market stock data.
 * - Loads stocks on mount
 * - Refreshes every 20 seconds with DB + live quote merge
 * - Exposes stocks, loading state, error, and a manual refresh trigger
 */
export function useStocks() {
  const stocks = useMarketStore((state) => state.stocks);
  const isLoading = useMarketStore((state) => state.isLoading);
  const error = useMarketStore((state) => state.error);
  const loadStocks = useMarketStore((state) => state.loadStocks);
  const refreshStocks = useMarketStore((state) => state.refreshStocks);

  useEffect(() => {
    void loadStocks();

    const interval = setInterval(() => {
      console.debug('[useStocks] Background refresh triggered');
      void loadStocks();
    }, 20_000);

    return () => clearInterval(interval);
  }, [loadStocks]);

  return {
    stocks,
    isLoading,
    error,
    refreshStocks,
  };
}
