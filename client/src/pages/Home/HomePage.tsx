import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, BarChart3 } from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { searchStocks, getHotStocks, getMarketIndices } from '@client/src/api/stock';
import type { StockBasic, HotStock, IndexQuote } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const DEBOUNCE_MS = 300;

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function getChangeClass(value: number): string {
  if (value > 0) return 'text-up';
  if (value < 0) return 'text-down';
  return 'text-muted-foreground';
}

// ---------- Search with dropdown ----------
function StockSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchStocks(debounced, 10),
    enabled: debounced.length >= 2,
  });

  const showDropdown =
    open &&
    debounced.length >= 2 &&
    !isError &&
    (isLoading || (data?.items?.length ?? 0) > 0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (item: StockBasic) => {
      setOpen(false);
      setQuery('');
      navigate(`/stock/${item.code}`);
    },
    [navigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && data?.items?.length) {
        handleSelect(data.items[0]);
      }
    },
    [data, handleSelect],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索股票代码或名称（至少输入 2 个字符）"
          className="h-14 pl-12 pr-4 text-base bg-card border-border rounded-sm"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-sm border border-border bg-card shadow-none">
          {isLoading && (
            <div className="p-4 text-sm text-muted-foreground">搜索中...</div>
          )}
          {!isLoading && data?.items?.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">暂无匹配结果</div>
          )}
          {!isLoading &&
            data?.items?.map((item: StockBasic) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex flex-col">
                  <span className="text-foreground">{item.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.code}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.type === 'index' ? '指数' : '股票'}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ---------- Hot Stocks Grid ----------
function HotStocksSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['hotStocks'],
    queryFn: () => getHotStocks(),
  });

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">热门股票</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-sm border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">热门股票</h2>
        <div className="rounded-sm border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          加载失败，请稍后重试
        </div>
      </section>
    );
  }

  const items = data?.items ?? [];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">热门股票</h2>
      </div>
      {items.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          暂无数据
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((item: HotStock) => (
            <Link
              key={item.code}
              to={`/stock/${item.code}`}
              className="block rounded-sm border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/50"
            >
              <div className="truncate text-sm font-medium text-foreground">
                {item.name}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {item.code}
              </div>
              <div
                className={`mt-2 font-mono font-tabular text-lg font-semibold ${getChangeClass(item.pctChg)}`}
              >
                {formatPct(item.pctChg)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------- Market Indices ----------
function MarketIndicesSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['marketIndices'],
    queryFn: () => getMarketIndices(),
  });

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">市场概览</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-sm border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">市场概览</h2>
        <div className="rounded-sm border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          加载失败，请稍后重试
        </div>
      </section>
    );
  }

  const items = data?.items ?? [];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">市场概览</h2>
      </div>
      {items.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          暂无数据
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((item: IndexQuote) => {
            const cls = getChangeClass(item.pctChg);
            return (
              <Link
                key={item.code}
                to={`/stock/${item.code}`}
                className="block rounded-sm border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <div className="text-sm font-medium text-foreground">
                  {item.name}
                </div>
                <div
                  className={`mt-2 font-mono font-tabular text-2xl font-semibold ${cls}`}
                >
                  {formatNumber(item.close, 2)}
                </div>
                <div className={`mt-1 font-mono font-tabular text-sm ${cls}`}>
                  {item.change >= 0 ? '+' : ''}
                  {formatNumber(item.change, 2)} {formatPct(item.pctChg)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------- HomePage ----------
const HomePage = () => {
  useEffect(() => {
    logger.info({ args: ['HomePage mounted'] });
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 p-4">
      {/* Hero search */}
      <div className="flex flex-col items-center py-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">股票行情</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          专业的A股分析工作台
        </p>
        <div className="w-full max-w-2xl">
          <StockSearch />
        </div>
      </div>

      {/* Market indices */}
      <MarketIndicesSection />

      {/* Hot stocks */}
      <HotStocksSection />
    </div>
  );
};

export default HomePage;
