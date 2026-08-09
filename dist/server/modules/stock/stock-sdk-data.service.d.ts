export interface KlineRawRow {
    date: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    amount?: string;
    preclose?: string;
    pctChg?: string;
    turn?: string;
}
export interface StockBasicRow {
    code: string;
    code_name: string;
    tradeStatus?: string;
    industry?: string;
}
export interface RealtimeQuoteRow {
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
    turn?: number;
    updateTime?: string;
}
export declare class StockSdkDataService {
    private readonly logger;
    private stockSdkInstance;
    constructor();
    private getSdk;
    fetchQuotes(codes: string[]): Promise<{
        items: RealtimeQuoteRow[];
    }>;
    private mapSdkQuote;
    private mockQuote;
    fetchKline(params: {
        code: string;
        start_date: string;
        end_date: string;
        frequency: 'd' | 'w' | 'm';
        adjustflag: 1 | 2 | 3;
    }): Promise<{
        items: KlineRawRow[];
    }>;
    private mapSdkKline;
    private softFallbackKline;
    fetchAllStockList(): Promise<{
        items: StockBasicRow[];
    }>;
    private addToListFromSearch;
    private augmentWithHotPool;
    private builtinStockList;
    fetchIndustryList(): Promise<{
        items: StockBasicRow[];
    }>;
    fetchFinance(type: 'profit' | 'operation' | 'growth' | 'dupont', code: string, year: number, quarter: number): Promise<{
        items: any[];
    }>;
}
