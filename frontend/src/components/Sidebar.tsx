import {
  BellRing,
  Info,
  LayoutDashboard,
  LineChart,
  LogOut,
  Star,
  X,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/alerts', label: 'Alerts', icon: BellRing },
  { to: '/about', label: 'About', icon: Info },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/auth');
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#334155] bg-[#0F172A] p-5 transition-transform duration-200 md:static md:w-64 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between border-b border-[#334155] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#334155] bg-[#1E293B] text-white">
              <LineChart size={18} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">Market Lab</div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                Analytics Platform
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[#94A3B8] hover:text-white hover:bg-[#1E293B] md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 flex-1 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
            Navigation
          </div>
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border border-[#334155] bg-[#1E293B] text-white'
                    : 'text-[#94A3B8] hover:bg-[#1E293B]/60 hover:text-white',
                )
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Account Controls & Logout */}
        <div className="border-t border-[#334155] pt-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#334155]/60 bg-[#1E293B]/40 p-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#334155] bg-[#0F172A] text-xs font-semibold text-white">
                {(user?.name ?? user?.email ?? 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 truncate">
                <div className="truncate text-xs font-semibold text-white">
                  {user?.name ?? 'Analyst'}
                </div>
                <div className="truncate text-[11px] text-[#94A3B8]">
                  {user?.email ?? 'analyst@marketlab.ai'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-shrink-0 rounded p-1.5 text-[#94A3B8] hover:bg-[#334155] hover:text-white transition"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
