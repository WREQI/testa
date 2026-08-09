import { useState } from 'react';
import {
  Eye,
  EyeOff,
  ShoppingCart,
  Banknote,
  ListOrdered,
  PieChart,
  Grid3x3,
  BellRing,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { useTrading } from '@client/src/hooks/useTrading';
import { useAuth } from '@client/src/hooks/useAuth';
import TradePanel from '@client/src/components/TradePanel/TradePanel';
import type { PositionItem } from '@shared/api.interface';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const formatMoney = (val: number): string => {
  if (Math.abs(val) >= 100000000) return (val / 100000000).toFixed(2) + '亿';
  if (Math.abs(val) >= 10000) return (val / 10000).toFixed(2) + '万';
  return val.toFixed(2);
};

const functionGroups = [
  { icon: ShoppingCart, label: '快速买入', action: 'buy' as const },
  { icon: Banknote, label: '快速卖出', action: 'sell' as const },
  { icon: ListOrdered, label: '交易记录', action: 'orders' as const },
  { icon: PieChart, label: '资金明细', action: 'funds' as const },
  { icon: Grid3x3, label: '盈亏分析', action: 'analysis' as const },
  { icon: Grid3x3, label: '网格交易', action: 'grid' as const },
  { icon: BellRing, label: '条件单', action: 'condition' as const },
  { icon: MoreHorizontal, label: '更多', action: 'more' as const },
];

const TradePage = () => {
  const { account, positions, loading, trade, refresh } = useTrading();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAmount, setShowAmount] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'condition'>('positions');

  const [tradePanelOpen, setTradePanelOpen] = useState(false);
  const [tradeDirection, setTradeDirection] = useState<'buy' | 'sell'>('buy');
  const [stockCode, setStockCode] = useState('');
  const [stockName, setStockName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const requireLogin = (): boolean => {
    if (!isAuthenticated) {
      toast('请先登录后进行交易', {
        action: {
          label: '去登录',
          onClick: () => navigate('/login', { state: { from: '/trade' } }),
        },
      });
      return false;
    }
    return true;
  };

  const openTrade = (direction: 'buy' | 'sell', stock?: PositionItem) => {
    if (!requireLogin()) return;
    setTradeDirection(direction);
    if (stock) {
      setStockCode(stock.stockCode);
      setStockName(stock.stockName);
      setPrice(String(stock.currentPrice));
    } else {
      setStockCode('');
      setStockName('');
      setPrice('');
    }
    setQuantity('');
    setTradePanelOpen(true);
  };

  const handleFunctionClick = (action: string) => {
    if (action === 'buy' || action === 'sell') {
      openTrade(action as 'buy' | 'sell');
    } else if (action === 'orders') {
      if (!requireLogin()) return;
      setActiveTab('orders');
    } else {
      if (!requireLogin()) return;
      toast.info(`${action} 功能开发中`);
    }
  };

  return (
    <div className="pb-6">
      {/* Account Header */}
      <div className="bg-card border-b border-border px-4 py-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-primary/20 text-primary font-medium">
              模拟交易
            </span>
            <span className="text-xs text-muted-foreground">
              {isAuthenticated ? '已登录账户' : '本地模拟'}
            </span>
          </div>
          <button
            onClick={() => setShowAmount(!showAmount)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={showAmount ? '隐藏金额' : '显示金额'}
          >
            {showAmount ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-muted-foreground mb-1">今日盈亏</div>
            <div
              className={`font-mono text-2xl font-bold flex items-center gap-1 ${
                (account?.todayProfit ?? 0) >= 0 ? 'text-up' : 'text-down'
              }`}
            >
              {(account?.todayProfit ?? 0) >= 0 ? (
                <ArrowUpRight className="size-5" />
              ) : (
                <ArrowDownRight className="size-5" />
              )}
              {showAmount
                ? `${
                    (account?.todayProfit ?? 0) >= 0 ? '+' : ''
                  }${formatMoney(account?.todayProfit ?? 0)}`
                : '****'}
              <span className="text-sm font-medium ml-1">
                {showAmount
                  ? `${(account?.todayPct ?? 0) >= 0 ? '+' : ''}${(
                      account?.todayPct ?? 0
                    ).toFixed(2)}%`
                  : ''}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">持仓盈亏</div>
            <div
              className={`font-mono text-base font-semibold ${
                (account?.positionProfit ?? 0) >= 0 ? 'text-up' : 'text-down'
              }`}
            >
              {showAmount
                ? `${
                    (account?.positionProfit ?? 0) >= 0 ? '+' : ''
                  }${formatMoney(account?.positionProfit ?? 0)}`
                : '****'}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">总资产</div>
            <div className="font-mono text-sm font-semibold text-foreground mt-1">
              {showAmount ? formatMoney(account?.totalAssets ?? 0) : '****'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">证券市值</div>
            <div className="font-mono text-sm font-semibold text-foreground mt-1">
              {showAmount ? formatMoney(account?.marketValue ?? 0) : '****'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">可用资金</div>
            <div className="font-mono text-sm font-semibold text-foreground mt-1">
              {showAmount ? formatMoney(account?.availableCash ?? 0) : '****'}
            </div>
          </div>
        </div>
      </div>

      {/* Function Grid */}
      <div className="grid grid-cols-4 gap-y-3 px-2 py-4 bg-background">
        {functionGroups.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => handleFunctionClick(item.action)}
              className="flex flex-col items-center gap-1.5 py-2 active:opacity-70"
            >
              <div className="size-10 rounded-full bg-card border border-border flex items-center justify-center">
                <Icon className="size-5 text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-[11px] text-foreground">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Positions / Orders Tabs */}
      <div className="mt-2 bg-card border-t border-b border-border">
        <div className="flex border-b border-border">
          {[
            { key: 'positions', label: '持仓分布' },
            { key: 'orders', label: '今日委托' },
            { key: 'condition', label: '条件单' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`relative flex-1 py-2.5 text-sm ${
                activeTab === tab.key
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {activeTab === 'positions' && (
            <div>
              {loading && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  加载中...
                </div>
              )}
              {!loading && positions.length === 0 && (
                <div className="py-10 text-center">
                  <div className="text-xs text-muted-foreground mb-3">
                    暂无持仓，开始模拟交易吧
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openTrade('buy')}
                    className="text-xs h-8"
                  >
                    立即买入
                  </Button>
                </div>
              )}
              {positions.map((pos) => (
                <div
                  key={pos.stockCode}
                  onClick={() => openTrade('sell', pos)}
                  className="px-4 py-3 border-b border-border last:border-b-0 active:bg-accent/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {pos.stockName}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {pos.stockCode.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right flex-1">
                      <div
                        className={`font-mono text-sm font-semibold ${
                          pos.todayProfit >= 0 ? 'text-up' : 'text-down'
                        }`}
                      >
                        {pos.todayProfit >= 0 ? '+' : ''}
                        {formatMoney(pos.todayProfit)}
                      </div>
                      <div
                        className={`font-mono text-[11px] ${
                          pos.todayPct >= 0 ? 'text-up' : 'text-down'
                        }`}
                      >
                        {pos.todayPct >= 0 ? '+' : ''}
                        {pos.todayPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <div className="text-muted-foreground">市值</div>
                      <div className="font-mono text-foreground font-medium">
                        {formatMoney(pos.marketValue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">现价/成本</div>
                      <div className="font-mono text-foreground font-medium">
                        {pos.currentPrice.toFixed(2)}
                        <span className="text-muted-foreground text-[10px] ml-1">
                          /{pos.avgCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground">
                        {pos.quantity}股
                      </div>
                      <div
                        className={`font-mono font-medium ${
                          pos.profitPct >= 0 ? 'text-up' : 'text-down'
                        }`}
                      >
                        {pos.profitPct >= 0 ? '+' : ''}
                        {pos.profitPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              {loading && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  加载中...
                </div>
              )}
              {!loading && positions.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  暂无交易记录
                </div>
              )}
              {[...Array(0)].map((_, i) => (
                <div key={i} />
              ))}
            </div>
          )}

          {activeTab === 'condition' && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              条件单功能开发中
            </div>
          )}
        </div>
      </div>

      {/* Trade Drawer */}
      <TradePanel
        open={tradePanelOpen}
        direction={tradeDirection}
        stockCode={stockCode}
        stockName={stockName}
        price={price}
        quantity={quantity}
        showStockSearch={true}
        onClose={() => setTradePanelOpen(false)}
        onDirectionChange={setTradeDirection}
      />
    </div>
  );
};

export default TradePage;
