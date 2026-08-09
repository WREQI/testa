import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, X, Trash2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { searchStocks } from '@client/src/api/stock';
import type { StockBasic } from '@shared/api.interface';

const HISTORY_KEY = 'stock_search_history';
const MAX_HISTORY = 10;

interface HistoryItem {
  code: string;
  name: string;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialKeyword =
    typeof location.state === 'object' &&
    location.state !== null &&
    'keyword' in location.state &&
    typeof (location.state as { keyword: string }).keyword === 'string'
      ? (location.state as { keyword: string }).keyword
      : '';

  const [keyword, setKeyword] = useState<string>(initialKeyword);
  const [results, setResults] = useState<StockBasic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载历史记录
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed: HistoryItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY));
        }
      }
    } catch (error) {
      logger.error('load search history error', error);
    }
  }, []);

  // 保存历史记录
  const saveHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch (error) {
      logger.error('save search history error', error);
    }
  }, []);

  // 添加到历史
  const addToHistory = useCallback(
    (item: HistoryItem) => {
      const filtered = history.filter(
        (h: HistoryItem) => h.code !== item.code,
      );
      const next = [item, ...filtered].slice(0, MAX_HISTORY);
      saveHistory(next);
    },
    [history, saveHistory],
  );

  // 清除历史
  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  // 防抖搜索
  useEffect(() => {
    if (keyword.length < 2) {
      setResults([]);
      setLoading(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setLoading(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchStocks(keyword, 20);
        setResults(res.items || []);
      } catch (error) {
        logger.error('search error', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [keyword]);

  const handleClear = () => {
    setKeyword('');
    inputRef.current?.focus();
  };

  const handleResultClick = (stock: StockBasic) => {
    addToHistory({ code: stock.code, name: stock.name });
    navigate(`/stock/${stock.code}`);
  };

  const handleHistoryClick = (item: HistoryItem) => {
    setKeyword(item.name);
    inputRef.current?.focus();
  };

  const getMarketLabel = (market?: string) => {
    if (!market) return '';
    const upper = market.toUpperCase();
    if (upper.includes('SH') || upper.includes('上海')) return 'SH';
    if (upper.includes('SZ') || upper.includes('深圳')) return 'SZ';
    return market.slice(0, 2).toUpperCase();
  };

  const showHistory = history.length > 0 && keyword.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部搜索栏 */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="size-8 flex items-center justify-center flex-shrink-0"
            aria-label="返回"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>

          <div className="bg-accent rounded-lg px-3 py-2 flex items-center gap-2 flex-1">
            <Search className="size-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索股票代码/名称"
              autoFocus
              className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {keyword.length > 0 && (
              <button
                onClick={handleClear}
                className="size-5 flex items-center justify-center flex-shrink-0"
                aria-label="清除"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 搜索历史 */}
      {showHistory && (
        <div className="bg-card border-t border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-muted-foreground">历史搜索</span>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-xs text-muted-foreground"
              aria-label="清除历史"
            >
              <Trash2 className="size-3.5" />
              清除
            </button>
          </div>
          <div>
            {history.map((item: HistoryItem) => (
              <button
                key={item.code}
                onClick={() => handleHistoryClick(item)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-border text-left"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.code}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {keyword.length >= 2 && (
        <div className="bg-card border-t border-border">
          {loading ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              搜索中...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              暂无匹配股票
            </div>
          ) : (
            <div>
              {results.map((stock) => (
                <button
                  key={stock.code}
                  onClick={() => handleResultClick(stock)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-border text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {stock.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {stock.code}
                    </span>
                  </div>
                  {stock.market && (
                    <span className="bg-accent text-muted-foreground text-[10px] px-1 rounded">
                      {getMarketLabel(stock.market)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
