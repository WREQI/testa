"use strict";
var StockSdkDataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockSdkDataService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const INDUSTRY_BUILTIN = [
    [/茅台|五粮液|洋河|汾酒|老窖|古井|白酒|酒$|啤酒|黄酒/, '食品饮料'],
    [/银行/, '银行'],
    [/证券|中信建投|中金|华泰|国泰/, '非银金融'],
    [/保险|平安$|人寿|太保/, '非银金融'],
    [/地产|保利|万科|招商蛇口|新城/, '房地产'],
    [/汽车|比亚迪|长安|长城|上汽|广汽|一汽|赛力斯|宁德|恩捷|赣锋|天齐|先导|汇川/, '汽车与新能源'],
    [/光伏|隆基|通威|晶澳|阳光|福斯特|TCL中环|迈为/, '电力设备与新能源'],
    [/芯片|半导|中芯|韦尔|北方华创|兆易|紫光|长电|寒武纪|海光/, '电子半导体'],
    [/软件|科技|信息|用友|金山|恒生|科大|同花顺|东方财富|三六零|广联达|中控/, '计算机'],
    [/通信|中兴|华为|移动|联通|电信|中际|新易盛|烽火/, '通信'],
    [/传媒|游戏|影视|分众|芒果|光线|万达|三七|完美/, '传媒'],
    [/医药|药明|恒瑞|迈瑞|爱尔|片仔癀|云南白药|智飞|长春高新|康龙|泰格|通策|复兴|华东/, '医药生物'],
    [/医疗|器械/, '医药生物'],
    [/家电|美的|格力|海尔|老板|苏泊尔|九阳|海信/, '家用电器'],
    [/消费|伊利|蒙牛|海天|中炬|千禾|涪陵|绝味|桃李|洽洽|安井|三全/, '食品饮料'],
    [/农林|牧原|温氏|新希望|海大|隆平|荃银|北大荒|登海|苏垦/, '农林牧渔'],
    [/化工|万华|荣盛|恒力|卫星|宝丰|华鲁|扬农|合盛|巨化/, '基础化工'],
    [/钢铁|宝钢|鞍钢|首钢|华菱|包钢|南钢/, '钢铁'],
    [/有色|紫金|洛阳钼业|江西铜业|中国铝业|南山|云铝|天山|驰宏/, '有色金属'],
    [/煤炭|中国神华|陕西煤业|兖矿|山西焦煤|潞安|山煤/, '煤炭'],
    [/石油|中国石化|中国石油|中国海油|中海油服/, '石油石化'],
    [/电力|长江电力|华能|国电|大唐|华电|国投|川投|黔源/, '公用事业'],
    [/交运|顺丰|中远|京沪高铁|上海机场|白云|中国国航|东航|南航|招商港口|上港/, '交通运输'],
    [/建筑|中国建筑|中国中铁|中国铁建|中国交建|中国电建|中国能建|海螺|天山股份|北新/, '建筑建材'],
    [/机械|三一|中联|徐工|恒立液压|杰瑞|中密|杭叉|安徽合力/, '机械设备'],
    [/军工|航发|中航|中直|中国船舶|中兵|航天|高德|紫光国微/, '国防军工'],
    [/环保|伟明|格林美|碧水源|瀚蓝|盈峰|聚光/, '环保'],
    [/建材|玻璃|玻纤|中国巨石|北新建材|海螺新材|旗滨|信义/, '建筑建材'],
    [/零售|百货|超市|永辉|家家悦|王府井|百联|天虹/, '商贸零售'],
    [/社服|酒店|餐饮|旅游|中国中免|锦江|首旅|宋城|中青旅|黄山/, '社会服务'],
];
function builtinIndustryFromName(name) {
    if (!name)
        return '';
    for (const [re, cat] of INDUSTRY_BUILTIN) {
        if (re.test(name))
            return cat;
    }
    return '';
}
function normalizeCode(code) {
    if (!code)
        return code;
    const c = code.toUpperCase().replace(/[^0-9A-Z]/g, '');
    const digits = c.replace(/[^0-9]/g, '');
    if (digits.length === 6) {
        if (/^6/.test(digits) || /^9/.test(digits))
            return `sh.${digits}`;
        if (/^(0|3)/.test(digits))
            return `sz.${digits}`;
        if (/^8|^4/.test(digits))
            return `bj.${digits}`;
        return `sh.${digits}`;
    }
    if (code.startsWith('SH') || code.startsWith('sh.') || code.startsWith('SH.')) {
        return `sh.${digits.slice(-6)}`;
    }
    if (code.startsWith('SZ') || code.startsWith('sz.') || code.startsWith('SZ.')) {
        return `sz.${digits.slice(-6)}`;
    }
    return code;
}
function toStockSdkCode(internalCode) {
    const c = internalCode || '';
    const digits = c.replace(/[^0-9]/g, '');
    if (digits.length !== 6)
        return c;
    if (c.startsWith('sh.'))
        return `SH${digits}`;
    if (c.startsWith('sz.'))
        return `SZ${digits}`;
    if (c.startsWith('bj.'))
        return `BJ${digits}`;
    if (/^6|^9/.test(digits))
        return `SH${digits}`;
    return `SZ${digits}`;
}
let StockSdkDataService = StockSdkDataService_1 = class StockSdkDataService {
    logger = new common_1.Logger(StockSdkDataService_1.name);
    stockSdkInstance = null;
    constructor() { }
    async getSdk() {
        if (this.stockSdkInstance)
            return this.stockSdkInstance;
        try {
            const mod = await Promise.resolve().then(() => tslib_1.__importStar(require('stock-sdk')));
            const Ctor = mod.StockSDK || mod.default?.StockSDK;
            if (Ctor) {
                this.stockSdkInstance = new Ctor();
                return this.stockSdkInstance;
            }
        }
        catch (err) {
            this.logger.warn(`stock-sdk load failed (StockSDK): ${err?.message}`);
        }
        try {
            const mod = await Promise.resolve().then(() => tslib_1.__importStar(require('stock-sdk')));
            if (mod.stocks?.auto) {
                this.stockSdkInstance = { __stockApiCompat: true, mod };
                return this.stockSdkInstance;
            }
        }
        catch (err) {
            this.logger.warn(`stock-api compat load failed: ${err?.message}`);
        }
        return null;
    }
    async fetchQuotes(codes) {
        const cleanCodes = (codes || []).filter(Boolean);
        if (cleanCodes.length === 0)
            return { items: [] };
        const sdkCodes = cleanCodes.map((c) => toStockSdkCode(c)).filter(Boolean);
        try {
            const sdk = await this.getSdk();
            if (sdk) {
                let quotes = [];
                try {
                    if (sdk.__stockApiCompat) {
                        const stocks = sdk.mod.stocks;
                        const fn = (stocks.auto || stocks.tencent || stocks.sina);
                        if (typeof fn.getQuotes === 'function') {
                            const res = await fn.getQuotes(sdkCodes);
                            quotes = Array.isArray(res) ? res : res?.items || [];
                        }
                        else if (typeof fn.getSimpleQuotes === 'function') {
                            const res = await fn.getSimpleQuotes(sdkCodes);
                            quotes = Array.isArray(res) ? res : res?.items || [];
                        }
                    }
                    else if (typeof sdk.getSimpleQuotes === 'function') {
                        const res = await sdk.getSimpleQuotes(sdkCodes);
                        quotes = Array.isArray(res) ? res : res?.items || [];
                    }
                    else if (typeof sdk.getRealtimeQuotes === 'function') {
                        const res = await sdk.getRealtimeQuotes(sdkCodes);
                        quotes = Array.isArray(res) ? res : res?.items || [];
                    }
                }
                catch (e) {
                    this.logger.warn(`stock-sdk quotes call failed: ${e?.message}`);
                }
                if (quotes && quotes.length > 0) {
                    const items = quotes
                        .map((q) => this.mapSdkQuote(q))
                        .filter((q) => !!q);
                    if (items.length > 0)
                        return { items };
                }
            }
        }
        catch (err) {
            this.logger.warn(`fetchQuotes stock-sdk path failed: ${err?.message}`);
        }
        const fallback = cleanCodes.map((c) => this.mockQuote(c)).filter((q) => !!q);
        return { items: fallback };
    }
    mapSdkQuote(q) {
        if (!q)
            return null;
        const codeRaw = q.code || q.symbol || '';
        const code = normalizeCode(codeRaw);
        if (!code)
            return null;
        const name = String(q.name || q.n || code);
        const close = Number(q.close ?? q.c ?? q.price ?? q.now ?? 0);
        const preClose = Number(q.preClose ?? q.preclose ?? q.pc ?? q.lastClose ?? close);
        const open = Number(q.open ?? q.o ?? 0);
        const high = Number(q.high ?? q.h ?? 0);
        const low = Number(q.low ?? q.l ?? 0);
        const volume = Number(q.volume ?? q.v ?? q.vol ?? 0);
        const amount = Number(q.amount ?? q.a ?? q.turnover ?? q.amt ?? 0);
        const pctChgRaw = q.changePercent ?? q.pctChg ?? q.pct ?? q.percent;
        let pctChg = pctChgRaw != null && pctChgRaw !== '' ? Number(pctChgRaw) : NaN;
        if (!Number.isFinite(pctChg) && preClose && close) {
            pctChg = ((close - preClose) / preClose) * 100;
        }
        const change = preClose && close ? close - preClose : 0;
        const turnRaw = q.turnoverRate ?? q.turn ?? q.tr;
        const turn = turnRaw != null && turnRaw !== '' ? Number(turnRaw) : undefined;
        const updateTime = String(q.time || q.updateTime || q.tradeTime || q.date || '');
        return {
            code,
            name,
            close,
            change,
            pctChg: Number.isFinite(pctChg) ? +pctChg.toFixed(3) : 0,
            open,
            high,
            low,
            preClose,
            volume,
            amount,
            turn,
            updateTime,
        };
    }
    mockQuote(code) {
        const basic = this.builtinStockList().find((s) => s.code === code);
        if (!basic)
            return null;
        let seed = 0;
        for (let i = 0; i < code.length; i++)
            seed += code.charCodeAt(i);
        const isIndex = code.startsWith('sh.0') || code.startsWith('sz.399');
        const basePrice = isIndex
            ? 3000 + (seed % 8000)
            : 5 + (seed % 240) + ((seed * 13) % 500) / 10;
        seed = (seed * 9301 + 49297) % 233280;
        const rnd = seed / 233280;
        const pctChg = ((rnd - 0.48) * (isIndex ? 2.5 : 4.5));
        const close = +basePrice.toFixed(2);
        const preClose = +(close / (1 + pctChg / 100)).toFixed(2);
        const change = +(close - preClose).toFixed(2);
        const open = +(preClose * (1 + (rnd - 0.5) * 0.01)).toFixed(2);
        const high = +(Math.max(close, open) * (1 + Math.abs(pctChg) / 100 * 0.6 + rnd * 0.004)).toFixed(2);
        const low = +(Math.min(close, open) * (1 - Math.abs(pctChg) / 100 * 0.6 - (1 - rnd) * 0.004)).toFixed(2);
        const volScale = isIndex ? 1e8 : 1e6;
        const volume = Math.floor(volScale * (0.5 + rnd * 2));
        const amount = +(close * volume * (isIndex ? 1 : 0.01)).toFixed(2);
        const turn = isIndex ? undefined : +(Math.abs(pctChg) * 25 + rnd * 0.8).toFixed(3);
        return {
            code,
            name: basic.code_name,
            close,
            change,
            pctChg: +pctChg.toFixed(3),
            open,
            high,
            low,
            preClose,
            volume,
            amount,
            turn,
            updateTime: new Date().toISOString().slice(0, 10),
        };
    }
    async fetchKline(params) {
        const { code, start_date, end_date, frequency, adjustflag } = params;
        const sdkCode = toStockSdkCode(code);
        const periodMap = { d: 'day', w: 'week', m: 'month' };
        const period = periodMap[frequency] || 'day';
        const daysBetween = Math.max(30, Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000) + 20);
        try {
            const sdk = await this.getSdk();
            if (sdk) {
                let klines = [];
                try {
                    if (sdk.__stockApiCompat) {
                        const stocks = sdk.mod.stocks;
                        const res = await (stocks.auto || stocks.tencent || stocks.sina).getKlines(sdkCode, { period, count: Math.min(Math.max(daysBetween, 60), 2000) });
                        klines = res || [];
                    }
                    else if (typeof sdk.getHistoryKline === 'function') {
                        klines = await sdk.getHistoryKline(sdkCode, {
                            period: frequency === 'm' ? '1M' : frequency === 'w' ? '1W' : '1D',
                            count: Math.min(Math.max(daysBetween, 60), 2000),
                        });
                    }
                    else if (typeof sdk.getKlines === 'function') {
                        klines = await sdk.getKlines(sdkCode, { period, count: daysBetween });
                    }
                }
                catch (e) {
                    this.logger.warn(`stock-sdk kline call failed: ${e?.message}`);
                }
                if (klines && klines.length > 0) {
                    const items = klines
                        .map((k) => this.mapSdkKline(k, frequency, adjustflag))
                        .filter((k) => !!k);
                    const filtered = items.filter((k) => {
                        if (!k || !k.date)
                            return false;
                        return k.date >= start_date && k.date <= end_date;
                    });
                    if (filtered.length > 0)
                        return { items: filtered };
                    if (items.length > 0)
                        return { items };
                }
            }
        }
        catch (err) {
            this.logger.warn(`fetchKline stock-sdk path failed: ${err?.message}`);
        }
        const fallback = this.softFallbackKline(code, start_date, end_date, frequency);
        if (fallback && fallback.items.length > 0)
            return fallback;
        return { items: [] };
    }
    mapSdkKline(k, frequency, adjustflag) {
        if (!k)
            return null;
        const date = k.time || k.date || k.tradeDate || k.trade_date || k.day || '';
        let dateStr = '';
        if (date instanceof Date) {
            dateStr = date.toISOString().slice(0, 10);
        }
        else if (typeof date === 'number') {
            dateStr = new Date(date).toISOString().slice(0, 10);
        }
        else if (typeof date === 'string') {
            dateStr = date.length >= 10 ? date.slice(0, 10) : date;
        }
        if (!dateStr)
            return null;
        const open = String(k.open ?? k.o ?? '');
        const high = String(k.high ?? k.h ?? '');
        const low = String(k.low ?? k.l ?? '');
        const close = String(k.close ?? k.c ?? '');
        const volume = String(k.volume ?? k.v ?? k.vol ?? '0');
        const amount = String(k.amount ?? k.a ?? k.turnover ?? k.amt ?? '');
        const preclose = String(k.preClose ?? k.preclose ?? k.pc ?? '');
        const pctChgRaw = k.changePercent ?? k.pctChg ?? k.pct ?? k.percent;
        const pctChg = pctChgRaw != null && pctChgRaw !== '' ? String(pctChgRaw) : '';
        const turnRaw = k.turnoverRate ?? k.turn ?? k.tr;
        const turn = turnRaw != null && turnRaw !== '' ? String(turnRaw) : '';
        return { date: dateStr, open, high, low, close, volume, amount, preclose, pctChg, turn };
    }
    softFallbackKline(code, start_date, end_date, frequency) {
        void code;
        void frequency;
        const start = new Date(start_date);
        const end = new Date(end_date);
        const items = [];
        let seed = 0;
        for (let i = 0; i < code.length; i++)
            seed += code.charCodeAt(i);
        const basePrice = 8 + (seed % 240) + ((seed * 13) % 500) / 10;
        let price = basePrice;
        const d = new Date(start);
        while (d <= end) {
            const day = d.getDay();
            if (day !== 0 && day !== 6) {
                seed = (seed * 9301 + 49297) % 233280;
                const rnd = seed / 233280;
                const pct = (rnd - 0.48) * 0.04;
                const close = +(price * (1 + pct)).toFixed(2);
                const open = +(price * (1 + (rnd - 0.5) * 0.01)).toFixed(2);
                const high = +(Math.max(open, close) * (1 + Math.abs(pct) * 0.7 + rnd * 0.005)).toFixed(2);
                const low = +(Math.min(open, close) * (1 - Math.abs(pct) * 0.7 - (1 - rnd) * 0.005)).toFixed(2);
                const preClose = price;
                const volume = Math.floor(3000000 + rnd * 80000000);
                const amount = +(close * volume * 0.01).toFixed(2);
                const pctChg = +(pct * 100).toFixed(2);
                const turn = +(Math.abs(pct) * 25 + rnd * 0.5).toFixed(3);
                items.push({
                    date: d.toISOString().slice(0, 10),
                    open: String(open),
                    high: String(high),
                    low: String(low),
                    close: String(close),
                    volume: String(volume),
                    amount: String(amount),
                    preclose: String(preClose),
                    pctChg: String(pctChg),
                    turn: String(turn),
                });
                price = close;
            }
            d.setDate(d.getDate() + 1);
        }
        return { items };
    }
    async fetchAllStockList() {
        try {
            const sdk = await this.getSdk();
            if (sdk) {
                let rows = [];
                try {
                    if (sdk.__stockApiCompat) {
                        const stocks = sdk.mod.stocks;
                        const fn = (stocks.auto || stocks.tencent || stocks.sina);
                        if (typeof fn.searchStocks === 'function') {
                            try {
                                const letters = 'abcdefghijklmnopqrstuvwxyz0123456789';
                                const seen = new Map();
                                for (const ch of letters.split('')) {
                                    try {
                                        const res = await fn.searchStocks(ch, { count: 120 });
                                        const arr = Array.isArray(res) ? res : res?.items || [];
                                        for (const item of arr)
                                            this.addToListFromSearch(seen, item);
                                    }
                                    catch {
                                        /* ignore */
                                    }
                                }
                                rows = Array.from(seen.values()).map((r) => ({
                                    code: r.code,
                                    code_name: r.code_name,
                                    tradeStatus: '1',
                                    industry: r.industry || builtinIndustryFromName(r.code_name),
                                }));
                            }
                            catch (e) {
                                this.logger.warn(`stock-api search failed: ${e?.message}`);
                            }
                        }
                        if (typeof fn.getStocks === 'function') {
                            const pool = ['SH600519', 'SZ000858', 'SH601318', 'SZ000001', 'SH600036', 'SZ002594', 'SZ300750', 'SH601899', 'SH600900', 'SZ000333', 'SZ002415', 'SH601012', 'SH688981', 'SZ002475', 'SH603259', 'SZ300059', 'SH600030', 'SZ000725', 'SH600276', 'SH688111'];
                            try {
                                const qs = await fn.getStocks(pool);
                                const arr = Array.isArray(qs) ? qs : qs?.items || [];
                                for (const q of arr) {
                                    const cd = normalizeCode(q.code || q.symbol || '');
                                    if (!cd || cd.length < 8)
                                        continue;
                                    rows.push({
                                        code: cd,
                                        code_name: q.name || cd,
                                        tradeStatus: '1',
                                        industry: builtinIndustryFromName(q.name || ''),
                                    });
                                }
                            }
                            catch {
                                /* ignore */
                            }
                        }
                    }
                    else if (typeof sdk.getAllAShareQuotes === 'function') {
                        try {
                            const res = await sdk.getAllAShareQuotes({
                                batchSize: 300,
                                concurrency: 4,
                            });
                            const arr = Array.isArray(res) ? res : res?.items || [];
                            const seen = new Set();
                            for (const q of arr) {
                                const cd = normalizeCode(q.code || q.symbol || '');
                                if (!cd || seen.has(cd))
                                    continue;
                                seen.add(cd);
                                rows.push({
                                    code: cd,
                                    code_name: q.name || cd,
                                    tradeStatus: '1',
                                    industry: builtinIndustryFromName(q.name || ''),
                                });
                            }
                        }
                        catch (e) {
                            this.logger.warn(`getAllAShareQuotes failed: ${e?.message}`);
                        }
                    }
                    else if (typeof sdk.getSimpleQuotes === 'function') {
                        const pool = ['SH600519', 'SZ000858', 'SH601318', 'SZ000001', 'SH600036', 'SZ002594', 'SZ300750', 'SH601899', 'SH600900', 'SZ000333', 'SZ002415', 'SH601012', 'SH688981', 'SZ002475', 'SH603259', 'SZ300059', 'SH600030', 'SZ000725', 'SH600276', 'SH688111'];
                        try {
                            const qs = await sdk.getSimpleQuotes(pool);
                            const arr = Array.isArray(qs) ? qs : qs?.items || [];
                            for (const q of arr) {
                                const cd = normalizeCode(q.code || q.symbol || '');
                                if (!cd)
                                    continue;
                                rows.push({
                                    code: cd,
                                    code_name: q.name || cd,
                                    tradeStatus: '1',
                                    industry: builtinIndustryFromName(q.name || ''),
                                });
                            }
                        }
                        catch {
                            /* ignore */
                        }
                    }
                }
                catch (e) {
                    this.logger.warn(`stock-sdk list path failed: ${e?.message}`);
                }
                if (rows && rows.length >= 20) {
                    rows = this.augmentWithHotPool(rows);
                    return { items: rows };
                }
            }
        }
        catch (err) {
            this.logger.warn(`fetchAllStockList failed: ${err?.message}`);
        }
        const builtin = this.builtinStockList();
        return { items: builtin };
    }
    addToListFromSearch(seen, item) {
        if (!item)
            return;
        const codeRaw = item.code || item.symbol || item.value || '';
        const name = item.name || item.label || '';
        if (!codeRaw || !name)
            return;
        const cd = normalizeCode(codeRaw);
        if (!cd || cd.length < 8)
            return;
        if (seen.has(cd))
            return;
        seen.set(cd, {
            code: cd,
            code_name: String(name),
            tradeStatus: '1',
            industry: builtinIndustryFromName(String(name)),
        });
    }
    augmentWithHotPool(rows) {
        const hot = this.builtinStockList();
        const map = new Map();
        for (const r of rows)
            if (r?.code)
                map.set(r.code, r);
        for (const h of hot)
            if (!map.has(h.code))
                map.set(h.code, h);
        return Array.from(map.values());
    }
    builtinStockList() {
        const hot = [
            ['sh.600519', '贵州茅台'],
            ['sz.000858', '五粮液'],
            ['sz.002594', '比亚迪'],
            ['sz.300750', '宁德时代'],
            ['sh.601318', '中国平安'],
            ['sh.600036', '招商银行'],
            ['sh.601899', '紫金矿业'],
            ['sh.600900', '长江电力'],
            ['sz.000333', '美的集团'],
            ['sz.002415', '海康威视'],
            ['sh.601012', '隆基绿能'],
            ['sh.688981', '中芯国际'],
            ['sz.002475', '立讯精密'],
            ['sh.603259', '药明康德'],
            ['sz.300059', '东方财富'],
            ['sh.600030', '中信证券'],
            ['sz.000725', '京东方A'],
            ['sh.600276', '恒瑞医药'],
            ['sh.688111', '金山办公'],
            ['sz.000001', '平安银行'],
            ['sz.000002', '万科A'],
            ['sh.601166', '兴业银行'],
            ['sh.600000', '浦发银行'],
            ['sz.002142', '宁波银行'],
            ['sh.601398', '工商银行'],
            ['sh.601288', '农业银行'],
            ['sh.601988', '中国银行'],
            ['sh.601328', '交通银行'],
            ['sh.600887', '伊利股份'],
            ['sz.300760', '迈瑞医疗'],
            ['sh.600585', '海螺水泥'],
            ['sh.601668', '中国建筑'],
            ['sz.000651', '格力电器'],
            ['sh.600690', '海尔智家'],
            ['sz.002415', '海康威视'],
            ['sz.300015', '爱尔眼科'],
            ['sh.600031', '三一重工'],
            ['sh.601888', '中国中免'],
            ['sz.000568', '泸州老窖'],
            ['sz.000596', '古井贡酒'],
            ['sh.600809', '山西汾酒'],
            ['sh.600745', '闻泰科技'],
            ['sh.603501', '韦尔股份'],
            ['sz.002049', '紫光国微'],
            ['sh.688012', '中微公司'],
            ['sh.603986', '兆易创新'],
            ['sz.300308', '中际旭创'],
            ['sh.601138', '工业富联'],
            ['sz.002371', '北方华创'],
            ['sz.002555', '三七互娱'],
            ['sz.300413', '芒果超媒'],
            ['sh.600941', '中国移动'],
            ['sh.601728', '中国电信'],
            ['sh.600050', '中国联通'],
            ['sz.000063', '中兴通讯'],
            ['sz.300750', '宁德时代'],
            ['sz.002812', '恩捷股份'],
            ['sz.300014', '亿纬锂能'],
            ['sh.600089', '特变电工'],
            ['sz.002230', '科大讯飞'],
            ['sz.300496', '中科创达'],
            ['sh.688036', '传音控股'],
            ['sz.002236', '大华股份'],
            ['sh.600570', '恒生电子'],
            ['sz.002027', '分众传媒'],
            ['sh.601633', '长城汽车'],
            ['sz.000625', '长安汽车'],
            ['sh.600104', '上汽集团'],
            ['sh.601601', '中国太保'],
            ['sh.601318', '中国平安'],
            ['sh.601628', '中国人寿'],
            ['sh.000001', '上证指数'],
            ['sz.399001', '深证成指'],
            ['sz.399006', '创业板指'],
            ['sh.000300', '沪深300'],
            ['sh.000688', '科创50'],
        ];
        return hot.map(([code, name]) => ({
            code,
            code_name: name,
            tradeStatus: '1',
            industry: builtinIndustryFromName(name),
        }));
    }
    async fetchIndustryList() {
        const all = await this.fetchAllStockList();
        return all;
    }
    async fetchFinance(type, code, year, quarter) {
        void type;
        void code;
        void year;
        void quarter;
        const years = [year, year - 1, year - 2, year - 3];
        const items = [];
        for (const y of years) {
            for (let q = 1; q <= 4; q++) {
                if (y === year && q > quarter)
                    continue;
                let seed = y * 100 + q;
                for (let i = 0; i < code.length; i++)
                    seed += code.charCodeAt(i);
                const rnd = ((seed * 9301 + 49297) % 233280) / 233280;
                const dateStr = `${y}-${String(Math.min(q * 3, 12)).padStart(2, '0')}-${[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Math.min(q * 3 - 1, 11)]}`;
                const row = { code, statDate: dateStr };
                const scale = 0.7 + rnd * 0.6;
                switch (type) {
                    case 'profit':
                        row.roeAvg = +(8 * scale + rnd * 15).toFixed(3);
                        row.gpMargin = +(25 * scale + rnd * 40).toFixed(3);
                        row.npMargin = +(5 * scale + rnd * 18).toFixed(3);
                        break;
                    case 'operation':
                        row.AssetTurnRatio = +(0.4 * scale + rnd * 1.2).toFixed(3);
                        row.INVTurnRatio = +(2 * scale + rnd * 10).toFixed(3);
                        break;
                    case 'growth':
                        row.YOYNI = +((rnd - 0.35) * 45).toFixed(3);
                        row.YOYEquity = +((rnd - 0.3) * 35).toFixed(3);
                        break;
                    case 'dupont':
                        row.dupontROE = +(8 * scale + rnd * 14).toFixed(3);
                        row.dupontAssetTurn = +(0.4 * scale + rnd * 1.1).toFixed(3);
                        row.dupontAssetStoEquity = +(1.5 + rnd * 3).toFixed(3);
                        break;
                }
                items.push(row);
            }
        }
        return { items };
    }
};
exports.StockSdkDataService = StockSdkDataService;
exports.StockSdkDataService = StockSdkDataService = StockSdkDataService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], StockSdkDataService);
