import { useState, useEffect } from 'react';
import { X, Search, Plus, Minus } from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { useTrading } from '@client/src/hooks/useTrading';
import { useAuth } from '@client/src/hooks/useAuth';
import { stockApi } from '@client/src/api';
import type { StockBasic } from '@shared/api.interface';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';

export interface TradePanelProps {
  open: boolean;
  direction: 'buy' | 'sell';
  stockCode?: string;
  stockName?: string;
  price?: string;
  quantity?: string;
  showStockSearch?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onDirectionChange?: (dir: 'buy' | 'sell') => void;
}

const POSITION_RATIOS = [
  { ratio: 0.25, label: '1/4仓' },
  { ratio: 0.333, label: '1/3仓' },
  { ratio: 0.5, label: '半仓' },
  { ratio: 1, label: '全仓' },
];

export const TradePanel = ({
  open,
  direction,
  stockCode = '',
  stockName = '',
  price: priceProp = '',
  quantity: quantityProp = '',
  showStockSearch = true,
  onClose,
  onSuccess,
  onDirectionChange,
}: TradePanelProps) => {
  const { account, positions, trade, refresh } = useTrading();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [localCode, setLocalCode] = useState(stockCode);
  const [localName, setLocalName] = useState(stockName);
  const [localPrice, setLocalPrice] = useState(priceProp);
  const [localQty, setLocalQty] = useState(quantityProp);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StockBasic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalCode(stockCode);
      setLocalName(stockName);
      setLocalPrice(priceProp);
      setLocalQty(quantityProp || '');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, stockCode, stockName, priceProp, quantityProp]);

  useEffect(() => {
    if (!open) return;
    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    stockApi
      .searchStocks(searchQuery, 10)
      .then((res) => {
        if (!cancelled) {
          setSearchResults(res.items.filter((i) => i.type === 'stock'));
        }
      })
      .catch((err) => {
        logger.error('search stocks error', err);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, open]);

  const requireLogin = (): boolean => {
    if (!isAuthenticated) {
      toast('请先登录后进行交易', {
        action: {
          label: '去登录',
          onClick: () => navigate('/login'),
        },
      });
      return false;
    }
    return true;
  };

  const handleSelectStock = (stock: StockBasic) => {
    setLocalCode(stock.code);
    setLocalName(stock.name);
    setSearchQuery('');
    setSearchResults([]);
    stockApi
      .getQuote(stock.code)
      .then((q) => {
        if (q?.close) setLocalPrice(String(q.close));
      })
      .catch(() => {
        // ignore
      });
  };

  const adjustPrice = (delta: number) => {
    const current = Number(localPrice) || 0;
    const next = Math.max(0.01, +(current + delta).toFixed(2));
    setLocalPrice(String(next));
  };

  const adjustQuantity = (delta: number) => {
    const current = Number(localQty) || 0;
    const next = Math.max(0, current + delta);
    setLocalQty(String(next));
  };

  const setQuantityByRatio = (ratio: number) => {
    const p = Number(localPrice) || 0;
    if (!p || !account) return;
    if (direction === 'buy') {
      const maxShares = Math.floor((account.availableCash * ratio) / (p * 100)) * 100;
      setLocalQty(String(maxShares));
    } else {
      const pos = positions.find((p0) => p0.stockCode === localCode);
      if (pos) {
        const qty = Math.floor((pos.quantity * ratio) / 100) * 100;
        setLocalQty(String(qty));
      }
    }
  };

  const availableQty = direction === 'buy'
    ? account
      ? Math.floor(account.availableCash / ((Number(localPrice) || 1) * 100)) * 100
      : 0
    : positions.find((p) => p.stockCode === localCode)?.quantity ?? 0;

  const handleTrade = async () => {
    if (!requireLogin()) return;
    const p = Number(localPrice);
    const q = Number(localQty);
    if (!localCode || !localName) {
      toast.error('请选择股票');
      return;
    }
    if (!p || p <= 0) {
      toast.error('请输入有效价格');
      return;
    }
    if (!q || q <= 0 || q % 100 !== 0) {
      toast.error('数量必须为100的整数倍');
      return;
    }
    const total = p * q;
    if (direction === 'buy') {
      if (!account || account.availableCash < total) {
        toast.error('可用资金不足');
        return;
      }
    } else {
      const pos = positions.find((po) => po.stockCode === localCode);
      if (!pos || pos.quantity < q) {
        toast.error('持仓数量不足');
        return;
      }
    }
    setSubmitting(true);
    try {
      await trade({
        stockCode: localCode,
        stockName: localName,
        price: p,
        quantity: q,
        direction,
      });
      toast.success(`${direction === 'buy' ? '买入' : '卖出'}成功`);
      onClose();
      refresh();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || '交易失败');
    } finally {
      setSubmitting(false);
    }
  };

  const estAmount = Number(localPrice) * Number(localQty);
  const feeEst = estAmount
    ? estAmount * 0.00025 < 5
      ? 5
      : estAmount * 0.00025
    : 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pointer-events-none">
      <div
        className="absolute inset-0 bg-black/60 pointer-events-auto animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-card rounded-t-xl border-t border-border max-h-[65vh] flex flex-col overflow-hidden pointer-events-auto animate-slide-up">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onDirectionChange ? (
              <div className="flex bg-accent rounded-sm p-0.5">
                <button
                  onClick={() => onDirectionChange('buy')}
                  className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${
                    direction === 'buy'
                      ? 'bg-up text-white'
                      : 'text-muted-foreground'
                  }`}
                >
                  买入
                </button>
                <button
                  onClick={() => onDirectionChange('sell')}
                  className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${
                    direction === 'sell'
                      ? 'bg-down text-white'
                      : 'text-muted-foreground'
                  }`}
                >
                  卖出
                </button>
              </div>
            ) : (
              <h3 className="text-base font-semibold text-foreground">
                {direction === 'buy' ? '买入' : '卖出'}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="关闭"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stock Info / Search */}
          {showStockSearch ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                股票代码/名称
              </Label>
              <div className="relative">
                <Input
                  value={
                    localCode ? `${localName} (${localCode})` : searchQuery
                  }
                  onChange={(e) => {
                    if (localCode) {
                      setLocalCode('');
                      setLocalName('');
                      setLocalPrice('');
                    }
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="搜索股票"
                  className="pr-8"
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-sm border border-border bg-background z-10">
                  {searchResults.map((s) => (
                    <button
                      key={s.code}
                      onClick={() => handleSelectStock(s)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-accent/50 border-b border-border last:border-b-0"
                    >
                      <span className="text-sm text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {s.code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searching && (
                <div className="text-xs text-muted-foreground">搜索中...</div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <div className="text-base font-semibold text-foreground">
                  {localName || '--'}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  {localCode || '--'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">可用资金</div>
                <div className="font-mono text-sm font-semibold text-foreground">
                  ¥{(account?.availableCash ?? 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Price with +- */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">价格</Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustPrice(-0.01)}
                className="shrink-0 size-9 flex items-center justify-center rounded-sm bg-accent text-foreground hover:bg-accent/80"
                aria-label="减价"
              >
                <Minus className="size-4" />
              </button>
              <Input
                type="number"
                value={localPrice}
                onChange={(e) => setLocalPrice(e.target.value)}
                placeholder="输入价格"
                className="font-mono text-center text-lg h-9"
              />
              <button
                onClick={() => adjustPrice(0.01)}
                className="shrink-0 size-9 flex items-center justify-center rounded-sm bg-accent text-foreground hover:bg-accent/80"
                aria-label="加价"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Quantity with +- */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">数量（股）</Label>
              <span className="text-[10px] text-muted-foreground">
                最大可{direction === 'buy' ? '买' : '卖'}: {availableQty}股
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustQuantity(-100)}
                className="shrink-0 size-9 flex items-center justify-center rounded-sm bg-accent text-foreground hover:bg-accent/80"
                aria-label="减少"
              >
                <Minus className="size-4" />
              </button>
              <Input
                type="number"
                value={localQty}
                onChange={(e) => setLocalQty(e.target.value)}
                placeholder="100股起"
                className="font-mono text-center text-lg h-9"
              />
              <button
                onClick={() => adjustQuantity(100)}
                className="shrink-0 size-9 flex items-center justify-center rounded-sm bg-accent text-foreground hover:bg-accent/80"
                aria-label="增加"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {POSITION_RATIOS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setQuantityByRatio(r.ratio)}
                  className="py-1.5 text-[11px] bg-accent text-foreground rounded-sm hover:bg-accent/80"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-2 border-t border-border space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">预估金额</span>
              <span className="font-mono text-foreground">
                ¥{estAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">预估手续费</span>
              <span className="font-mono text-foreground">
                ¥{feeEst.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可用资金</span>
              <span className="font-mono text-foreground">
                ¥{(account?.availableCash ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="shrink-0 pt-3 pb-4 border-t border-border px-4 bg-card">
          <button
            onClick={handleTrade}
            disabled={submitting}
            className={`w-full h-12 rounded-lg text-base font-semibold text-white transition-colors active:opacity-80 disabled:opacity-50 ${
              direction === 'buy'
                ? 'bg-up hover:bg-up/90'
                : 'bg-down hover:bg-down/90'
            }`}
          >
            {submitting
              ? '提交中...'
              : `确认${direction === 'buy' ? '买入' : '卖出'}`}
          </button>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  );
};

export default TradePanel;
