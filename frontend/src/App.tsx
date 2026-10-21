import { Bot, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ChatbotPanel } from './components/ChatbotPanel';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useTheme } from './hooks/useTheme';
import About from './pages/About';
import Alerts from './pages/Alerts';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import StockDetails from './pages/StockDetails';
import VerifyOtp from './pages/VerifyOtp';
import Watchlist from './pages/Watchlist';
import { useAuthStore } from './store/authStore';
import { useUiStore } from './store/uiStore';
import { useWatchlistStore } from './store/watchlistStore';

function ProtectedLayout() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);

  return (
    <div className="min-h-screen bg-[#1E293B] text-white flex">
      {/* Sidebar navigation */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating MarketBot Assistant Drawer */}
      {chatbotOpen ? (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md sm:right-6">
          <ChatbotPanel onClose={() => setChatbotOpen(false)} />
        </div>
      ) : null}

      {/* Floating Action Button */}
      <button
        type="button"
        aria-label={chatbotOpen ? 'Close MarketBot intelligence' : 'Open MarketBot intelligence'}
        onClick={() => setChatbotOpen((open) => !open)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#334155] bg-[#0F172A] text-white shadow-xl hover:bg-[#1E293B] hover:border-slate-500 active:scale-95 transition-all"
      >
        {chatbotOpen ? <X size={20} /> : <Bot size={20} />}
      </button>
    </div>
  );
}

function App() {
  useTheme();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearWatchlist = useWatchlistStore((state) => state.clear);

  useEffect(() => {
    if (!isAuthenticated) {
      clearWatchlist();
    }
  }, [clearWatchlist, isAuthenticated]);

  return (
    <Routes>
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />} />
      <Route
        path="/auth/verify-otp"
        element={isAuthenticated ? <Navigate to="/" replace /> : <VerifyOtp />}
      />
      <Route
        element={isAuthenticated ? <ProtectedLayout /> : <Navigate to="/auth" replace />}
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock/:symbol" element={<StockDetails />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
    </Routes>
  );
}

export default App;
