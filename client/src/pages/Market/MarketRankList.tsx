import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { getStockList } from '@client/src/api/stock';
import type { StockListItem } from '@shared/api.interface';

type SortField = 'pctChg' | 'turn' | 'amount';

interface RankTab {
  key: string;
  label: string;
  sortBy: SortField;
  order: 'asc' | 'desc';
}

const RANK_TABS: RankTab[] = [
  { key: 'pctChg_desc', label: '涨幅榜', sortBy: 'pctChg', order: 'desc' },
  { key: 'pctChg_asc', label: '跌幅榜', sortBy: 'pctChg', order: 'asc' },
  { key: 'turn_desc', label: '换手榜', sortBy: 'turn', order: 'desc' },
  { key: 'amount_desc', label: '成交额', sortBy: 'amount', order: 'desc' },
];

const PERIOD_TABS = [
  { key: '1d', label: '今日' },
  { key: '5d', label: '5日' },
  { key: '20d', label: '20日' },
  { key: '60d', label: '60日' },
];

// 根据代码推断市场标签
function getMarketTag(code: string): string {
  const pure = code.replace(/^[a-z]+\./i, '');
  if (/^688/.test(pure)) return '科';
  if (/^30/.test(pure)) return '创';
  if (/^6/.test(pure)) return '沪';
  if (/^[03]/.test(pure)) return '深';
  return '';
}

interface RankItemProps {
  stock: StockListItem;
  rank: number;
}

function RankItem({ stock, rank }: RankItemProps) {
  const isUp = stock.pctChg >= 0;
  const rankColor =
    rank <= 3 ? 'text-up' : 'text-muted-foreground';
  const tag = getMarketTag(stock.code);

  return (
    <Link
      to={`/stock/${encodeURIComponent(stock.code)}`}
      className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-b-0 active:bg-accent/50"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className={`w-5 text-center text-xs font-mono font-semibold ${rankColor}`}
        >
          {rank}
        </span>
        <div className="min-w-0">
          <div className="text-sm text-foreground font-medium truncate flex items-center gap-1">
            {tag && (
              <span className="inline-block text-[10px] px-1 rounded bg-accent text-muted-foreground leading-[14px]">
                {tag}
              </span>
            )}
            <span className="truncate">{stock.name}</span>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            {stock.code}
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="font-mono text-sm text-foreground">
          {stock.close.toFixed(2)}
        </div>
        <div
          className={`font-mono text-xs mt-0.5 inline-block px-2 py-0.5 rounded ${
            isUp ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
          }`}
        >
          {stock.pctChg >= 0 ? '+' : ''}
          {stock.pctChg.toFixed(2)}%
        </div>
      </div>
    </Link>
  );
}

const MarketRankList = () => {
  const [rankTab, setRankTab] = useState(RANK_TABS[0].key);
  const [periodTab, setPeriodTab] = useState(PERIOD_TABS[0].key);
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const currentRank = RANK_TABS.find((t) => t.key === rankTab) ?? RANK_TABS[0];
  const displayList = expanded ? stocks : stocks.slice(0, 20);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getStockList({
          sortBy: currentRank.sortBy,
          order: currentRank.order,
          page: 1,
          pageSize: 50,
        });
        if (!cancelled) {
          setStocks(res.items);
        }
      } catch {
        if (!cancelled) setStocks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [rankTab, currentRank.sortBy, currentRank.order]);

  return (
    <div className="bg-card border-t border-b border-border mt-3">
      {/* 标题行 */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">股票排行</h2>
        <div className="flex items-center gap-3">
          <button className="size-5 flex items-center justify-center">
            <Filter className="size-4 text-muted-foreground" />
          </button>
          <button className="text-xs text-muted-foreground flex items-center">
            更多 <span className="ml-0.5">›</span>
          </button>
        </div>
      </div>

      {/* 排行Tab */}
      <div className="overflow-x-auto whitespace-nowrap px-3 [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex gap-1">
          {RANK_TABS.map((tab) => {
            const active = rankTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setRankTab(tab.key)}
                className={`px-3 py-1.5 text-sm rounded ${
                  active
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 时间周期Tab */}
      <div className="overflow-x-auto whitespace-nowrap px-3 pb-2 [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex gap-1">
          {PERIOD_TABS.map((tab) => {
            const active = periodTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setPeriodTab(tab.key)}
                className={`px-2.5 py-1 text-xs rounded ${
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 列表 */}
      <div>
        {loading && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            加载中...
          </div>
        )}
        {!loading &&
          displayList.map((stock, i) => (
            <RankItem key={stock.code} stock={stock} rank={i + 1} />
          ))}
      </div>

      {/* 底部展开/收起 */}
      {!loading && stocks.length > 0 && (
        <div className="flex items-center justify-center py-3 border-t border-border">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <span className="font-mono">
              {expanded ? stocks.length : 20}/{stocks.length} 条
            </span>
            {expanded ? (
              <>
                收起 <ChevronUp className="size-3" />
              </>
            ) : (
              <>
                展开 <ChevronDown className="size-3" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketRankList;
