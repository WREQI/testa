import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  TradingAccount,
  PositionItem,
  OrderItem,
  TradeRequest,
  TradeResult,
} from '@shared/api.interface';

export async function getAccount(): Promise<TradingAccount> {
  try {
    const res = await axiosForBackend.get('/api/trading/account');
    return res.data as TradingAccount;
  } catch (error) {
    logger.error('getAccount error', error);
    throw error;
  }
}

export async function getPositions(): Promise<PositionItem[]> {
  try {
    const res = await axiosForBackend.get('/api/trading/positions');
    return res.data as PositionItem[];
  } catch (error) {
    logger.error('getPositions error', error);
    throw error;
  }
}

export async function getOrders(): Promise<OrderItem[]> {
  try {
    const res = await axiosForBackend.get('/api/trading/orders');
    return res.data as OrderItem[];
  } catch (error) {
    logger.error('getOrders error', error);
    throw error;
  }
}

export async function executeTrade(data: TradeRequest): Promise<TradeResult> {
  try {
    const res = await axiosForBackend.post('/api/trading/trade', data);
    return res.data as TradeResult;
  } catch (error) {
    logger.error('executeTrade error', error);
    throw error;
  }
}
