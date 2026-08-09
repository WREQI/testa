import { type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import type { TradingAccount, PositionItem, OrderItem, TradeRequest, TradeResult } from '@shared/api.interface';
export declare class TradingService {
    private readonly db;
    private readonly logger;
    constructor(db: PostgresJsDatabase);
    ensureAccount(userId: string): Promise<{
        id: string;
        userId: string;
        totalAssets: string;
        availableCash: string;
    }>;
    getAccount(userId: string): Promise<TradingAccount>;
    getPositions(userId: string): Promise<PositionItem[]>;
    getOrders(userId: string, limit?: number): Promise<OrderItem[]>;
    trade(userId: string, req: TradeRequest): Promise<TradeResult>;
    private getLatestQuote;
}
