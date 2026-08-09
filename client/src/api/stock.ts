import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  StockBasic,
  KlineItem,
  StockQuote,
  FinanceItem,
  FinanceType,
  HotStock,
  IndexQuote,
  StockListItem,
  PaginatedResponse,
  GridSimulateRequest,
  GridSimulateResult,
  FavoriteItem,
  AddFavoriteRequest,
} from '@shared/api.interface';
import {
  searchStockLocally,
  getStockBasicByCode,
  type SearchMatch,
} from '../services/local-stock-search';
import { STOCK_POOL_BUILTIN } from '../services/stock-pool.data';
import {
  getQuoteBrowser,
  getQuotesBrowser,
  type BrowserQuote,
} from '../services/stock-sdk-browser';

const HOT_CODES = [
  'sh.600519', 'sz.300750', 'sz.002594', 'sh.601318', 'sh.600036',
  'sz.000858', 'sh.601899', 'sz.000333', 'sh.600900', 'sz.002415',
];

const INDEX_CODES = [
  'sh.000001', 'sh.000300', 'sz.399001', 'sz.399006', 'sh.000688',
];

function searchMatchToStockBasic(m: SearchMatch): StockBasic {
  return {
    code: m.code,
    name: m.name,
    type: m.type,
    industry: m.industry,
  };
}

export async function searchStocks(q: string, limit = 20) {
  const query = (q || '').trim();
  if (!query) return { items: [] as StockBasic[] };
  try {
    const local = searchStockLocally(query, limit);
    if (local.length >= Math.min(5, limit)) {
      return { items: local.map(searchMatchToStockBasic) };
    }
  } catch (e) {
    logger.warn('searchStocks local search failed', e);
  }
  try {
    const res = await axiosForBackend.get('/api/stocks/search', {
      params: { q, limit },
    });
    return res.data as { items: StockBasic[] };
  } catch (error) {
    logger.error('searchStocks backend error', error);
    const local = searchStockLocally(query, limit);
    return { items: local.map(searchMatchToStockBasic) };
  }
}

function browserQuoteToHot(bq: BrowserQuote, type: 'stock' | 'index' = 'stock'): HotStock {
  return {
    code: bq.code,
    name: bq.name,
    type,
    close: bq.close,
    pctChg: bq.pctChg,
    change: bq.change,
  };
}

function browserQuoteToIndex(bq: BrowserQuote): IndexQuote {
  return {
    code: bq.code,
    name: bq.name,
    close: bq.close,
    pctChg: bq.pctChg,
    change: bq.change,
  };
}

export async function getHotStocks() {
  try {
    const quotes = await getQuotesBrowser(HOT_CODES);
    const items: HotStock[] = HOT_CODES.map((code) => {
      const bq = quotes.get(code);
      if (bq) return browserQuoteToHot(bq, 'stock');
      const basic = getStockBasicByCode(code);
      return {
        code,
        name: basic?.name || code,
        type: 'stock' as const,
        close: 0,
        pctChg: 0,
        change: 0,
      };
    }).filter(Boolean) as HotStock[];
    if (items.length > 0) return { items };
  } catch (e) {
    logger.warn('getHotStocks browser path failed, fallback', e);
  }
  try {
    const res = await axiosForBackend.get('/api/stocks/hot');
    return res.data as { items: HotStock[] };
  } catch (error) {
    logger.error('getHotStocks backend error, using builtin fallback', error);
    const items: HotStock[] = STOCK_POOL_BUILTIN
      .filter((s) => HOT_CODES.includes(s.code))
      .map((s) => ({
        code: s.code,
        name: s.name,
        type: s.type,
        close: 0,
        pctChg: 0,
        change: 0,
      }));
    const ordered = HOT_CODES
      .map((c) => items.find((i) => i.code === c))
      .filter((v): v is HotStock => !!v);
    return { items: ordered };
  }
}

export async function getMarketIndices() {
  try {
    const quotes = await getQuotesBrowser(INDEX_CODES);
    const items: IndexQuote[] = INDEX_CODES.map((code) => {
      const bq = quotes.get(code);
      if (bq) return browserQuoteToIndex(bq);
      const basic = getStockBasicByCode(code);
      return {
        code,
        name: basic?.name || code,
        close: 0,
        pctChg: 0,
        change: 0,
      };
    }).filter(Boolean) as IndexQuote[];
    if (items.length > 0) return { items };
  } catch (e) {
    logger.warn('getMarketIndices browser path failed, fallback', e);
  }
  try {
    const res = await axiosForBackend.get('/api/market/indices');
    return res.data as { items: IndexQuote[] };
  } catch (error) {
    logger.error('getMarketIndices backend error, using builtin fallback', error);
    const items: IndexQuote[] = STOCK_POOL_BUILTIN
      .filter((s) => s.type === 'index')
      .map((s) => ({
        code: s.code,
        name: s.name,
        close: 0,
        pctChg: 0,
        change: 0,
      }));
    const ordered = INDEX_CODES
      .map((c) => items.find((i) => i.code === c))
      .filter((v): v is IndexQuote => !!v);
    return { items: ordered };
  }
}

export interface KlineQuery {
  code: string;
  period?: 'd' | 'w' | 'm';
  adjust?: 1 | 2 | 3;
  startDate?: string;
  endDate?: string;
}

export async function getKline(params: KlineQuery) {
  try {
    const res = await axiosForBackend.get(`/api/stocks/${params.code}/kline`, {
      params: {
        period: params.period || 'd',
        adjust: params.adjust || 2,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
    return res.data as { code: string; name: string; items: KlineItem[] };
  } catch (error) {
    logger.error('getKline error', error);
    throw error;
  }
}

export async function getQuote(code: string): Promise<StockQuote> {
  try {
    const bq = await getQuoteBrowser(code);
    if (bq && bq.close > 0) {
      return {
        code: bq.code,
        name: bq.name,
        close: bq.close,
        change: bq.change,
        pctChg: bq.pctChg,
        open: bq.open,
        high: bq.high,
        low: bq.low,
        preClose: bq.preClose,
        volume: bq.volume,
        amount: bq.amount,
        turn: bq.turn ?? 0,
        peTTM: 0,
        pbMRQ: 0,
        updateTime: bq.updateTime,
      };
    }
  } catch (e) {
    logger.warn('getQuote browser path failed, fallback backend', e);
  }
  try {
    const res = await axiosForBackend.get(`/api/stocks/${code}/quote`);
    return res.data as StockQuote;
  } catch (error) {
    logger.error('getQuote backend error', error);
    const bq = await getQuoteBrowser(code);
    return {
      code: bq.code,
      name: bq.name,
      close: bq.close,
      change: bq.change,
      pctChg: bq.pctChg,
      open: bq.open,
      high: bq.high,
      low: bq.low,
      preClose: bq.preClose,
      volume: bq.volume,
      amount: bq.amount,
      turn: bq.turn ?? 0,
      peTTM: 0,
      pbMRQ: 0,
      updateTime: bq.updateTime,
    };
  }
}

export async function getFinance(
  code: string,
  type: FinanceType,
  year?: number,
) {
  try {
    const res = await axiosForBackend.get(`/api/stocks/${code}/finance`, {
      params: { type, year },
    });
    return res.data as { code: string; type: string; items: FinanceItem[] };
  } catch (error) {
    logger.error('getFinance error', error);
    throw error;
  }
}

export interface StockListQuery {
  industry?: string;
  sortBy?: 'pctChg' | 'volume' | 'amount' | 'peTTM' | 'pbMRQ' | 'turn';
  order?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export async function getStockList(params: StockListQuery) {
  try {
    const res = await axiosForBackend.get('/api/stocks', { params });
    return res.data as PaginatedResponse<StockListItem>;
  } catch (error) {
    logger.error('getStockList error', error);
    throw error;
  }
}

export async function getIndustries() {
  try {
    const res = await axiosForBackend.get('/api/stocks/industries');
    return res.data as { items: string[] };
  } catch (error) {
    logger.error('getIndustries error', error);
    throw error;
  }
}

export async function simulateGrid(
  code: string,
  params: GridSimulateRequest,
): Promise<GridSimulateResult> {
  try {
    const res = await axiosForBackend.post(
      `/api/stocks/${code}/grid-simulate`,
      params,
    );
    return res.data as GridSimulateResult;
  } catch (error) {
    logger.error('simulateGrid error', error);
    throw error;
  }
}

export async function getFavorites(): Promise<FavoriteItem[]> {
  try {
    const res = await axiosForBackend.get('/api/favorites');
    return res.data as FavoriteItem[];
  } catch (error) {
    logger.error('getFavorites error', error);
    throw error;
  }
}

export async function addFavorite(
  data: AddFavoriteRequest,
): Promise<FavoriteItem> {
  try {
    const res = await axiosForBackend.post('/api/favorites', data);
    return res.data as FavoriteItem;
  } catch (error) {
    logger.error('addFavorite error', error);
    throw error;
  }
}

export async function removeFavorite(code: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/favorites/${encodeURIComponent(code)}`);
  } catch (error) {
    logger.error('removeFavorite error', error);
    throw error;
  }
}

export async function checkFavorite(code: string): Promise<boolean> {
  try {
    const res = await axiosForBackend.get(
      `/api/favorites/check/${encodeURIComponent(code)}`,
    );
    return Boolean(res.data?.isFavorite);
  } catch (error) {
    logger.error('checkFavorite error', error);
    return false;
  }
}
