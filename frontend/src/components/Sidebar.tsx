import { BellRing, ChartCandlestick, LayoutDashboard, Star, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../utils/cn';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/alerts', label: 'Alerts', icon: BellRing },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/70 transition md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-white/10 bg-slate-950/95 px-6 py-6 shadow-2xl shadow-slate-950/50 backdrop-blur-xl transition-transform md:static md:w-72 md:translate-x-0 md:bg-white/5',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
              <ChartCandlestick size={22} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-500">Stocks Analysis</div>
              <div className="text-lg font-Serif text-white">Market Lab</div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 text-slate-300 md:hidden"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <nav className="mt-10 space-y-3">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="card mt-auto p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/75">Daily Insight</div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Use the watchlist to track your core symbols and open stock details for technical
            indicators and signal trends.
          </p>
        </div>
      </aside>
    </>
  );
}
