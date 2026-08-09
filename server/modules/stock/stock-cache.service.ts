import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { asc, desc, eq, and, like, or, inArray, sql, count } from 'drizzle-orm';
import { stockBasic, stockKline, stockFinance } from '../../database/schema';

interface KlineQuery {
  code: string;
  period: 'd' | 'w' | 'm';
  adjustFlag: 1 | 2 | 3;
  startDate: string;
  endDate: string;
}

@Injectable()
export class StockCacheService {
  private readonly logger = new Logger(StockCacheService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async searchStocks(q: string, limit = 20) {
    const lower = q.toLowerCase();
    const results = await this.db
      .select({
        code: stockBasic.code,
        name: stockBasic.name,
        type: stockBasic.type,
      })
      .from(stockBasic)
      .where(
        or(
          like(stockBasic.code, `%${lower}%`),
          like(stockBasic.name, `%${q}%`),
        ),
      )
      .limit(limit);
    return { items: results };
  }

  async getStockBasic(code: string) {
    const rows = await this.db
      .select()
      .from(stockBasic)
      .where(eq(stockBasic.code, code))
      .limit(1);
    return rows[0] || null;
  }

  async upsertStockBasic(data: {
    code: string;
    name: string;
    type?: string;
    market?: string;
    industry?: string;
  }) {
    const existing = await this.getStockBasic(data.code);
    if (existing) {
      await this.db
        .update(stockBasic)
        .set({
          name: data.name,
          type: data.type || existing.type,
          market: data.market || existing.market,
          industry: data.industry || existing.industry,
        })
        .where(eq(stockBasic.code, data.code));
    } else {
      await this.db.insert(stockBasic).values({
        code: data.code,
        name: data.name,
        type: data.type || 'stock',
        market: data.market,
        industry: data.industry,
      });
    }
  }

  async batchUpsertStockBasics(
    items: Array<{
      code: string;
      name: string;
      type?: string;
      industry?: string;
    }>,
  ) {
    if (items.length === 0) return;
    const chunkSize = 500;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const values = chunk.map((item) => ({
        code: item.code,
        name: item.name,
        type: item.type || 'stock',
        industry: item.industry || null,
      }));
      await this.db
        .insert(stockBasic)
        .values(values as any)
        .onConflictDoUpdate({
          target: stockBasic.code,
          set: {
            name: sql.raw(`EXCLUDED.name`),
            industry: sql.raw(`EXCLUDED.industry`),
          },
        });
    }
  }

  async getKlineFromCache(query: KlineQuery) {
    const rows = await this.db
      .select()
      .from(stockKline)
      .where(
        and(
          eq(stockKline.code, query.code),
          eq(stockKline.period, query.period),
          eq(stockKline.adjustFlag, query.adjustFlag),
        ),
      )
      .orderBy(asc(stockKline.tradeDate));
    return rows;
  }

  async batchUpsertKline(items: Array<Record<string, any>>) {
    if (items.length === 0) return;

    for (const item of items) {
      const code = item.code;
      const tradeDate = item.date;
      const period = item.frequency || 'd';
      const adjustFlag = parseInt(item.adjustflag || '2', 10) as 1 | 2 | 3;

      const existing = await this.db
        .select({ id: stockKline.id })
        .from(stockKline)
        .where(
          and(
            eq(stockKline.code, code),
            eq(stockKline.period, period),
            eq(stockKline.adjustFlag, adjustFlag),
            eq(stockKline.tradeDate, tradeDate),
          ),
        )
        .limit(1);

      const values: Record<string, any> = {
        code,
        tradeDate,
        period,
        adjustFlag,
        open: item.open ? Number(item.open) : null,
        high: item.high ? Number(item.high) : null,
        low: item.low ? Number(item.low) : null,
        close: item.close ? Number(item.close) : null,
        volume: item.volume ? String(item.volume) : null,
        amount: item.amount ? Number(item.amount) : null,
        pctChg: item.pctChg ? Number(item.pctChg) : null,
        turn: item.turn ? Number(item.turn) : null,
        peTtm: item.peTTM ? Number(item.peTTM) : null,
        pbMrq: item.pbMRQ ? Number(item.pbMRQ) : null,
      };

      if (existing.length > 0) {
        await this.db
          .update(stockKline)
          .set(values as any)
          .where(eq(stockKline.id, existing[0].id));
      } else {
        await this.db.insert(stockKline).values([values] as any);
      }
    }
  }

  async getFinanceFromCache(
    code: string,
    type: string,
    year?: number,
  ) {
    const conditions = [
      eq(stockFinance.code, code),
      eq(stockFinance.reportType, type),
    ];
    if (year) {
      conditions.push(eq(stockFinance.reportYear, year));
    }

    const rows = await this.db
      .select()
      .from(stockFinance)
      .where(and(...conditions))
      .orderBy(desc(stockFinance.reportYear), asc(stockFinance.reportQuarter));
    return rows;
  }

  async upsertFinance(data: {
    code: string;
    reportYear: number;
    reportQuarter: number;
    reportType: string;
    [key: string]: any;
  }) {
    const existing = await this.db
      .select({ id: stockFinance.id })
      .from(stockFinance)
      .where(
        and(
          eq(stockFinance.code, data.code),
          eq(stockFinance.reportYear, data.reportYear),
          eq(stockFinance.reportQuarter, data.reportQuarter),
          eq(stockFinance.reportType, data.reportType),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(stockFinance)
        .set(data as any)
        .where(eq(stockFinance.id, existing[0].id));
    } else {
      await this.db.insert(stockFinance).values(data as any);
    }
  }

  async getStockList(params: {
    industry?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    page: number;
    pageSize: number;
  }) {
    const { industry, sortBy, order = 'desc', page, pageSize } = params;

    const whereConditions: any[] = [eq(stockBasic.type, 'stock')];
    if (industry) {
      whereConditions.push(eq(stockBasic.industry, industry));
    }

    // total count
    const totalResult = await this.db
      .select({ value: count() })
      .from(stockBasic)
      .where(and(...whereConditions));
    const total = Number(totalResult[0]?.value ?? 0);

    // basic list
    const basicRows = await this.db
      .select({
        code: stockBasic.code,
        name: stockBasic.name,
        industry: stockBasic.industry,
      })
      .from(stockBasic)
      .where(and(...whereConditions))
      .orderBy(asc(stockBasic.code))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const codes: string[] = basicRows.map((r) => r.code);

    // batch fetch latest kline (period='d', adjust_flag=2)
    const klineMap =
      codes.length > 0
        ? await this.getLatestKlineBatch(codes, 'd', 2)
        : new Map();

    // merge
    const items = basicRows.map((b) => {
      const k = klineMap.get(b.code);
      const close = k?.close ? Number(k.close) : 0;
      const pctChg = k?.pctChg ? Number(k.pctChg) : 0;
      const preClose = close && pctChg !== 0 ? close / (1 + pctChg / 100) : 0;
      const change = preClose ? close - preClose : 0;
      return {
        code: b.code,
        name: b.name,
        industry: b.industry ?? '',
        close,
        pctChg,
        change: Number(change.toFixed(4)),
        volume: k?.volume ? Number(k.volume) : 0,
        amount: k?.amount ? Number(k.amount) : 0,
        peTTM: k?.peTtm ? Number(k.peTtm) : undefined,
        pbMRQ: k?.pbMrq ? Number(k.pbMrq) : undefined,
        turn: k?.turn ? Number(k.turn) : undefined,
      };
    });

    // sort in memory when sortBy references kline fields
    const klineFields = ['pctChg', 'volume', 'amount', 'peTTM', 'pbMRQ', 'turn'];
    if (sortBy && klineFields.includes(sortBy)) {
      const dir = order === 'asc' ? 1 : -1;
      items.sort((a: any, b: any) => {
        const av = a[sortBy] ?? 0;
        const bv = b[sortBy] ?? 0;
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
      });
    }

    return { items, total, page, pageSize };
  }

  /**
   * Get the latest daily kline for each code in the batch.
   * Uses a subquery approach: max(trade_date) per code, then join back.
   */
  private async getLatestKlineBatch(
    codes: string[],
    period: 'd' | 'w' | 'm',
    adjustFlag: 1 | 2 | 3,
  ) {
    // Subquery: latest trade_date per code
    const latestDates = this.db
      .select({
        code: stockKline.code,
        maxDate: sql<Date>`MAX(${stockKline.tradeDate})`.as('max_date'),
      })
      .from(stockKline)
      .where(
        and(
          inArray(stockKline.code, codes),
          eq(stockKline.period, period),
          eq(stockKline.adjustFlag, adjustFlag),
        ),
      )
      .groupBy(stockKline.code)
      .as('latest_dates');

    const rows = await this.db
      .select({
        code: stockKline.code,
        close: stockKline.close,
        volume: stockKline.volume,
        amount: stockKline.amount,
        pctChg: stockKline.pctChg,
        turn: stockKline.turn,
        peTtm: stockKline.peTtm,
        pbMrq: stockKline.pbMrq,
      })
      .from(stockKline)
      .innerJoin(
        latestDates,
        and(
          eq(stockKline.code, latestDates.code),
          eq(stockKline.tradeDate, latestDates.maxDate),
        ),
      )
      .where(
        and(
          inArray(stockKline.code, codes),
          eq(stockKline.period, period),
          eq(stockKline.adjustFlag, adjustFlag),
        ),
      );

    const map = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
      map.set(r.code, r);
    }
    return map;
  }

  async getIndustries() {
    const rows = await this.db
      .select({ industry: stockBasic.industry })
      .from(stockBasic)
      .where(and(eq(stockBasic.type, 'stock')))
      .groupBy(stockBasic.industry);
    return {
      items: rows
        .map((r: any) => r.industry)
        .filter((v: string) => v && v.trim() !== ''),
    };
  }
}
