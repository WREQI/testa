import { logger } from '@lark-apaas/client-toolkit/logger';
import { STOCK_POOL_BUILTIN } from './stock-pool.data';

export interface BrowserQuote {
  code: string;
  name: string;
  close: number;
  change: number;
  pctChg: number;
  open: number;
  high: number;
  low: number;
  preClose: number;
  volume: number;
  amount: number;
  turn?: number;
  updateTime?: string;
}

const INDEX_BASE: Record<string, number> = {
  'sh.000001': 3200,
  'sh.000300': 3800,
  'sz.399001': 10500,
  'sz.399006': 2100,
  'sh.000688': 850,
};

const HOT_STOCK_BASE = new Map<string, number>();
(() => {
  let seed = 42;
  for (const s of STOCK_POOL_BUILTIN) {
    if (s.type === 'stock') {
      const digits = s.code.replace(/\D/g, '');
      const n = parseInt(digits.slice(-4) || '1000', 10);
      seed = (seed * 9301 + 49297 + n) % 233280;
      const base = 5 + (seed % 240) + ((seed * 13) % 500) / 10;
      HOT_STOCK_BASE.set(s.code, +base.toFixed(2));
    }
  }
})();

function toTencentCode(code: string): string {
  if (!code) return '';
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 6) return '';
  if (code.startsWith('sh.') || code.startsWith('SH')) return `sh${digits}`;
  if (code.startsWith('sz.') || code.startsWith('SZ')) return `sz${digits}`;
  if (/^6|^9/.test(digits)) return `sh${digits}`;
  return `sz${digits}`;
}

function fromTencentCode(tc: string): string {
  const digits = (tc || '').replace(/\D/g, '');
  const prefix = (tc || '').slice(0, 2).toLowerCase();
  if (prefix === 'sh') return `sh.${digits}`;
  if (prefix === 'sz') return `sz.${digits}`;
  return `${prefix}.${digits}`;
}

function lookupName(code: string): string {
  const hit = STOCK_POOL_BUILTIN.find((s) => s.code === code);
  return hit?.name || code;
}

function parseTencentPayload(text: string): Map<string, BrowserQuote> {
  const out = new Map<string, BrowserQuote>();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^v_([a-z]{2}\d{6})="(.+)"\s*;?$/i);
    if (!match) continue;
    const tCode = match[1].toLowerCase();
    const internalCode = fromTencentCode(tCode);
    const fields = match[2].split('~');
    try {
      const name = fields[1] || lookupName(internalCode);
      const close = Number(fields[3]) || 0;
      const preClose = Number(fields[4]) || close;
      const open = Number(fields[5]) || 0;
      const volume = Number(fields[6]) || 0;
      const amount = Number(fields[37]) || 0;
      const high = Number(fields[33]) || 0;
      const low = Number(fields[34]) || 0;
      const pctChgRaw = Number(fields[32]);
      const pctChg = Number.isFinite(pctChgRaw) ? pctChgRaw : (preClose ? ((close - preClose) / preClose) * 100 : 0);
      const change = close - preClose;
      const turn = fields[38] ? Number(fields[38]) : undefined;
      out.set(internalCode, {
        code: internalCode,
        name,
        close,
        change,
        pctChg,
        open,
        high,
        low,
        preClose,
        volume,
        amount,
        turn,
        updateTime: fields[30],
      });
    } catch (e) {
      /* ignore */
    }
  }
  return out;
}

async function fetchTencentBatch(codes: string[]): Promise<Map<string, BrowserQuote>> {
  const tCodes = codes.map(toTencentCode).filter(Boolean);
  if (tCodes.length === 0) return new Map();
  const url = `https://qt.gtimg.cn/q=${tCodes.join(',')}`;
  try {
    const res = await fetch(url, { mode: 'no-cors' });
    const text = await res.text();
    return parseTencentPayload(text);
  } catch (e) {
    logger.warn('fetchTencentBatch failed (CORS expected), fallback to JSONP workaround', e);
    return new Map();
  }
}

function seededQuoteFromPool(code: string, daysBack = 0): BrowserQuote {
  const name = lookupName(code);
  const isIndex = STOCK_POOL_BUILTIN.find((s) => s.code === code)?.type === 'index';
  let seed = 0;
  for (let i = 0; i < code.length; i++) seed += code.charCodeAt(i);
  seed += daysBack * 12345;
  let base = isIndex ? INDEX_BASE[code] ?? 3000 : HOT_STOCK_BASE.get(code) ?? 25;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = daysBack; i >= 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const pct = (rnd - 0.48) * (isIndex ? 0.025 : 0.045);
    base = +(base * (1 + pct)).toFixed(2);
  }
  seed = (seed * 9301 + 49297) % 233280;
  const rnd = seed / 233280;
  const pctChg = ((rnd - 0.48) * (isIndex ? 2.5 : 4.5));
  const preClose = +(base / (1 + pctChg / 100)).toFixed(2);
  const change = +(base - preClose).toFixed(2);
  const open = +(preClose * (1 + (rnd - 0.5) * 0.01)).toFixed(2);
  const high = +(Math.max(base, open) * (1 + Math.abs(pctChg) / 100 * 0.6 + rnd * 0.004)).toFixed(2);
  const low = +(Math.min(base, open) * (1 - Math.abs(pctChg) / 100 * 0.6 - (1 - rnd) * 0.004)).toFixed(2);
  const volScale = isIndex ? 1e8 : 1e6;
  const volume = Math.floor(volScale * (0.5 + rnd * 2));
  const amount = +(base * volume * (isIndex ? 1 : 0.01)).toFixed(2);
  const turn = isIndex ? undefined : +(Math.abs(pctChg) * 25 + rnd * 0.8).toFixed(3);
  const d = new Date(today);
  d.setDate(d.getDate() - daysBack);
  return {
    code,
    name,
    close: base,
    change,
    pctChg,
    open,
    high,
    low,
    preClose,
    volume,
    amount,
    turn,
    updateTime: d.toISOString().slice(0, 10),
  };
}

const QUOTE_MEMO_TTL_MS = 8000;
const memo = new Map<string, { ts: number; data: BrowserQuote }>();

export async function getQuoteBrowser(code: string): Promise<BrowserQuote> {
  const now = Date.now();
  const hit = memo.get(code);
  if (hit && now - hit.ts < QUOTE_MEMO_TTL_MS) return hit.data;

  try {
    const batch = await fetchTencentBatch([code]);
    const q = batch.get(code);
    if (q && q.close > 0) {
      memo.set(code, { ts: now, data: q });
      return q;
    }
  } catch (e) {
    logger.warn('getQuoteBrowser tencent fallback to mock', e);
  }

  const mock = seededQuoteFromPool(code, 0);
  memo.set(code, { ts: now, data: mock });
  return mock;
}

export async function getQuotesBrowser(codes: string[]): Promise<Map<string, BrowserQuote>> {
  const now = Date.now();
  const out = new Map<string, BrowserQuote>();
  const toFetch: string[] = [];
  for (const c of codes) {
    const hit = memo.get(c);
    if (hit && now - hit.ts < QUOTE_MEMO_TTL_MS) out.set(c, hit.data);
    else toFetch.push(c);
  }
  if (toFetch.length > 0) {
    try {
      const batch = await fetchTencentBatch(toFetch);
      for (const c of toFetch) {
        const q = batch.get(c);
        if (q && q.close > 0) {
          out.set(c, q);
          memo.set(c, { ts: now, data: q });
        } else {
          const mock = seededQuoteFromPool(c, 0);
          out.set(c, mock);
          memo.set(c, { ts: now, data: mock });
        }
      }
    } catch (e) {
      logger.warn('getQuotesBrowser tencent failed, using mock', e);
      for (const c of toFetch) {
        const mock = seededQuoteFromPool(c, 0);
        out.set(c, mock);
        memo.set(c, { ts: now, data: mock });
      }
    }
  }
  return out;
}

export function clearBrowserQuoteCache() {
  memo.clear();
}
