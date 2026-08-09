import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Plus, Trash2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { useWatchlist } from '@client/src/hooks/useWatchlist';
import { getQuote } from '@client/src/api/stock';

function WatchlistRow({ code, name }: { code: string; name: string }) {
  const { remove } = useWatchlist();
  const { data, isLoading } = useQuery({
    queryKey: ['quote', code],
    queryFn: () => getQuote(code),
    staleTime: 60 * 1000,
  });

  const quote = data;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    remove(code);
  };

  const up = (quote?.pctChg ?? 0) >= 0;

  return (
    <Link
      to={`/stock/${code}`}
      className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 active:bg-accent/50"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {name}
        </div>
        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
          {code.toUpperCase()}
        </div>
      </div>

      <div className="text-right mr-2">
        {isLoading ? (
          <div className="w-16 h-4 bg-accent rounded animate-pulse" />
        ) : quote ? (
          <>
            <div
              className={`font-mono text-sm font-semibold ${
                up ? 'text-up' : 'text-down'
              }`}
            >
              {quote.close.toFixed(2)}
            </div>
            <div
              className={`font-mono text-[11px] ${
                up ? 'text-up' : 'text-down'
              }`}
            >
              {up ? '+' : ''}
              {quote.pctChg.toFixed(2)}%
            </div>
          </>
        ) : null}
      </div>

      <button
        onClick={handleRemove}
        className="p-1.5 text-muted-foreground hover:text-up active:text-up"
        aria-label="移除自选"
      >
        <Trash2 className="size-4" />
      </button>
    </Link>
  );
}

const WatchlistPage = () => {
  const { items, loading } = useWatchlist();

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="size-5 text-primary fill-primary/20" />
          <h1 className="text-lg font-bold text-foreground">自选股</h1>
          <span className="text-xs text-muted-foreground font-mono">
            {items.length} 只
          </span>
        </div>
        <Link to="/">
          <Button size="sm" variant="ghost" className="h-8 text-xs">
            <Plus className="size-4 mr-1" />
            添加
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="py-10 text-center text-xs text-muted-foreground">
          加载中...
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="mx-4 mt-10 text-center">
          <div className="size-16 mx-auto mb-4 rounded-full bg-card border border-border flex items-center justify-center">
            <Star className="size-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">
            暂无自选股
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            在行情页搜索并添加关注的股票
          </p>
          <Link to="/">
            <Button size="sm">去添加</Button>
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="bg-card border-t border-b border-border">
          {items.map((item) => (
            <WatchlistRow key={item.code} code={item.code} name={item.name} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;
