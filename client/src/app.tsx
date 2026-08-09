import { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './api/interceptor';

import MobileLayout from './components/MobileLayout';
import NotFound from './pages/NotFound/NotFound';
import MarketPage from './pages/Market/MarketPage';
import WatchlistPage from './pages/Watchlist/WatchlistPage';
import TradePage from './pages/Trade/TradePage';
import ProfilePage from './pages/Profile/ProfilePage';
import StockDetailPage from './pages/StockDetail/StockDetailPage';
import SearchPage from './pages/Search/SearchPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import { WatchlistProvider } from './hooks/useWatchlist';
import { AuthProvider } from './hooks/useAuth';
import { TradingProvider } from './hooks/useTrading';
import { ProtectedRoute } from './hooks/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const RoutesComponent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      navigate('/login', { state: { from: detail?.from || '/' }, replace: true });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WatchlistProvider>
          <TradingProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/stock/:code" element={<StockDetailPage />} />
              <Route element={<MobileLayout />}>
                <Route index element={<MarketPage />} />
                <Route path="watchlist" element={<WatchlistPage />} />
                <Route path="trade" element={<TradePage />} />
                <Route path="search" element={<SearchPage />} />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TradingProvider>
        </WatchlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default RoutesComponent;
