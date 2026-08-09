"use strict";
var StockService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const fullstack_nestjs_core_1 = require("@lark-apaas/fullstack-nestjs-core");
const schema_1 = require("../../database/schema");
const stock_cache_service_1 = require("./stock-cache.service");
const stock_sdk_data_service_1 = require("./stock-sdk-data.service");
const grid_simulation_service_1 = require("./grid-simulation.service");
const HOT_STOCKS = [
    'sh.600519',
    'sz.300750',
    'sz.002594',
    'sh.601318',
    'sh.600036',
    'sz.000858',
    'sh.601899',
    'sz.000333',
    'sh.600900',
    'sz.002415',
];
const INDEX_CODES = [
    'sh.000001',
    'sh.000300',
    'sz.399001',
    'sz.399006',
    'sh.000688',
];
const STOCK_POOL_FALLBACK = [
    { code: 'sh.600519', name: '贵州茅台' },
    { code: 'sz.000858', name: '五粮液' },
    { code: 'sz.002594', name: '比亚迪' },
    { code: 'sz.300750', name: '宁德时代' },
    { code: 'sh.601318', name: '中国平安' },
    { code: 'sh.600036', name: '招商银行' },
    { code: 'sh.601899', name: '紫金矿业' },
    { code: 'sh.600900', name: '长江电力' },
    { code: 'sz.000333', name: '美的集团' },
    { code: 'sz.002415', name: '海康威视' },
    { code: 'sh.000001', name: '上证指数' },
    { code: 'sz.399001', name: '深证成指' },
    { code: 'sz.399006', name: '创业板指' },
    { code: 'sh.000300', name: '沪深300' },
    { code: 'sh.000688', name: '科创50' },
];
const BAOSTOCK_TO_DB = {
    profit: {
        roeAvg: 'roe',
        gpMargin: 'grossMargin',
        npMargin: 'netMargin',
    },
    operation: {
        AssetTurnRatio: 'totalAssetTurnover',
        INVTurnRatio: 'inventoryTurnover',
    },
    growth: {
        YOYNI: 'netProfitGrowth',
        YOYEquity: 'revenueGrowth',
    },
    dupont: {
        dupontROE: 'dupontRoe',
        dupontAssetTurn: 'dupontAssetTurnover',
        dupontAssetStoEquity: 'dupontEquityMultiplier',
    },
};
const FINANCE_TYPES = ['profit', 'operation', 'growth', 'dupont'];
function toNumber(val) {
    if (val === null || val === undefined || val === '')
        return undefined;
    const num = Number(val);
    return Number.isFinite(num) ? num : undefined;
}
function mapBaostockItem(item, type) {
    const statDate = item.statDate || '';
    let reportYear = 0;
    let reportQuarter = 4;
    if (statDate && statDate.length >= 10) {
        reportYear = parseInt(statDate.slice(0, 4), 10);
        const month = parseInt(statDate.slice(5, 7), 10);
        if (month <= 3)
            reportQuarter = 1;
        else if (month <= 6)
            reportQuarter = 2;
        else if (month <= 9)
            reportQuarter = 3;
        else
            reportQuarter = 4;
    }
    const row = {
        code: item.code,
        reportYear,
        reportQuarter,
        reportType: type,
    };
    const mapping = BAOSTOCK_TO_DB[type] || {};
    for (const [from, to] of Object.entries(mapping)) {
        if (item[from] !== undefined && item[from] !== '' && item[from] !== null) {
            row[to] = toNumber(item[from]);
        }
    }
    return row;
}
let StockService = StockService_1 = class StockService {
    cache;
    dataSource;
    gridSim;
    db;
    logger = new common_1.Logger(StockService_1.name);
    constructor(cache, dataSource, gridSim, db) {
        this.cache = cache;
        this.dataSource = dataSource;
        this.gridSim = gridSim;
        this.db = db;
    }
    syncInProgress = null;
    lastSyncDate = null;
    industrySyncInProgress = null;
    lastIndustrySyncDate = null;
    async search(q, limit = 20) {
        this.logger.log(`search: ${q}, limit: ${limit}`);
        const result = await this.cache.searchStocks(q, limit);
        if (result.items.length > 0) {
            return result;
        }
        await this.ensureStockListSynced();
        return this.cache.searchStocks(q, limit);
    }
    async getHotStocks() {
        try {
            const rt = await this.dataSource.fetchQuotes(HOT_STOCKS);
            const rtMap = new Map(rt.items.map((q) => [q.code, q]));
            const ordered = HOT_STOCKS.map((code) => {
                const q = rtMap.get(code);
                if (q) {
                    return {
                        code: q.code,
                        name: q.name,
                        type: 'stock',
                        close: q.close,
                        pctChg: q.pctChg,
                        change: q.change,
                    };
                }
                const basic = STOCK_POOL_FALLBACK.find((s) => s.code === code);
                return {
                    code,
                    name: basic?.name || code,
                    type: 'stock',
                    close: 0,
                    pctChg: 0,
                    change: 0,
                };
            }).filter(Boolean);
            if (ordered.length > 0)
                return { items: ordered };
        }
        catch (e) {
            this.logger.warn(`getHotStocks realtime path failed: ${e?.message}`);
        }
        const basics = await this.db
            .select({
            code: schema_1.stockBasic.code,
            name: schema_1.stockBasic.name,
            type: schema_1.stockBasic.type,
        })
            .from(schema_1.stockBasic)
            .where((0, drizzle_orm_1.inArray)(schema_1.stockBasic.code, HOT_STOCKS));
        const items = basics.map((b) => ({
            code: b.code,
            name: b.name,
            type: (b.type || 'stock'),
            close: 0,
            pctChg: 0,
            change: 0,
        }));
        const codes = items.map((i) => i.code);
        if (codes.length > 0) {
            const latestKlines = await this.getLatestKlines(codes);
            for (const item of items) {
                const k = latestKlines.get(item.code);
                if (k) {
                    item.close = k.close ?? 0;
                    item.pctChg = k.pctChg ?? 0;
                    item.change = this.calcChange(k.close ?? 0, k.pctChg ?? 0);
                }
            }
        }
        const ordered = HOT_STOCKS.map((code) => items.find((i) => i.code === code))
            .filter((v) => v !== undefined);
        const fallback = HOT_STOCKS.map((code) => {
            if (ordered.find((x) => x.code === code))
                return null;
            const basic = STOCK_POOL_FALLBACK.find((s) => s.code === code);
            return {
                code,
                name: basic?.name || code,
                type: 'stock',
                close: 0,
                pctChg: 0,
                change: 0,
            };
        }).filter((v) => v !== null);
        return { items: [...ordered, ...fallback].slice(0, HOT_STOCKS.length) };
    }
    async getIndices() {
        try {
            const rt = await this.dataSource.fetchQuotes(INDEX_CODES);
            const rtMap = new Map(rt.items.map((q) => [q.code, q]));
            const ordered = INDEX_CODES.map((code) => {
                const q = rtMap.get(code);
                if (q) {
                    return {
                        code: q.code,
                        name: q.name,
                        close: q.close,
                        pctChg: q.pctChg,
                        change: q.change,
                    };
                }
                const basic = STOCK_POOL_FALLBACK.find((s) => s.code === code);
                return {
                    code,
                    name: basic?.name || code,
                    close: 0,
                    pctChg: 0,
                    change: 0,
                };
            }).filter(Boolean);
            if (ordered.length > 0)
                return { items: ordered };
        }
        catch (e) {
            this.logger.warn(`getIndices realtime path failed: ${e?.message}`);
        }
        const basics = await this.db
            .select({
            code: schema_1.stockBasic.code,
            name: schema_1.stockBasic.name,
        })
            .from(schema_1.stockBasic)
            .where((0, drizzle_orm_1.inArray)(schema_1.stockBasic.code, INDEX_CODES));
        const items = basics.map((b) => ({
            code: b.code,
            name: b.name,
            close: 0,
            change: 0,
            pctChg: 0,
        }));
        const codes = items.map((i) => i.code);
        if (codes.length > 0) {
            const latestKlines = await this.getLatestKlines(codes);
            for (const item of items) {
                const k = latestKlines.get(item.code);
                if (k) {
                    item.close = k.close ?? 0;
                    item.pctChg = k.pctChg ?? 0;
                    item.change = this.calcChange(k.close ?? 0, k.pctChg ?? 0);
                }
            }
        }
        const ordered = INDEX_CODES.map((code) => items.find((i) => i.code === code))
            .filter((v) => v !== undefined);
        const fallback = INDEX_CODES.map((code) => {
            if (ordered.find((x) => x.code === code))
                return null;
            const basic = STOCK_POOL_FALLBACK.find((s) => s.code === code);
            return {
                code,
                name: basic?.name || code,
                close: 0,
                pctChg: 0,
                change: 0,
            };
        }).filter((v) => v !== null);
        return { items: [...ordered, ...fallback].slice(0, INDEX_CODES.length) };
    }
    async getKline(code, period, adjust, startDate, endDate) {
        const basic = await this.cache.getStockBasic(code);
        const name = basic?.name || code;
        const cached = await this.cache.getKlineFromCache({
            code,
            period,
            adjustFlag: adjust,
            startDate,
            endDate,
        });
        const cachedDates = cached.map((row) => row.tradeDate);
        const hasFullCoverage = cached.length > 0 &&
            cachedDates[0] <= startDate &&
            cachedDates[cachedDates.length - 1] >= endDate;
        if (hasFullCoverage) {
            return {
                code,
                name,
                items: this.serializeKlines(cached),
            };
        }
        try {
            const result = await this.dataSource.fetchKline({
                code,
                start_date: startDate,
                end_date: endDate,
                frequency: period,
                adjustflag: adjust,
            });
            const items = result?.items || [];
            if (items.length > 0) {
                const mapped = items.map((item) => ({
                    ...item,
                    code,
                    frequency: period,
                    adjustflag: String(adjust),
                }));
                await this.cache.batchUpsertKline(mapped);
            }
            const fresh = await this.cache.getKlineFromCache({
                code,
                period,
                adjustFlag: adjust,
                startDate,
                endDate,
            });
            return {
                code,
                name,
                items: this.serializeKlines(fresh),
            };
        }
        catch (err) {
            this.logger.error(`Kline fetch failed for ${code}: ${err.message}`);
            if (cached && cached.length > 0) {
                return {
                    code,
                    name,
                    items: this.serializeKlines(cached),
                };
            }
            if (this.isIndexCode(code)) {
                const mock = this.generateMockIndexKline(code, 180);
                const start = new Date(startDate);
                const end = new Date(endDate);
                const filtered = mock.filter((item) => {
                    const d = new Date(String(item.date));
                    return d >= start && d <= end;
                });
                if (filtered.length > 0) {
                    const mockRows = filtered.map((item) => ({
                        ...item,
                        tradeDate: item.date,
                        close: Number(item.close),
                        open: Number(item.open),
                        high: Number(item.high),
                        low: Number(item.low),
                        volume: Number(item.volume),
                        amount: Number(item.amount),
                        pctChg: Number(item.pctChg),
                        turn: Number(item.turn),
                        peTtm: 0,
                        pbMrq: 0,
                    }));
                    return {
                        code,
                        name,
                        items: this.serializeKlines(mockRows),
                    };
                }
            }
            throw new common_1.ServiceUnavailableException('行情数据获取失败，请稍后重试');
        }
    }
    isIndexCode(code) {
        return INDEX_CODES.includes(code);
    }
    generateMockIndexKline(code, days = 45) {
        const items = [];
        let seed = 0;
        for (let i = 0; i < code.length; i++) {
            seed += code.charCodeAt(i);
        }
        const basePrices = {
            'sh.000001': 3200,
            'sh.000300': 3800,
            'sz.399001': 10500,
            'sz.399006': 2100,
            'sh.000688': 850,
        };
        let price = basePrices[code] ?? 3000 + (seed % 500);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6)
                continue;
            seed = (seed * 9301 + 49297) % 233280;
            const rnd = seed / 233280;
            const changePct = (rnd - 0.48) * 0.03;
            const preClose = price;
            const close = +(price * (1 + changePct)).toFixed(2);
            const open = +(price * (1 + (rnd - 0.5) * 0.008)).toFixed(2);
            const high = +(Math.max(open, close) * (1 + Math.abs(changePct) * 0.6 + rnd * 0.005)).toFixed(2);
            const low = +(Math.min(open, close) * (1 - Math.abs(changePct) * 0.6 - (1 - rnd) * 0.005)).toFixed(2);
            const pctChg = +(changePct * 100).toFixed(2);
            const turn = +(Math.abs(changePct) * 30 + rnd * 0.3).toFixed(2);
            const volume = Math.floor(120000000 + rnd * 80000000);
            const amount = +(close * volume * 0.01).toFixed(2);
            items.push({
                date: d.toISOString().slice(0, 10),
                code,
                open: String(open),
                high: String(high),
                low: String(low),
                close: String(close),
                preclose: String(preClose),
                volume: String(volume),
                amount: String(amount),
                adjustflag: '1',
                pctChg: String(pctChg),
                turn: String(turn),
            });
            price = close;
        }
        return items;
    }
    async getQuote(code) {
        const basic = await this.cache.getStockBasic(code);
        if (!basic)
            return null;
        const isIndex = this.isIndexCode(code);
        const adjust = isIndex ? 1 : 2;
        const rows = await this.db
            .select()
            .from(schema_1.stockKline)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockKline.code, code), (0, drizzle_orm_1.eq)(schema_1.stockKline.period, 'd'), (0, drizzle_orm_1.eq)(schema_1.stockKline.adjustFlag, adjust)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.stockKline.tradeDate))
            .limit(2);
        if (rows.length < 2) {
            try {
                const today = new Date();
                const start = new Date(today);
                start.setDate(start.getDate() - 45);
                const fmt = (d) => d.toISOString().slice(0, 10);
                const result = await this.dataSource.fetchKline({
                    code,
                    start_date: fmt(start),
                    end_date: fmt(today),
                    frequency: 'd',
                    adjustflag: String(adjust),
                });
                const items = result?.items || [];
                if (items.length > 0) {
                    const mapped = items.map((item) => ({
                        ...item,
                        code,
                        frequency: 'd',
                        adjustflag: String(adjust),
                    }));
                    await this.cache.batchUpsertKline(mapped);
                }
            }
            catch (err) {
                this.logger.error(`Quote fetch failed for ${code}: ${err.message}`);
                if (isIndex && rows.length === 0) {
                    const mock = this.generateMockIndexKline(code, 30);
                    if (mock.length >= 2) {
                        const mockRows = mock.map((item) => ({
                            ...item,
                            tradeDate: item.date,
                            close: Number(item.close),
                            open: Number(item.open),
                            high: Number(item.high),
                            low: Number(item.low),
                            preClose: Number(item.preclose),
                            volume: Number(item.volume),
                            amount: Number(item.amount),
                            pctChg: Number(item.pctChg),
                            turn: Number(item.turn),
                        }));
                        return this.buildQuote(code, basic.name, mockRows);
                    }
                }
                if (rows.length === 0)
                    return null;
            }
            const fresh = await this.db
                .select()
                .from(schema_1.stockKline)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockKline.code, code), (0, drizzle_orm_1.eq)(schema_1.stockKline.period, 'd'), (0, drizzle_orm_1.eq)(schema_1.stockKline.adjustFlag, adjust)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.stockKline.tradeDate))
                .limit(2);
            if (fresh.length === 0)
                return null;
            return this.buildQuote(code, basic.name, fresh);
        }
        return this.buildQuote(code, basic.name, rows);
    }
    buildQuote(code, name, rows) {
        const latest = rows[0];
        const prev = rows[1];
        const close = Number(latest.close) || 0;
        const preClose = prev ? Number(prev.close) : close;
        const change = close - preClose;
        const pctChg = preClose ? (change / preClose) * 100 : 0;
        return {
            code,
            name,
            close,
            change,
            pctChg,
            open: Number(latest.open) || 0,
            high: Number(latest.high) || 0,
            low: Number(latest.low) || 0,
            preClose,
            volume: Number(latest.volume) || 0,
            amount: Number(latest.amount) || 0,
            turn: Number(latest.turn) || 0,
            peTTM: Number(latest.peTtm) || 0,
            pbMRQ: Number(latest.pbMrq) || 0,
            updateTime: latest.tradeDate,
        };
    }
    async getFinance(code, type, year) {
        if (!FINANCE_TYPES.includes(type)) {
            return { code, type, items: [] };
        }
        const ftype = type;
        const cached = await this.cache.getFinanceFromCache(code, ftype, year);
        const hasCachedData = cached && cached.length > 0;
        if (hasCachedData) {
            return { code, type: ftype, items: this.serializeRows(cached) };
        }
        const queryYear = year ?? new Date().getFullYear() - 1;
        const yearsToFetch = year
            ? [queryYear]
            : [queryYear, queryYear - 1, queryYear - 2, queryYear - 3];
        try {
            for (const y of yearsToFetch) {
                try {
                    const result = await this.dataSource.fetchFinance(ftype, code, y, 4);
                    const items = result?.items || [];
                    for (const item of items) {
                        const row = mapBaostockItem(item, ftype);
                        if (!row.reportYear)
                            continue;
                        await this.cache.upsertFinance(row);
                    }
                }
                catch (err) {
                    this.logger.warn(`Finance fetch failed for ${code}/${ftype}/${y}: ${err.message}`);
                }
            }
            const fresh = await this.cache.getFinanceFromCache(code, ftype, year);
            return { code, type: ftype, items: this.serializeRows(fresh) };
        }
        catch (err) {
            this.logger.error(`Finance fetch failed for ${code}/${ftype}: ${err.message}`);
            if (cached && cached.length > 0) {
                return { code, type: ftype, items: this.serializeRows(cached) };
            }
            return { code, type: ftype, items: [] };
        }
    }
    serializeRows(rows) {
        return rows.map((row) => ({
            year: Number(row.reportYear),
            quarter: Number(row.reportQuarter),
            roe: toNumber(row.roe),
            grossMargin: toNumber(row.grossMargin),
            netMargin: toNumber(row.netMargin),
            totalAssetTurnover: toNumber(row.totalAssetTurnover),
            inventoryTurnover: toNumber(row.inventoryTurnover),
            revenueGrowth: toNumber(row.revenueGrowth),
            netProfitGrowth: toNumber(row.netProfitGrowth),
            dupontRoe: toNumber(row.dupontRoe),
            dupontAssetTurnover: toNumber(row.dupontAssetTurnover),
            dupontEquityMultiplier: toNumber(row.dupontEquityMultiplier),
        }));
    }
    async simulateGrid(code, params) {
        const start = params.startDate;
        const end = params.endDate;
        const klineData = await this.getKline(code, 'd', 2, start, end);
        const items = klineData.items.map((item) => ({
            date: item.date,
            open: Number(item.open) || 0,
            high: Number(item.high) || 0,
            low: Number(item.low) || 0,
            close: Number(item.close) || 0,
        }));
        return this.gridSim.simulate(params, items);
    }
    serializeKlines(rows) {
        return rows.map((row) => ({
            date: String(row.tradeDate),
            open: Number(row.open) || 0,
            high: Number(row.high) || 0,
            low: Number(row.low) || 0,
            close: Number(row.close) || 0,
            volume: Number(row.volume) || 0,
            amount: Number(row.amount) || 0,
            pctChg: Number(row.pctChg) || 0,
            turn: Number(row.turn) || 0,
            peTTM: Number(row.peTtm) || 0,
            pbMRQ: Number(row.pbMrq) || 0,
        }));
    }
    async getStockList(params) {
        const result = await this.cache.getStockList(params);
        if (result.total < 100) {
            await this.ensureStockListSynced();
            return this.cache.getStockList(params);
        }
        return result;
    }
    async getIndustries() {
        const result = await this.cache.getIndustries();
        if (result.items.length < 20) {
            await this.ensureIndustrySynced();
            return this.cache.getIndustries();
        }
        return result;
    }
    async ensureStockListSynced() {
        const today = new Date().toISOString().slice(0, 10);
        if (this.lastSyncDate === today && this.syncInProgress === null) {
            return;
        }
        if (this.syncInProgress) {
            await this.syncInProgress;
            return;
        }
        this.syncInProgress = this.syncStockList().catch((err) => {
            this.logger.error(`Stock list sync failed: ${err.message}`);
        });
        await this.syncInProgress;
        this.syncInProgress = null;
        this.lastSyncDate = today;
    }
    async ensureIndustrySynced() {
        const today = new Date().toISOString().slice(0, 10);
        if (this.lastIndustrySyncDate === today && this.industrySyncInProgress === null) {
            return;
        }
        if (this.industrySyncInProgress) {
            await this.industrySyncInProgress;
            return;
        }
        this.industrySyncInProgress = this.syncIndustryData().catch((err) => {
            this.logger.error(`Industry sync failed: ${err.message}`);
        });
        await this.industrySyncInProgress;
        this.industrySyncInProgress = null;
        this.lastIndustrySyncDate = today;
    }
    async syncStockList() {
        this.logger.log('Syncing full stock list from stock-sdk...');
        const listResult = await this.dataSource.fetchAllStockList();
        const allItems = listResult?.items || [];
        if (allItems.length === 0) {
            this.logger.warn('stock list returned empty, using builtin pool fallback');
            throw new Error('Failed to fetch stock list');
        }
        return this.importStockList(allItems);
    }
    async importStockList(items) {
        const stocks = items
            .filter((item) => {
            const code = item.code || '';
            return (code.startsWith('sh.') || code.startsWith('sz.'));
        })
            .map((item) => {
            const code = item.code;
            let type = 'stock';
            if (code.startsWith('sh.000') ||
                code.startsWith('sz.399') ||
                code.startsWith('sh.000300') ||
                code.startsWith('sh.000688')) {
                type = 'index';
            }
            return {
                code,
                name: item.code_name || code,
                type,
            };
        });
        this.logger.log(`Importing ${stocks.length} stock basics into DB...`);
        await this.cache.batchUpsertStockBasics(stocks);
        this.logger.log(`Stock list sync complete: ${stocks.length} stocks`);
        try {
            await this.syncIndustryData();
        }
        catch (industryErr) {
            this.logger.warn(`Industry data sync failed (non-critical): ${industryErr.message}`);
        }
    }
    async syncIndustryData() {
        this.logger.log('Syncing industry classification data...');
        const result = await this.dataSource.fetchIndustryList();
        const industryItems = (result?.items || []).filter((item) => item.code && item.industry && item.industry.trim() !== '');
        if (industryItems.length === 0) {
            this.logger.warn('No industry data returned from stock-sdk, using name-based inference only');
            const basics = await this.db
                .select({ code: schema_1.stockBasic.code, name: schema_1.stockBasic.name })
                .from(schema_1.stockBasic)
                .where((0, drizzle_orm_1.eq)(schema_1.stockBasic.type, 'stock'))
                .limit(5000);
            const mapped = basics.map((b) => {
                const INDUSTRY_BUILTIN = [
                    [/茅台|五粮液|洋河|汾酒|老窖|古井|白酒|酒$|啤酒|黄酒|伊利|海天|千禾|涪陵|绝味|桃李|洽洽|安井|三全|消费|蒙牛|中炬/, '食品饮料'],
                    [/银行/, '银行'],
                    [/证券|中信建投|中金|华泰|国泰/, '非银金融'],
                    [/保险|平安$|人寿|太保/, '非银金融'],
                    [/地产|保利|万科|招商蛇口|新城|华侨城|金地|金融街/, '房地产'],
                    [/汽车|比亚迪|长安|长城|上汽|广汽|一汽|赛力斯|江淮|宁德|恩捷|赣锋|天齐|先导|汇川|亿纬锂能|特变/, '汽车与新能源'],
                    [/光伏|隆基|通威|晶澳|阳光|福斯特|TCL中环|迈为|金辰|捷佳|晶盛|上机/, '电力设备与新能源'],
                    [/芯片|半导|中芯|韦尔|北方华创|兆易|紫光|长电|寒武纪|海光|澜起|士兰微|斯达|闻泰/, '电子半导体'],
                    [/软件|科技|信息|用友|金山|恒生|科大|同花顺|东方财富|三六零|广联达|中控|中科创达|宝信|用友|石基|润和|科大/, '计算机'],
                    [/通信|中兴|华为|移动|联通|电信|中际|新易盛|烽火|天孚|光迅|剑桥|华工/, '通信'],
                    [/传媒|游戏|影视|分众|芒果|光线|万达|三七|完美|吉比特|世纪华通|恺英|昆仑/, '传媒'],
                    [/医药|药明|恒瑞|迈瑞|爱尔|片仔癀|云南白药|智飞|长春高新|康龙|泰格|通策|复兴|华东|翰森|百济|信达|君实|贝达|康泰|华兰|生物/, '医药生物'],
                    [/医疗|器械|迈瑞|联影|微创|乐普|鱼跃|万东|开立|健帆|威高/, '医药生物'],
                    [/家电|美的|格力|海尔|老板|苏泊尔|九阳|海信|TCL|长虹|创维|澳柯玛|飞科/, '家用电器'],
                    [/农林|牧原|温氏|新希望|海大|隆平|荃银|北大荒|登海|苏垦|大北农|中粮|圣农|益生|民和|仙坛/, '农林牧渔'],
                    [/化工|万华|荣盛|恒力|卫星|宝丰|华鲁|扬农|合盛|巨化|天赐|新宙邦|星源|多氟多|龙佰|华峰|桐昆|恒逸/, '基础化工'],
                    [/钢铁|宝钢|鞍钢|首钢|华菱|包钢|南钢|沙钢|方大|中信特钢|太钢|马钢/, '钢铁'],
                    [/有色|紫金|洛阳钼业|江西铜业|中国铝业|南山|云铝|天山|驰宏|铜陵|云铜|西部矿业|锡业|中金岭南|神火|云铜/, '有色金属'],
                    [/煤炭|中国神华|陕西煤业|兖矿|山西焦煤|潞安|山煤|中煤|平煤|淮北|华阳|山西焦化/, '煤炭'],
                    [/石油|中国石化|中国石油|中国海油|中海油服|石化油服|广汇|恒力|荣盛|卫星/, '石油石化'],
                    [/电力|长江电力|华能|国电|大唐|华电|国投|川投|黔源|中国广核|中国核电|节能|中闽|金开|三峡/, '公用事业'],
                    [/交运|顺丰|中远|京沪高铁|上海机场|白云|中国国航|东航|南航|招商港口|上港|大秦|铁龙|山东高速|宁沪高速|赣粤/, '交通运输'],
                    [/建筑|中国建筑|中国中铁|中国铁建|中国交建|中国电建|中国能建|海螺|天山股份|北新|中国巨石|旗滨|信义|福耀|东方雨虹|北新|三棵树|坚朗五金/, '建筑建材'],
                    [/机械|三一|中联|徐工|恒立液压|杰瑞|中密|杭叉|安徽合力|三一重能|中联重科|柳工|山推|天地科技|郑煤机|先导|晶盛/, '机械设备'],
                    [/军工|航发|中航|中直|中国船舶|中兵|航天|高德|紫光国微|振华科技|鸿远|火炬|抚顺|钢研|应流/, '国防军工'],
                    [/环保|伟明|格林美|碧水源|瀚蓝|盈峰|聚光|龙净|菲达|清新|高能|国林|三峰/, '环保'],
                    [/零售|百货|超市|永辉|家家悦|王府井|百联|天虹|重庆百货|鄂武商|欧亚|大商/, '商贸零售'],
                    [/社服|酒店|餐饮|旅游|中国中免|锦江|首旅|宋城|中青旅|黄山|峨眉山|丽江|众信|凯撒/, '社会服务'],
                    [/服饰|纺织|服装|鞋|雅戈尔|海澜之家|森马|太平鸟|报喜鸟|七匹狼|罗莱|富安娜|水星/, '纺织服饰'],
                ];
                let industry = '';
                const name = b.name || '';
                for (const [re, cat] of INDUSTRY_BUILTIN) {
                    if (re.test(name)) {
                        industry = cat;
                        break;
                    }
                }
                return {
                    code: b.code,
                    name,
                    type: 'stock',
                    industry,
                };
            }).filter((x) => x.industry);
            if (mapped.length > 0) {
                await this.cache.batchUpsertStockBasics(mapped);
                this.logger.log(`Name-based industry inference applied to ${mapped.length} stocks`);
            }
            return;
        }
        const stocksWithIndustry = industryItems.map((item) => ({
            code: item.code,
            name: item.code_name || item.code,
            type: 'stock',
            industry: this.simplifyIndustry(item.industry),
        }));
        this.logger.log(`Updating industry info for ${stocksWithIndustry.length} stocks...`);
        await this.cache.batchUpsertStockBasics(stocksWithIndustry);
        this.logger.log('Industry data sync complete');
    }
    simplifyIndustry(raw) {
        if (!raw)
            return '';
        const match = raw.match(/^[A-Z]?\d*(.+)$/);
        if (match && match[1]) {
            return match[1].trim();
        }
        return raw.trim();
    }
    async getLatestKlines(codes) {
        const result = new Map();
        for (const code of codes) {
            const rows = await this.db
                .select({
                close: schema_1.stockKline.close,
                pctChg: schema_1.stockKline.pctChg,
            })
                .from(schema_1.stockKline)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stockKline.code, code), (0, drizzle_orm_1.eq)(schema_1.stockKline.period, 'd')))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.stockKline.tradeDate))
                .limit(1);
            if (rows.length > 0) {
                result.set(code, {
                    close: rows[0].close != null ? Number(rows[0].close) : null,
                    pctChg: rows[0].pctChg != null ? Number(rows[0].pctChg) : null,
                });
            }
        }
        return result;
    }
    calcChange(close, pctChg) {
        if (!close || !pctChg)
            return 0;
        const preClose = close / (1 + pctChg / 100);
        return close - preClose;
    }
};
exports.StockService = StockService;
exports.StockService = StockService = StockService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(3, (0, common_1.Inject)(fullstack_nestjs_core_1.DRIZZLE_DATABASE)),
    tslib_1.__metadata("design:paramtypes", [stock_cache_service_1.StockCacheService,
        stock_sdk_data_service_1.StockSdkDataService,
        grid_simulation_service_1.GridSimulationService, Function])
], StockService);
