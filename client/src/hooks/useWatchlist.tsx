import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '@client/src/api/stock';
import { logger } from '@lark-apaas/client-toolkit/logger';

const STORAGE_KEY = 'stocklab_watchlist';

interface WatchlistItem {
  code: string;
  name: string;
}

interface WatchlistContextValue {
  items: WatchlistItem[];
  loading: boolean;
  isWatched: (code: string) => boolean;
  add: (code: string, name: string) => Promise<boolean>;
  remove: (code: string) => Promise<void>;
  toggle: (code: string, name: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function loadFromStorage(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: any) =>
        item && typeof item.code === 'string' && typeof item.name === 'string',
    );
  } catch {
    return [];
  }
}

function saveToStorage(items: WatchlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const favs = await getFavorites();
      setItems(
        favs.map((f) => ({ code: f.stockCode, name: f.stockName })),
      );
    } catch (error) {
      logger.error('fetchFavorites error', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setItems(loadFromStorage());
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, authLoading, fetchFavorites]);

  useEffect(() => {
    if (!isAuthenticated) {
      saveToStorage(items);
    }
  }, [items, isAuthenticated]);

  const isWatched = useCallback(
    (code: string) => items.some((item) => item.code === code),
    [items],
  );

  const add = useCallback(
    async (code: string, name: string): Promise<boolean> => {
      if (!isAuthenticated) {
        toast.info('请先登录后再添加自选', {
          action: {
            label: '去登录',
            onClick: () => navigate('/login'),
          },
        });
        return false;
      }
      if (isWatched(code)) return true;
      try {
        await addFavorite({ stockCode: code, stockName: name });
        setItems((prev) => [...prev, { code, name }]);
        toast.success(`已添加 ${name} 到自选`);
        return true;
      } catch (error: any) {
        const msg = error?.response?.data?.message || '添加失败';
        toast.error(msg);
        return false;
      }
    },
    [isAuthenticated, isWatched, navigate],
  );

  const remove = useCallback(
    async (code: string): Promise<void> => {
      if (!isAuthenticated) {
        setItems((prev) => prev.filter((item) => item.code !== code));
        return;
      }
      try {
        await removeFavorite(code);
        setItems((prev) => prev.filter((item) => item.code !== code));
      } catch (error: any) {
        const msg = error?.response?.data?.message || '移除失败';
        toast.error(msg);
      }
    },
    [isAuthenticated],
  );

  const toggle = useCallback(
    async (code: string, name: string): Promise<boolean> => {
      if (isWatched(code)) {
        await remove(code);
        return false;
      } else {
        return add(code, name);
      }
    },
    [isWatched, add, remove],
  );

  const refresh = useCallback(async () => {
    if (isAuthenticated) {
      await fetchFavorites();
    }
  }, [isAuthenticated, fetchFavorites]);

  return (
    <WatchlistContext.Provider
      value={{ items, loading, isWatched, add, remove, toggle, refresh }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return ctx;
}
