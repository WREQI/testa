import { TradingService } from './trading.service';
import type { TradingAccount, PositionItem, OrderItem, TradeRequest, TradeResult } from '@shared/api.interface';
export declare class TradingController {
    private readonly tradingService;
    constructor(tradingService: TradingService);
    account(req: any): Promise<TradingAccount>;
    positions(req: any): Promise<PositionItem[]>;
    orders(req: any): Promise<OrderItem[]>;
    trade(req: any, body: TradeRequest): Promise<TradeResult>;
}
