import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';
type SortOption = 'market-cap' | 'price-desc' | 'price-asc' | 'change-desc' | 'change-asc';

interface UiState {
  sidebarOpen: boolean;
  theme: ThemeMode;
  searchQuery: string;
  sortBy: SortOption;
  showOnlyGainers: boolean;
  showOnlyLosers: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (value: SortOption) => void;
  toggleGainersFilter: () => void;
  toggleLosersFilter: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      theme: 'dark',
      searchQuery: '',
      sortBy: 'change-desc',
      showOnlyGainers: false,
      showOnlyLosers: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortBy: (sortBy) => set({ sortBy }),
      // Toggling gainers clears losers, and vice versa — mutually exclusive filters
      toggleGainersFilter: () =>
        set((state) => ({
          showOnlyGainers: !state.showOnlyGainers,
          showOnlyLosers: false,
        })),
      toggleLosersFilter: () =>
        set((state) => ({
          showOnlyLosers: !state.showOnlyLosers,
          showOnlyGainers: false,
        })),
    }),
    {
      name: 'stock-dashboard-ui',
      // Only persist theme — don't persist transient filter states
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
