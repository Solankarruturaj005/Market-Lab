import { Menu, Search, X } from 'lucide-react';
import { startTransition, useEffect, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setSearchQuery = useUiStore((state) => state.setSearchQuery);
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebouncedValue(localSearch, 220);

  useEffect(() => {
    startTransition(() => {
      setSearchQuery(debouncedSearch);
    });
  }, [debouncedSearch, setSearchQuery]);

  const handleClear = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#334155] bg-[#0F172A] px-4 py-3 sm:px-6">
      {/* Mobile Hamburger */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="rounded-lg border border-[#334155] bg-[#1E293B] p-2 text-[#94A3B8] hover:text-white md:hidden"
        aria-label="Toggle navigation menu"
      >
        <Menu size={18} />
      </button>

      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 text-[#94A3B8]"
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search symbols or company names (e.g. AAPL, MSFT)..."
            className="w-full rounded-lg border border-[#334155] bg-[#1E293B] py-2 pl-9 pr-8 text-xs text-white placeholder-[#94A3B8] focus:border-[#F8FAFC] focus:outline-none transition-colors sm:text-sm"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 text-[#94A3B8] hover:text-white"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* User Status / Info */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-medium text-white">{user?.name ?? 'Analyst'}</span>
          <span className="text-[11px] text-[#94A3B8]">{user?.email ?? 'active session'}</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#334155] bg-[#1E293B] text-xs font-semibold text-white">
          {(user?.name ?? user?.email ?? 'A').slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
