import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import {
  tradingAccount,
  tradingPosition,
  tradingOrder,
  stockKline,
} from '@server/database/schema';
import type {
  TradingAccount,
  PositionItem,
  OrderItem,
  TradeRequest,
  TradeResult,
} from '@shared/api.interface';

const COMMISSION_RATE = 0.00025;
const MIN_COMMISSION = 5;
const STAMP_DUTY_RATE = 0.001;
const TRANSFER_FEE_RATE = 0.00001;
const INITIAL_CASH = 1000000;

function calcFees(
  amount: number,
  direction: 'buy' | 'sell',
): { commission: number; stampTax: number; transferFee: number } {
  const commission = Math.max(amount * COMMISSION_RATE, MIN_COMMISSION);
  const stampTax = direction === 'sell' ? amount * STAMP_DUTY_RATE : 0;
  const transferFee = amount * TRANSFER_FEE_RATE;
  return {
    commission: Math.round(commission * 100) / 100,
    stampTax: Math.round(stampTax * 100) / 100,
    transferFee: Math.round(transferFee * 100) / 100,
  };
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v) || 0;
}

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async ensureAccount(userId: string) {
    const rows = await this.db
      .select({
        id: tradingAccount.id,
        userId: tradingAccount.userId,
        totalAssets: tradingAccount.totalAssets,
        availableCash: tradingAccount.availableCash,
      })
      .from(tradingAccount)
      .where(eq(tradingAccount.userId, sql`${userId}::uuid`))
      .limit(1);
    if (rows.length > 0) return rows[0];

    const [created] = await this.db
      .insert(tradingAccount)
      .values({
        userId: sql`${userId}::uuid`,
        totalAssets: String(INITIAL_CASH),
        availableCash: String(INITIAL_CASH),
      })
      .returning({
        id: tradingAccount.id,
        userId: tradingAccount.userId,
        totalAssets: tradingAccount.totalAssets,
        availableCash: tradingAccount.availableCash,
      });
    return created;
  }

  async getAccount(userId: string): Promise<TradingAccount> {
    const account = await this.ensureAccount(userId);

    const positions = await this.db
      .select({
        stockCode: tradingPosition.stockCode,
        stockName: tradingPosition.stockName,
        quantity: tradingPosition.quantity,
        avgCost: tradingPosition.avgCost,
      })
      .from(tradingPosition)
      .where(eq(tradingPosition.userId, sql`${userId}::uuid`));

    let marketValue = 0;
    let todayProfit = 0;
    let positionProfit = 0;
    let costValue = 0;

    for (const pos of positions) {
      if (!pos.quantity || pos.quantity <= 0) continue;
      const latest = await this.getLatestQuote(pos.stockCode);
      const currentPrice = latest?.close ?? num(pos.avgCost);
      const preClose = latest?.preClose ?? currentPrice;
      const value = currentPrice * pos.quantity;
      marketValue += value;
      costValue += num(pos.avgCost) * pos.quantity;
      todayProfit += (currentPrice - preClose) * pos.quantity;
      positionProfit += (currentPrice - num(pos.avgCost)) * pos.quantity;
    }

    const availableCash = num(account.availableCash);
    const totalAssets = availableCash + marketValue;
    const positionPct = costValue > 0 ? (positionProfit / costValue) * 100 : 0;
    const prevAssets = totalAssets - todayProfit;
    const todayPct = prevAssets > 0 ? (todayProfit / prevAssets) * 100 : 0;

    return {
      totalAssets: Math.round(totalAssets * 100) / 100,
      availableCash: Math.round(availableCash * 100) / 100,
      marketValue: Math.round(marketValue * 100) / 100,
      todayProfit: Math.round(todayProfit * 100) / 100,
      todayPct: Math.round(todayPct * 100) / 100,
      positionProfit: Math.round(positionProfit * 100) / 100,
      positionPct: Math.round(positionPct * 100) / 100,
    };
  }

  async getPositions(userId: string): Promise<PositionItem[]> {
    const positions = await this.db
      .select({
        stockCode: tradingPosition.stockCode,
        stockName: tradingPosition.stockName,
        quantity: tradingPosition.quantity,
        avgCost: tradingPosition.avgCost,
        updatedAt: tradingPosition.updatedAt,
      })
      .from(tradingPosition)
      .where(eq(tradingPosition.userId, sql`${userId}::uuid`))
      .orderBy(desc(tradingPosition.updatedAt));

    const items: PositionItem[] = [];
    for (const pos of positions) {
      if (!pos.quantity || pos.quantity <= 0) continue;
      const latest = await this.getLatestQuote(pos.stockCode);
      const avgCost = num(pos.avgCost);
      const currentPrice = latest?.close ?? avgCost;
      const preClose = latest?.preClose ?? currentPrice;
      const marketValue = currentPrice * pos.quantity;
      const profit = (currentPrice - avgCost) * pos.quantity;
      const profitPct = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;
      const todayProfit = (currentPrice - preClose) * pos.quantity;
      const todayPct = preClose > 0 ? ((currentPrice - preClose) / preClose) * 100 : 0;

      items.push({
        stockCode: pos.stockCode,
        stockName: pos.stockName,
        quantity: pos.quantity,
        avgCost,
        currentPrice,
        marketValue: Math.round(marketValue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        profitPct: Math.round(profitPct * 100) / 100,
        todayProfit: Math.round(todayProfit * 100) / 100,
        todayPct: Math.round(todayPct * 100) / 100,
      });
    }
    return items.sort((a, b) => b.marketValue - a.marketValue);
  }

  async getOrders(userId: string, limit = 50): Promise<OrderItem[]> {
    const rows = await this.db
      .select({
        id: tradingOrder.id,
        stockCode: tradingOrder.stockCode,
        stockName: tradingOrder.stockName,
        direction: tradingOrder.direction,
        price: tradingOrder.price,
        quantity: tradingOrder.quantity,
        amount: tradingOrder.amount,
        commission: tradingOrder.commission,
        stampTax: tradingOrder.stampTax,
        transferFee: tradingOrder.transferFee,
        status: tradingOrder.status,
        createdAt: tradingOrder.createdAt,
      })
      .from(tradingOrder)
      .where(eq(tradingOrder.userId, sql`${userId}::uuid`))
      .orderBy(desc(tradingOrder.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      stockCode: row.stockCode,
      stockName: row.stockName,
      direction: row.direction as 'buy' | 'sell',
      price: num(row.price),
      quantity: row.quantity,
      amount: num(row.amount),
      commission: num(row.commission),
      stampTax: num(row.stampTax),
      transferFee: num(row.transferFee),
      status: row.status,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    }));
  }

  async trade(userId: string, req: TradeRequest): Promise<TradeResult> {
    if (!req.stockCode || !req.stockName) {
      throw new BadRequestException('股票代码和名称不能为空');
    }
    if (!req.price || req.price <= 0) {
      throw new BadRequestException('价格无效');
    }
    if (!req.quantity || req.quantity <= 0 || req.quantity % 100 !== 0) {
      throw new BadRequestException('数量必须为100的整数倍');
    }

    const amount = req.price * req.quantity;
    const fees = calcFees(amount, req.direction);
    const totalCost = amount + fees.commission + fees.stampTax + fees.transferFee;
    const netProceeds = amount - fees.commission - fees.stampTax - fees.transferFee;

    return this.db.transaction(async (tx) => {
      const accountRows = await tx
        .select({
          id: tradingAccount.id,
          availableCash: tradingAccount.availableCash,
        })
        .from(tradingAccount)
        .where(eq(tradingAccount.userId, sql`${userId}::uuid`))
        .limit(1)
        .for('update');

      let account = accountRows[0];
      if (!account) {
        const [created] = await tx
          .insert(tradingAccount)
          .values({
            userId: sql`${userId}::uuid`,
            totalAssets: String(INITIAL_CASH),
            availableCash: String(INITIAL_CASH),
          })
          .returning({
            id: tradingAccount.id,
            availableCash: tradingAccount.availableCash,
          });
        account = created;
      }

      const availableCash = num(account.availableCash);

      if (req.direction === 'buy') {
        if (availableCash < totalCost) {
          throw new BadRequestException('可用资金不足');
        }
        await tx
          .update(tradingAccount)
          .set({
            availableCash: sql`${tradingAccount.availableCash}::numeric - ${totalCost}`,
          })
          .where(eq(tradingAccount.userId, sql`${userId}::uuid`));

        const posRows = await tx
          .select({
            id: tradingPosition.id,
            quantity: tradingPosition.quantity,
            avgCost: tradingPosition.avgCost,
          })
          .from(tradingPosition)
          .where(
            and(
              eq(tradingPosition.userId, sql`${userId}::uuid`),
              eq(tradingPosition.stockCode, req.stockCode),
            ),
          )
          .limit(1)
          .for('update');

        if (posRows.length > 0) {
          const pos = posRows[0];
          const newQty = pos.quantity + req.quantity;
          const totalCostBasis = num(pos.avgCost) * pos.quantity + amount;
          const newAvgCost = totalCostBasis / newQty;
          await tx
            .update(tradingPosition)
            .set({
              quantity: newQty,
              avgCost: String(Math.round(newAvgCost * 10000) / 10000),
              stockName: req.stockName,
            })
            .where(eq(tradingPosition.id, pos.id));
        } else {
          await tx.insert(tradingPosition).values({
            userId: sql`${userId}::uuid`,
            stockCode: req.stockCode,
            stockName: req.stockName,
            quantity: req.quantity,
            avgCost: String(req.price),
          });
        }
      } else {
        const posRows = await tx
          .select({
            id: tradingPosition.id,
            quantity: tradingPosition.quantity,
          })
          .from(tradingPosition)
          .where(
            and(
              eq(tradingPosition.userId, sql`${userId}::uuid`),
              eq(tradingPosition.stockCode, req.stockCode),
            ),
          )
          .limit(1)
          .for('update');

        if (posRows.length === 0 || posRows[0].quantity < req.quantity) {
          throw new BadRequestException('持仓不足');
        }

        const pos = posRows[0];
        const newQty = pos.quantity - req.quantity;
        if (newQty === 0) {
          await tx.delete(tradingPosition).where(eq(tradingPosition.id, pos.id));
        } else {
          await tx
            .update(tradingPosition)
            .set({ quantity: newQty })
            .where(eq(tradingPosition.id, pos.id));
        }

        await tx
          .update(tradingAccount)
          .set({
            availableCash: sql`${tradingAccount.availableCash}::numeric + ${netProceeds}`,
          })
          .where(eq(tradingAccount.userId, sql`${userId}::uuid`));
      }

      const [order] = await tx
        .insert(tradingOrder)
        .values({
          userId: sql`${userId}::uuid`,
          stockCode: req.stockCode,
          stockName: req.stockName,
          direction: req.direction,
          price: String(req.price),
          quantity: req.quantity,
          amount: String(amount),
          commission: String(fees.commission),
          stampTax: String(fees.stampTax),
          transferFee: String(fees.transferFee),
          status: 'filled',
        })
        .returning({ id: tradingOrder.id });

      return { success: true, orderId: order.id };
    });
  }

  private async getLatestQuote(code: string): Promise<{ close: number; preClose: number } | null> {
    const rows = await this.db
      .select({ close: stockKline.close, pctChg: stockKline.pctChg })
      .from(stockKline)
      .where(
        and(
          eq(stockKline.code, code),
          eq(stockKline.period, 'd'),
          eq(stockKline.adjustFlag, 2 as unknown as number),
        ),
      )
      .orderBy(desc(stockKline.tradeDate))
      .limit(1);

    if (rows.length === 0) return null;
    const close = num(rows[0].close);
    const pctChg = num(rows[0].pctChg);
    const preClose = pctChg !== 0 ? close / (1 + pctChg / 100) : close;
    return { close, preClose };
  }
}
