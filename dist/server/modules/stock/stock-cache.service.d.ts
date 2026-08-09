import { type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
interface KlineQuery {
    code: string;
    period: 'd' | 'w' | 'm';
    adjustFlag: 1 | 2 | 3;
    startDate: string;
    endDate: string;
}
export declare class StockCacheService {
    private readonly db;
    private readonly logger;
    constructor(db: PostgresJsDatabase);
    searchStocks(q: string, limit?: number): Promise<{
        items: {
            code: string;
            name: string;
            type: string;
        }[];
    }>;
    getStockBasic(code: string): Promise<{
        id: string;
        code: string;
        name: string;
        type: string;
        market: string;
        industry: string;
        listStatus: string;
        lastSyncDate: string;
        createdAt: Date;
        createdBy: string;
        updatedAt: Date;
        updatedBy: string;
    }>;
    upsertStockBasic(data: {
        code: string;
        name: string;
        type?: string;
        market?: string;
        industry?: string;
    }): Promise<void>;
    batchUpsertStockBasics(items: Array<{
        code: string;
        name: string;
        type?: string;
        industry?: string;
    }>): Promise<void>;
    getKlineFromCache(query: KlineQuery): Promise<{
        id: string;
        code: string;
        tradeDate: string;
        period: string;
        adjustFlag: number;
        open: string;
        high: string;
        low: string;
        close: string;
        volume: number;
        amount: string;
        pctChg: string;
        turn: string;
        peTtm: string;
        pbMrq: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    batchUpsertKline(items: Array<Record<string, any>>): Promise<void>;
    getFinanceFromCache(code: string, type: string, year?: number): Promise<{
        id: string;
        code: string;
        reportYear: number;
        reportQuarter: number;
        reportType: string;
        roe: string;
        grossMargin: string;
        netMargin: string;
        totalAssetTurnover: string;
        inventoryTurnover: string;
        revenueGrowth: string;
        netProfitGrowth: string;
        dupontRoe: string;
        dupontAssetTurnover: string;
        dupontEquityMultiplier: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    upsertFinance(data: {
        code: string;
        reportYear: number;
        reportQuarter: number;
        reportType: string;
        [key: string]: any;
    }): Promise<void>;
    getStockList(params: {
        industry?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
        page: number;
        pageSize: number;
    }): Promise<{
        items: {
            code: string;
            name: string;
            industry: string;
            close: number;
            pctChg: number;
            change: number;
            volume: number;
            amount: number;
            peTTM: number;
            pbMRQ: number;
            turn: number;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    /**
     * Get the latest daily kline for each code in the batch.
     * Uses a subquery approach: max(trade_date) per code, then join back.
     */
    private getLatestKlineBatch;
    getIndustries(): Promise<{
        items: any[];
    }>;
}
export {};
