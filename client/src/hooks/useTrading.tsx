import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradingApi } from '@client/src/api';
import { useAuth } from './useAuth';
import type {
  TradingAccount,
  PositionItem,
  OrderItem,
  TradeRequest,
} from '@shared/api.interface';

const LS_KEY = 'trading_local_account';

interface LocalTradingData {
  account: TradingAccount;
  positions: PositionItem[];
  orders: OrderItem[];
}

function loadLocalData(): LocalTradingData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    account: {
      totalAssets: 1000000,
      availableCash: 1000000,
      marketValue: 0,
      todayProfit: 0,
      todayPct: 0,
      positionProfit: 0,
      positionPct: 0,
    },
    positions: [],
    orders: [],
  };
}

function saveLocalData(data: LocalTradingData) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

interface TradingContextType {
  account: TradingAccount | null;
  positions: PositionItem[];
  orders: OrderItem[];
  loading: boolean;
  trade: (req: TradeRequest) => Promise<void>;
  refresh: () => void;
}

const TradingContext = createContext<TradingContextType | null>(null);

const COMMISSION_RATE = 0.00025;
const MIN_COMMISSION = 5;
const STAMP_DUTY_RATE = 0.001;
const TRANSFER_FEE_RATE = 0.00001;

function calcFees(amount: number, direction: 'buy' | 'sell') {
  const commission = Math.max(amount * COMMISSION_RATE, MIN_COMMISSION);
  const stampTax = direction === 'sell' ? amount * STAMP_DUTY_RATE : 0;
  const transferFee = amount * TRANSFER_FEE_RATE;
  return {
    commission: Math.round(commission * 100) / 100,
    stampTax: Math.round(stampTax * 100) / 100,
    transferFee: Math.round(transferFee * 100) / 100,
  };
}

export function TradingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<LocalTradingData>(() => loadLocalData());

  const {
    data: serverAccount,
    isLoading: accountLoading,
  } = useQuery<TradingAccount>({
    queryKey: ['trading', 'account'],
    queryFn: tradingApi.getAccount,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const {
    data: serverPositions,
    isLoading: positionsLoading,
  } = useQuery<PositionItem[]>({
    queryKey: ['trading', 'positions'],
    queryFn: tradingApi.getPositions,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const {
    data: serverOrders,
    isLoading: ordersLoading,
  } = useQuery<OrderItem[]>({
    queryKey: ['trading', 'orders'],
    queryFn: tradingApi.getOrders,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const account: TradingAccount | null = isAuthenticated
    ? serverAccount ?? null
    : localData.account;
  const positions = isAuthenticated ? (serverPositions ?? []) : localData.positions;
  const orders = isAuthenticated ? (serverOrders ?? []) : localData.orders;
  const loading = isAuthenticated && (accountLoading || positionsLoading || ordersLoading);

  const tradeMutation = useMutation({
    mutationFn: async (req: TradeRequest) => {
      const result = await tradingApi.executeTrade(req);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading'] });
    },
  });

  const trade = useCallback(
    async (req: TradeRequest) => {
      if (isAuthenticated) {
        await tradeMutation.mutateAsync(req);
        return;
      }

      if (req.quantity % 100 !== 0) {
        throw new Error('数量必须为100的整数倍');
      }

      const amount = req.price * req.quantity;
      const fees = calcFees(amount, req.direction);
      const totalCost = amount + fees.commission + fees.stampTax + fees.transferFee;
      const netProceeds = amount - fees.commission - fees.stampTax - fees.transferFee;

      setLocalData((prev) => {
        const acc = { ...prev.account };
        let posList = [...prev.positions];
        const orderList = [...prev.orders];

        if (req.direction === 'buy') {
          if (acc.availableCash < totalCost) {
            throw new Error('可用资金不足');
          }
          acc.availableCash = Math.round((acc.availableCash - totalCost) * 100) / 100;

          const existing = posList.find((p) => p.stockCode === req.stockCode);
          if (existing) {
            const newQty = existing.quantity + req.quantity;
            const costBasis = existing.avgCost * existing.quantity + amount;
            existing.avgCost = Math.round((costBasis / newQty) * 10000) / 10000;
            existing.quantity = newQty;
            existing.stockName = req.stockName;
          } else {
            posList.push({
              stockCode: req.stockCode,
              stockName: req.stockName,
              quantity: req.quantity,
              avgCost: req.price,
              currentPrice: req.price,
              marketValue: amount,
              profit: 0,
              profitPct: 0,
              todayProfit: 0,
              todayPct: 0,
            });
          }
        } else {
          const existing = posList.find((p) => p.stockCode === req.stockCode);
          if (!existing || existing.quantity < req.quantity) {
            throw new Error('持仓不足');
          }
          existing.quantity -= req.quantity;
          if (existing.quantity === 0) {
            posList = posList.filter((p) => p.stockCode !== req.stockCode);
          }
          acc.availableCash = Math.round((acc.availableCash + netProceeds) * 100) / 100;
        }

        const marketValue = posList.reduce(
          (sum: number, p: PositionItem) => sum + p.currentPrice * p.quantity,
          0,
        );
        acc.marketValue = Math.round(marketValue * 100) / 100;
        acc.totalAssets = Math.round((acc.availableCash + marketValue) * 100) / 100;

        const order: OrderItem = {
          id: `local_${Date.now()}`,
          stockCode: req.stockCode,
          stockName: req.stockName,
          direction: req.direction,
          price: req.price,
          quantity: req.quantity,
          amount,
          commission: fees.commission,
          stampTax: fees.stampTax,
          transferFee: fees.transferFee,
          status: 'filled',
          createdAt: new Date().toISOString(),
        };
        orderList.unshift(order);

        const next = { account: acc, positions: posList, orders: orderList };
        saveLocalData(next);
        return next;
      });
    },
    [isAuthenticated, tradeMutation],
  );

  const refresh = useCallback(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['trading'] });
    } else {
      setLocalData(loadLocalData());
    }
  }, [isAuthenticated, queryClient]);

  const value = useMemo(
    () => ({ account, positions, orders, loading, trade, refresh }),
    [account, positions, orders, loading, trade, refresh],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTrading must be used within TradingProvider');
  return ctx;
}
