import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, ArrowUpRight, ArrowDownRight, ChevronDown, TrendingUp } from 'lucide-react';
import { getStockList, getIndustries } from '@client/src/api/stock';
import type { StockListItem } from '@shared/api.interface';

const QUICK_TAGS = [
  { key: 'gainers', label: '涨幅居前', sortBy: 'pctChg' as const, order: 'desc' as const },
  { key: 'losers', label: '跌幅居前', sortBy: 'pctChg' as const, order: 'asc' as const },
  { key: 'turnover', label: '高换手', sortBy: 'turn' as const, order: 'desc' as const },
  { key: 'peLow', label: '低PE', sortBy: 'peTTM' as const, order: 'asc' as const },
  { key: 'amount', label: '成交额', sortBy: 'amount' as const, order: 'desc' as const },
];

const ScreenerPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'pctChg' | 'amount' | 'turn' | 'peTTM'>('pctChg');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [industry, setIndustry] = useState('');
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [activeTag, setActiveTag] = useState<string>('gainers');

  const { data: industries } = useQuery({
    queryKey: ['industries'],
    queryFn: () => getIndustries().then((res) => res.items),
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['stock-list', industry, sortBy, order, page, pageSize],
    queryFn: () =>
      getStockList({ industry, sortBy, order, page, pageSize }).then(),
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });

  const handleTagClick = (tag: (typeof QUICK_TAGS)[number]) => {
    setActiveTag(tag.key);
    if (tag.sortBy) {
      setSortBy(tag.sortBy);
      setOrder(tag.order);
    }
    setPage(1);
  };

  const handleIndustrySelect = (ind: string) => {
    setIndustry(ind);
    setShowIndustryPicker(false);
    setPage(1);
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          发现
        </h1>
      </div>

      {/* Industry Picker */}
      <div className="px-4 mb-3">
        <button
          onClick={() => setShowIndustryPicker(!showIndustryPicker)}
          className="w-full flex items-center justify-between px-3 py-2 bg-card border border-border rounded-sm text-sm"
        >
          <span className="text-foreground">
            {industry || '全部行业'}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
        {showIndustryPicker && industries && (
          <div className="mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-sm">
            <button
              onClick={() => handleIndustrySelect('')}
              className={`w-full text-left px-3 py-2 text-sm border-b border-border ${
                !industry ? 'text-primary' : 'text-foreground'
              }`}
            >
              全部行业
            </button>
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => handleIndustrySelect(ind)}
                className={`w-full text-left px-3 py-2 text-xs border-b border-border last:border-b-0 ${
                  industry === ind ? 'text-primary' : 'text-foreground'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tags */}
      <div className="px-3 mb-3 flex gap-2 overflow-x-auto pb-1">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag.key}
            onClick={() => handleTagClick(tag)}
            className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border ${
              activeTag === tag.key
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border text-muted-foreground'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Stock List */}
      <div className="bg-card border-t border-b border-border">
        {isLoading && (
          <div className="py-10 text-center text-xs text-muted-foreground">
            加载中...
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="py-10 text-center text-xs text-muted-foreground">
            暂无数据
          </div>
        )}
        {items.map((stock: StockListItem) => {
          const up = stock.pctChg >= 0;
          return (
            <Link
              key={stock.code}
              to={`/stock/${stock.code}`}
              className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 active:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {stock.name}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {stock.code.toUpperCase()}
                  {stock.industry && (
                    <span className="ml-2 text-muted-foreground">
                      {stock.industry}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono text-sm font-semibold ${
                    up ? 'text-up' : 'text-down'
                  }`}
                >
                  {stock.close.toFixed(2)}
                </div>
                <div
                  className={`font-mono text-[11px] flex items-center justify-end gap-0.5 ${
                    up ? 'text-up' : 'text-down'
                  }`}
                >
                  {up ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {up ? '+' : ''}
                  {stock.pctChg.toFixed(2)}%
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 px-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs bg-card border border-border rounded-sm text-foreground disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-xs text-muted-foreground font-mono">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs bg-card border border-border rounded-sm text-foreground disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default ScreenerPage;
