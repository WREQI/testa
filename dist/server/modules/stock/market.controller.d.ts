import { StockService } from '../stock/stock.service';
export declare class MarketController {
    private readonly stockService;
    constructor(stockService: StockService);
    indices(): Promise<{
        items: import("../../../shared/api.interface").IndexQuote[];
    }>;
}
