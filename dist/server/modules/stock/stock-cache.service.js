"use strict";
var StockCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockCacheService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../database/schema");
let StockCacheService = StockCacheService_1 = class StockCacheService {
    db;
    logger = new common_1.Logger(StockCacheService_1.name);
    constructor(db) {
        this.db = db;
    }
    async searchStocks(q, limit = 20) {
        const lower = q.toLowerCase();
        const results = await this.db
            .select({
            code: schema_1.stockBasic.code,
            name: schema_1.stockBasic.name,
            type: schema_1.stockBasic.type,
        })
            .from(schema_1.stockBasic)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.stockBasic.code, `%${lower}%`), (0, drizzle_orm_1.like)(schema_1.stockBasic.name, `%${q}%`)))
            .limit(limit);
        return { items: results };
    }
    async getStockBasic(code) {
        const rows = await this.db
            .select()
            .from(schema_1.stockBasic)
            .where((0, drizzle_orm_1.eq)(schema_1.stockBasic.code, code))
            .limit(1);
        return rows[0] || null;
    }
    async upsertStockBasic(data) {
        const existing = await this.getStockBasic(data.code);
        if (existing) {
            await this.db
                .update(schema_1.stockBasic)
                .set({
                name: data.name,
                type: data.type || existing.type,
                market: data.market || existing.market,
                industry: data.industry || existing.industry,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.stockBasic.code, data.code));
        }
        else {
            await this.db.insert(schema_1.stockBasic).values({
                code: data.code,
                name: data.name,
                type: data.type || 'stock',
                market: data.market,
                industry: data.industry,
            });
        }
    }
    async batchUpsertStockBasics(items) {
        if (items.length === 0)
            return;
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
                .insert(schema_1.stockBasic)
                .values(values)
                .onConflictDoUpdate({
                target: schema_1.stockBasic.code,
                set: {
                    name: drizzle_orm_1.sql.raw(`EXCLUDED.name`),
                    industry: drizzle_orm_1.sql.raw(`EXCLUDED.industry`),
                },
            });
        }
    }
    async getKlineFromCache(query) {
        const rows = await this.db
            .select()
            .from(schema_1.stockKline)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockKline.code, query.code), (0, drizzle_orm_1.eq)(schema_1.stockKline.period, query.period), (0, drizzle_orm_1.eq)(schema_1.stockKline.adjustFlag, query.adjustFlag)))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.stockKline.tradeDate));
        return rows;
    }
    async batchUpsertKline(items) {
        if (items.length === 0)
            return;
        for (const item of items) {
            const code = item.code;
            const tradeDate = item.date;
            const period = item.frequency || 'd';
            const adjustFlag = parseInt(item.adjustflag || '2', 10);
            const existing = await this.db
                .select({ id: schema_1.stockKline.id })
                .from(schema_1.stockKline)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockKline.code, code), (0, drizzle_orm_1.eq)(schema_1.stockKline.period, period), (0, drizzle_orm_1.eq)(schema_1.stockKline.adjustFlag, adjustFlag), (0, drizzle_orm_1.eq)(schema_1.stockKline.tradeDate, tradeDate)))
                .limit(1);
            const values = {
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
                    .update(schema_1.stockKline)
                    .set(values)
                    .where((0, drizzle_orm_1.eq)(schema_1.stockKline.id, existing[0].id));
            }
            else {
                await this.db.insert(schema_1.stockKline).values([values]);
            }
        }
    }
    async getFinanceFromCache(code, type, year) {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.stockFinance.code, code),
            (0, drizzle_orm_1.eq)(schema_1.stockFinance.reportType, type),
        ];
        if (year) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.stockFinance.reportYear, year));
        }
        const rows = await this.db
            .select()
            .from(schema_1.stockFinance)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.stockFinance.reportYear), (0, drizzle_orm_1.asc)(schema_1.stockFinance.reportQuarter));
        return rows;
    }
    async upsertFinance(data) {
        const existing = await this.db
            .select({ id: schema_1.stockFinance.id })
            .from(schema_1.stockFinance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockFinance.code, data.code), (0, drizzle_orm_1.eq)(schema_1.stockFinance.reportYear, data.reportYear), (0, drizzle_orm_1.eq)(schema_1.stockFinance.reportQuarter, data.reportQuarter), (0, drizzle_orm_1.eq)(schema_1.stockFinance.reportType, data.reportType)))
            .limit(1);
        if (existing.length > 0) {
            await this.db
                .update(schema_1.stockFinance)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema_1.stockFinance.id, existing[0].id));
        }
        else {
            await this.db.insert(schema_1.stockFinance).values(data);
        }
    }
    async getStockList(params) {
        const { industry, sortBy, order = 'desc', page, pageSize } = params;
        const whereConditions = [(0, drizzle_orm_1.eq)(schema_1.stockBasic.type, 'stock')];
        if (industry) {
            whereConditions.push((0, drizzle_orm_1.eq)(schema_1.stockBasic.industry, industry));
        }
        // total count
        const totalResult = await this.db
            .select({ value: (0, drizzle_orm_1.count)() })
            .from(schema_1.stockBasic)
            .where((0, drizzle_orm_1.and)(...whereConditions));
        const total = Number(totalResult[0]?.value ?? 0);
        // basic list
        const basicRows = await this.db
            .select({
            code: schema_1.stockBasic.code,
            name: schema_1.stockBasic.name,
            industry: schema_1.stockBasic.industry,
        })
            .from(schema_1.stockBasic)
            .where((0, drizzle_orm_1.and)(...whereConditions))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.stockBasic.code))
            .limit(pageSize)
            .offset((page - 1) * pageSize);
        const codes = basicRows.map((r) => r.code);
        // batch fetch latest kline (period='d', adjust_flag=2)
        const klineMap = codes.length > 0
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
            items.sort((a, b) => {
                const av = a[sortBy] ?? 0;
                const bv = b[sortBy] ?? 0;
                if (av === bv)
                    return 0;
                return av > bv ? dir : -dir;
            });
        }
        return { items, total, page, pageSize };
    }
    /**
     * Get the latest daily kline for each code in the batch.
     * Uses a subquery approach: max(trade_date) per code, then join back.
     */
    async getLatestKlineBatch(codes, period, adjustFlag) {
        // Subquery: latest trade_date per code
        const latestDates = this.db
            .select({
            code: schema_1.stockKline.code,
            maxDate: (0, drizzle_orm_1.sql) `MAX(${schema_1.stockKline.tradeDate})`.as('max_date'),
        })
            .from(schema_1.stockKline)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.stockKline.code, codes), (0, drizzle_orm_1.eq)(schema_1.stockKline.period, period), (0, drizzle_orm_1.eq)(schema_1.stockKline.adjustFlag, adjustFlag)))
            .groupBy(schema_1.stockKline.code)
            .as('latest_dates');
        const rows = await this.db
            .select({
            code: schema_1.stockKline.code,
            close: schema_1.stockKline.close,
            volume: schema_1.stockKline.volume,
            amount: schema_1.stockKline.amount,
            pctChg: schema_1.stockKline.pctChg,
            turn: schema_1.stockKline.turn,
            peTtm: schema_1.stockKline.peTtm,
            pbMrq: schema_1.stockKline.pbMrq,
        })
            .from(schema_1.stockKline)
            .innerJoin(latestDates, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockKline.code, latestDates.code), (0, drizzle_orm_1.eq)(schema_1.stockKline.tradeDate, latestDates.maxDate)))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.stockKline.code, codes), (0, drizzle_orm_1.eq)(schema_1.stockKline.period, period), (0, drizzle_orm_1.eq)(schema_1.stockKline.adjustFlag, adjustFlag)));
        const map = new Map();
        for (const r of rows) {
            map.set(r.code, r);
        }
        return map;
    }
    async getIndustries() {
        const rows = await this.db
            .select({ industry: schema_1.stockBasic.industry })
            .from(schema_1.stockBasic)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockBasic.type, 'stock')))
            .groupBy(schema_1.stockBasic.industry);
        return {
            items: rows
                .map((r) => r.industry)
                .filter((v) => v && v.trim() !== ''),
        };
    }
};
exports.StockCacheService = StockCacheService;
exports.StockCacheService = StockCacheService = StockCacheService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(fullstack_nestjs_core_1.DRIZZLE_DATABASE)),
    tslib_1.__metadata("design:paramtypes", [Function])
], StockCacheService);
