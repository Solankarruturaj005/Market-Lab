import { Menu, MoonStar, Search, SunMedium } from 'lucide-react';
import { startTransition, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setSearchQuery = useUiStore((state) => state.setSearchQuery);
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebouncedValue(localSearch, 220);

  useEffect(() => {
    startTransition(() => {
      setSearchQuery(debouncedSearch);
    });
  }, [debouncedSearch, setSearchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 px-4 py-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl md:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 md:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="search-field">
        <Search size={18} className="text-slate-400" />
        <input
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          className="search-input"
          placeholder="Search stocks, sectors, or symbols"
        />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:bg-white/10"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
      </button>

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-sm font-bold text-slate-950">
          {(user?.name ?? user?.email ?? 'U').slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden min-w-[120px] sm:block">
          <div className="text-sm font-semibold text-white">{user?.name ?? 'Analyst'}</div>
          <div className="text-xs text-slate-400">{user?.email ?? 'demo@marketlab.ai'}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
