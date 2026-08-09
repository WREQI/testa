import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TradingService } from './trading.service';
import type {
  TradingAccount,
  PositionItem,
  OrderItem,
  TradeRequest,
  TradeResult,
} from '@shared/api.interface';

@Controller('api/trading')
@UseGuards(JwtAuthGuard)
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Get('account')
  async account(@Req() req: any): Promise<TradingAccount> {
    return this.tradingService.getAccount(req.userId);
  }

  @Get('positions')
  async positions(@Req() req: any): Promise<PositionItem[]> {
    return this.tradingService.getPositions(req.userId);
  }

  @Get('orders')
  async orders(@Req() req: any): Promise<OrderItem[]> {
    return this.tradingService.getOrders(req.userId);
  }

  @Post('trade')
  async trade(
    @Req() req: any,
    @Body() body: TradeRequest,
  ): Promise<TradeResult> {
    return this.tradingService.trade(req.userId, body);
  }
}
