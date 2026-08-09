import { type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { StockCacheService } from './stock-cache.service';
import { StockSdkDataService } from './stock-sdk-data.service';
import { GridSimulationService } from './grid-simulation.service';
import type { HotStock, IndexQuote, FinanceType, GridSimulateRequest } from '@shared/api.interface';
export declare class StockService {
    private readonly cache;
    private readonly dataSource;
    private readonly gridSim;
    private readonly db;
    private readonly logger;
    constructor(cache: StockCacheService, dataSource: StockSdkDataService, gridSim: GridSimulationService, db: PostgresJsDatabase);
    private syncInProgress;
    private lastSyncDate;
    private industrySyncInProgress;
    private lastIndustrySyncDate;
    search(q: string, limit?: number): Promise<{
        items: {
            code: string;
            name: string;
            type: string;
        }[];
    }>;
    getHotStocks(): Promise<{
        items: HotStock[];
    }>;
    getIndices(): Promise<{
        items: IndexQuote[];
    }>;
    getKline(code: string, period: 'd' | 'w' | 'm', adjust: 1 | 2 | 3, startDate: string, endDate: string): Promise<{
        code: string;
        name: string;
        items: {
            date: string;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
            amount: number;
            pctChg: number;
            turn: number;
            peTTM: number;
            pbMRQ: number;
        }[];
    }>;
    private isIndexCode;
    private generateMockIndexKline;
    getQuote(code: string): Promise<{
        code: string;
        name: string;
        close: number;
        change: number;
        pctChg: number;
        open: number;
        high: number;
        low: number;
        preClose: number;
        volume: number;
        amount: number;
        turn: number;
        peTTM: number;
        pbMRQ: number;
        updateTime: any;
    }>;
    private buildQuote;
    getFinance(code: string, type: string, year?: number): Promise<{
        code: string;
        type: string;
        items: any[];
    } | {
        code: string;
        type: FinanceType;
        items: {
            year: number;
            quarter: number;
            roe: number;
            grossMargin: number;
            netMargin: number;
            totalAssetTurnover: number;
            inventoryTurnover: number;
            revenueGrowth: number;
            netProfitGrowth: number;
            dupontRoe: number;
            dupontAssetTurnover: number;
            dupontEquityMultiplier: number;
        }[];
    }>;
    private serializeRows;
    simulateGrid(code: string, params: GridSimulateRequest): Promise<import("@shared/api.interface").GridSimulateResult>;
    private serializeKlines;
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
    getIndustries(): Promise<{
        items: any[];
    }>;
    private ensureStockListSynced;
    private ensureIndustrySynced;
    private syncStockList;
    private importStockList;
    private syncIndustryData;
    private simplifyIndustry;
    private getLatestKlines;
    private calcChange;
}
