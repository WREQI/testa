import { STOCK_POOL_BUILTIN, type StockBasicLite } from './stock-pool.data';
import { pinyin } from 'pinyin-pro';

let allPool: StockBasicLite[] | null = null;

function getAllPool(): StockBasicLite[] {
  if (allPool) return allPool;
  allPool = STOCK_POOL_BUILTIN.slice();
  return allPool;
}

export interface SearchMatch {
  code: string;
  name: string;
  type: 'stock' | 'index';
  industry?: string;
  score: number;
}

function normalize(s: string): string {
  return (s || '').toLowerCase().trim();
}

function namePinyinInitials(name: string): string {
  try {
    return pinyin(name, { pattern: 'first', toneType: 'none', type: 'string', v: false })
      .replace(/\s+/g, '')
      .toLowerCase();
  } catch {
    return name.toLowerCase();
  }
}

export function searchStockLocally(query: string, limit = 20): SearchMatch[] {
  const q = normalize(query);
  if (!q) return [];
  const pool = getAllPool();
  const matches: SearchMatch[] = [];
  for (const s of pool) {
    const code = normalize(s.code);
    const name = normalize(s.name);
    const py = namePinyinInitials(s.name);
    let score = 0;
    if (code.includes(q)) score += Math.max(0, 100 - Math.abs(code.length - q.length) * 3);
    if (name.startsWith(q)) score += 150;
    else if (name.includes(q)) score += 80;
    if (py && py.includes(q)) score += 60;
    if (score > 0) {
      matches.push({
        code: s.code,
        name: s.name,
        type: s.type,
        industry: s.industry,
        score,
      });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}

export function getStockBasicByCode(code: string): StockBasicLite | null {
  const pool = getAllPool();
  return pool.find((s) => s.code === code) || null;
}

export function getAllIndustries(): string[] {
  const pool = getAllPool();
  const set = new Set<string>();
  for (const s of pool) if (s.industry) set.add(s.industry);
  return Array.from(set).sort();
}

export function getStocksByIndustry(industry: string): StockBasicLite[] {
  const pool = getAllPool();
  return pool.filter((s) => s.industry === industry);
}
