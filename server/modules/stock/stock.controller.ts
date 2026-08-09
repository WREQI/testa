import { Controller, Get, Param, Query, NotFoundException, Post, Body } from '@nestjs/common';
import { StockService } from './stock.service';
import type { GridSimulateRequest } from '@shared/api.interface';

@Controller('api/stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.stockService.search(q, limitNum);
  }

  @Get('hot')
  async hot() {
    return this.stockService.getHotStocks();
  }

  @Get('industries')
  async industries() {
    return this.stockService.getIndustries();
  }

  @Get()
  async list(
    @Query('industry') industry?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    return this.stockService.getStockList({
      industry,
      sortBy,
      order,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }

  @Get(':code/kline')
  async kline(
    @Param('code') code: string,
    @Query('period') period: 'd' | 'w' | 'm' = 'd',
    @Query('adjust') adjust: '1' | '2' | '3' = '2',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.stockService.getKline(
      code,
      period,
      parseInt(adjust, 10) as 1 | 2 | 3,
      startDate,
      endDate,
    );
  }

  @Get(':code/quote')
  async quote(@Param('code') code: string) {
    const data = await this.stockService.getQuote(code);
    if (!data) throw new NotFoundException('行情数据不存在');
    return data;
  }

  @Get(':code/finance')
  async finance(
    @Param('code') code: string,
    @Query('type') type: string = 'profit',
    @Query('year') year?: string,
  ) {
    return this.stockService.getFinance(
      code,
      type,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Post(':code/grid-simulate')
  async gridSimulate(
    @Param('code') code: string,
    @Body() body: GridSimulateRequest,
  ) {
    return this.stockService.simulateGrid(code, body);
  }
}
