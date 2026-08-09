import { StockService } from './stock.service';
import type { GridSimulateRequest } from '@shared/api.interface';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    search(q: string, limit?: string): Promise<{
        items: {
            code: string;
            name: string;
            type: string;
        }[];
    }>;
    hot(): Promise<{
        items: import("@shared/api.interface").HotStock[];
    }>;
    industries(): Promise<{
        items: any[];
    }>;
    list(industry?: string, sortBy?: string, order?: 'asc' | 'desc', page?: string, pageSize?: string): Promise<{
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
    kline(code: string, period: 'd' | 'w' | 'm', adjust: '1' | '2' | '3', startDate: string, endDate: string): Promise<{
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
    quote(code: string): Promise<{
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
    finance(code: string, type?: string, year?: string): Promise<{
        code: string;
        type: string;
        items: any[];
    } | {
        code: string;
        type: import("@shared/api.interface").FinanceType;
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
    gridSimulate(code: string, body: GridSimulateRequest): Promise<import("@shared/api.interface").GridSimulateResult>;
}
