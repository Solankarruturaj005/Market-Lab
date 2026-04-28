import { Bot, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ChatbotPanel } from './components/ChatbotPanel';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useTheme } from './hooks/useTheme';
import Alerts from './pages/Alerts';
import Dashboard from './pages/Dashboard';
import StockDetails from './pages/StockDetails';
import Watchlist from './pages/Watchlist';
import Auth from './pages/Auth';
import VerifyOtp from './pages/VerifyOtp';
import { useAuthStore } from './store/authStore';
import { useUiStore } from './store/uiStore';
import { useWatchlistStore } from './store/watchlistStore';

function ProtectedLayout() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 text-slate-100 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 md:grid-cols-[auto_1fr]">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <div className="space-y-4">
          <Navbar />
          <main className="rounded-[32px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl md:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {chatbotOpen ? (
        <div className="fixed bottom-24 right-4 z-[80] w-[calc(100vw-2rem)] max-w-md md:right-8">
          <ChatbotPanel onClose={() => setChatbotOpen(false)} />
        </div>
      ) : null}

      <button
        type="button"
        aria-label={chatbotOpen ? 'Close MarketBot chat' : 'Open MarketBot chat'}
        onClick={() => setChatbotOpen((open) => !open)}
        className="fixed bottom-6 right-4 z-[90] inline-flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300 text-slate-950 shadow-2xl shadow-cyan-950/40 transition duration-300 hover:-translate-y-1 hover:bg-cyan-200 hover:shadow-cyan-500/25 active:scale-95 md:right-8"
      >
        {chatbotOpen ? <X size={22} /> : <Bot size={22} />}
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
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/auth'} replace />} />
    </Routes>
  );
}

export default App;
