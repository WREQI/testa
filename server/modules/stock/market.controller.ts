import { Controller, Get } from '@nestjs/common';
import { StockService } from '../stock/stock.service';

@Controller('api/market')
export class MarketController {
  constructor(private readonly stockService: StockService) {}

  @Get('indices')
  async indices() {
    return this.stockService.getIndices();
  }
}
