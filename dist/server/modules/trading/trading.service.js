"use strict";
var TradingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const schema_1 = require("../../database/schema");
const COMMISSION_RATE = 0.00025;
const MIN_COMMISSION = 5;
const STAMP_DUTY_RATE = 0.001;
const TRANSFER_FEE_RATE = 0.00001;
const INITIAL_CASH = 1000000;
function calcFees(amount, direction) {
    const commission = Math.max(amount * COMMISSION_RATE, MIN_COMMISSION);
    const stampTax = direction === 'sell' ? amount * STAMP_DUTY_RATE : 0;
    const transferFee = amount * TRANSFER_FEE_RATE;
    return {
        commission: Math.round(commission * 100) / 100,
        stampTax: Math.round(stampTax * 100) / 100,
        transferFee: Math.round(transferFee * 100) / 100,
    };
}
function num(v) {
    if (v == null)
        return 0;
    if (typeof v === 'number')
        return v;
    return Number(v) || 0;
}
let TradingService = TradingService_1 = class TradingService {
    db;
    logger = new common_1.Logger(TradingService_1.name);
    constructor(db) {
        this.db = db;
    }
    async ensureAccount(userId) {
        const rows = await this.db
            .select({
            id: schema_1.tradingAccount.id,
            userId: schema_1.tradingAccount.userId,
            totalAssets: schema_1.tradingAccount.totalAssets,
            availableCash: schema_1.tradingAccount.availableCash,
        })
            .from(schema_1.tradingAccount)
            .where((0, drizzle_orm_1.eq)(schema_1.tradingAccount.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`))
            .limit(1);
        if (rows.length > 0)
            return rows[0];
        const [created] = await this.db
            .insert(schema_1.tradingAccount)
            .values({
            userId: (0, drizzle_orm_1.sql) `${userId}::uuid`,
            totalAssets: String(INITIAL_CASH),
            availableCash: String(INITIAL_CASH),
        })
            .returning({
            id: schema_1.tradingAccount.id,
            userId: schema_1.tradingAccount.userId,
            totalAssets: schema_1.tradingAccount.totalAssets,
            availableCash: schema_1.tradingAccount.availableCash,
        });
        return created;
    }
    async getAccount(userId) {
        const account = await this.ensureAccount(userId);
        const positions = await this.db
            .select({
            stockCode: schema_1.tradingPosition.stockCode,
            stockName: schema_1.tradingPosition.stockName,
            quantity: schema_1.tradingPosition.quantity,
            avgCost: schema_1.tradingPosition.avgCost,
        })
            .from(schema_1.tradingPosition)
            .where((0, drizzle_orm_1.eq)(schema_1.tradingPosition.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`));
        let marketValue = 0;
        let todayProfit = 0;
        let positionProfit = 0;
        let costValue = 0;
        for (const pos of positions) {
            if (!pos.quantity || pos.quantity <= 0)
                continue;
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
    async getPositions(userId) {
        const positions = await this.db
            .select({
            stockCode: schema_1.tradingPosition.stockCode,
            stockName: schema_1.tradingPosition.stockName,
            quantity: schema_1.tradingPosition.quantity,
            avgCost: schema_1.tradingPosition.avgCost,
            updatedAt: schema_1.tradingPosition.updatedAt,
        })
            .from(schema_1.tradingPosition)
            .where((0, drizzle_orm_1.eq)(schema_1.tradingPosition.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tradingPosition.updatedAt));
        const items = [];
        for (const pos of positions) {
            if (!pos.quantity || pos.quantity <= 0)
                continue;
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
    async getOrders(userId, limit = 50) {
        const rows = await this.db
            .select({
            id: schema_1.tradingOrder.id,
            stockCode: schema_1.tradingOrder.stockCode,
            stockName: schema_1.tradingOrder.stockName,
            direction: schema_1.tradingOrder.direction,
            price: schema_1.tradingOrder.price,
            quantity: schema_1.tradingOrder.quantity,
            amount: schema_1.tradingOrder.amount,
            commission: schema_1.tradingOrder.commission,
            stampTax: schema_1.tradingOrder.stampTax,
            transferFee: schema_1.tradingOrder.transferFee,
            status: schema_1.tradingOrder.status,
            createdAt: schema_1.tradingOrder.createdAt,
        })
            .from(schema_1.tradingOrder)
            .where((0, drizzle_orm_1.eq)(schema_1.tradingOrder.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tradingOrder.createdAt))
            .limit(limit);
        return rows.map((row) => ({
            id: row.id,
            stockCode: row.stockCode,
            stockName: row.stockName,
            direction: row.direction,
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
    async trade(userId, req) {
        if (!req.stockCode || !req.stockName) {
            throw new common_1.BadRequestException('股票代码和名称不能为空');
        }
        if (!req.price || req.price <= 0) {
            throw new common_1.BadRequestException('价格无效');
        }
        if (!req.quantity || req.quantity <= 0 || req.quantity % 100 !== 0) {
            throw new common_1.BadRequestException('数量必须为100的整数倍');
        }
        const amount = req.price * req.quantity;
        const fees = calcFees(amount, req.direction);
        const totalCost = amount + fees.commission + fees.stampTax + fees.transferFee;
        const netProceeds = amount - fees.commission - fees.stampTax - fees.transferFee;
        return this.db.transaction(async (tx) => {
            const accountRows = await tx
                .select({
                id: schema_1.tradingAccount.id,
                availableCash: schema_1.tradingAccount.availableCash,
            })
                .from(schema_1.tradingAccount)
                .where((0, drizzle_orm_1.eq)(schema_1.tradingAccount.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`))
                .limit(1)
                .for('update');
            let account = accountRows[0];
            if (!account) {
                const [created] = await tx
                    .insert(schema_1.tradingAccount)
                    .values({
                    userId: (0, drizzle_orm_1.sql) `${userId}::uuid`,
                    totalAssets: String(INITIAL_CASH),
                    availableCash: String(INITIAL_CASH),
                })
                    .returning({
                    id: schema_1.tradingAccount.id,
                    availableCash: schema_1.tradingAccount.availableCash,
                });
                account = created;
            }
            const availableCash = num(account.availableCash);
            if (req.direction === 'buy') {
                if (availableCash < totalCost) {
                    throw new common_1.BadRequestException('可用资金不足');
                }
                await tx
                    .update(schema_1.tradingAccount)
                    .set({
                    availableCash: (0, drizzle_orm_1.sql) `${schema_1.tradingAccount.availableCash}::numeric - ${totalCost}`,
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.tradingAccount.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`));
                const posRows = await tx
                    .select({
                    id: schema_1.tradingPosition.id,
                    quantity: schema_1.tradingPosition.quantity,
                    avgCost: schema_1.tradingPosition.avgCost,
                })
                    .from(schema_1.tradingPosition)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tradingPosition.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`), (0, drizzle_orm_1.eq)(schema_1.tradingPosition.stockCode, req.stockCode)))
                    .limit(1)
                    .for('update');
                if (posRows.length > 0) {
                    const pos = posRows[0];
                    const newQty = pos.quantity + req.quantity;
                    const totalCostBasis = num(pos.avgCost) * pos.quantity + amount;
                    const newAvgCost = totalCostBasis / newQty;
                    await tx
                        .update(schema_1.tradingPosition)
                        .set({
                        quantity: newQty,
                        avgCost: String(Math.round(newAvgCost * 10000) / 10000),
                        stockName: req.stockName,
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.tradingPosition.id, pos.id));
                }
                else {
                    await tx.insert(schema_1.tradingPosition).values({
                        userId: (0, drizzle_orm_1.sql) `${userId}::uuid`,
                        stockCode: req.stockCode,
                        stockName: req.stockName,
                        quantity: req.quantity,
                        avgCost: String(req.price),
                    });
                }
            }
            else {
                const posRows = await tx
                    .select({
                    id: schema_1.tradingPosition.id,
                    quantity: schema_1.tradingPosition.quantity,
                })
                    .from(schema_1.tradingPosition)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tradingPosition.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`), (0, drizzle_orm_1.eq)(schema_1.tradingPosition.stockCode, req.stockCode)))
                    .limit(1)
                    .for('update');
                if (posRows.length === 0 || posRows[0].quantity < req.quantity) {
                    throw new common_1.BadRequestException('持仓不足');
                }
                const pos = posRows[0];
                const newQty = pos.quantity - req.quantity;
                if (newQty === 0) {
                    await tx.delete(schema_1.tradingPosition).where((0, drizzle_orm_1.eq)(schema_1.tradingPosition.id, pos.id));
                }
                else {
                    await tx
                        .update(schema_1.tradingPosition)
                        .set({ quantity: newQty })
                        .where((0, drizzle_orm_1.eq)(schema_1.tradingPosition.id, pos.id));
                }
                await tx
                    .update(schema_1.tradingAccount)
                    .set({
                    availableCash: (0, drizzle_orm_1.sql) `${schema_1.tradingAccount.availableCash}::numeric + ${netProceeds}`,
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.tradingAccount.userId, (0, drizzle_orm_1.sql) `${userId}::uuid`));
            }
            const [order] = await tx
                .insert(schema_1.tradingOrder)
                .values({
                userId: (0, drizzle_orm_1.sql) `${userId}::uuid`,
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
                .returning({ id: schema_1.tradingOrder.id });
            return { success: true, orderId: order.id };
        });
    }
    async getLatestQuote(code) {
        const rows = await this.db
            .select({ close: schema_1.stockKline.close, pctChg: schema_1.stockKline.pctChg })
            .from(schema_1.stockKline)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockKline.code, code), (0, drizzle_orm_1.eq)(schema_1.stockKline.period, 'd'), (0, drizzle_orm_1.eq)(schema_1.stockKline.adjustFlag, 2)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.stockKline.tradeDate))
            .limit(1);
        if (rows.length === 0)
            return null;
        const close = num(rows[0].close);
        const pctChg = num(rows[0].pctChg);
        const preClose = pctChg !== 0 ? close / (1 + pctChg / 100) : close;
        return { close, preClose };
    }
};
exports.TradingService = TradingService;
exports.TradingService = TradingService = TradingService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(fullstack_nestjs_core_1.DRIZZLE_DATABASE)),
    tslib_1.__metadata("design:paramtypes", [Function])
], TradingService);
