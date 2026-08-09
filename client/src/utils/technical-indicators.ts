import type { KlineItem } from '@shared/api.interface';

export function calcMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= period) sum -= closes[i - period];
    result.push(i >= period - 1 ? sum / period : null);
  }
  return result;
}

export interface MACDResult {
  dif: (number | null)[];
  dea: (number | null)[];
  macd: (number | null)[];
}

function calcEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function calcMACD(closes: number[]): MACDResult {
  if (closes.length === 0) {
    return { dif: [], dea: [], macd: [] };
  }
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const dif: number[] = closes.map((_, i) => ema12[i] - ema26[i]);
  const deaArr = calcEMA(dif, 9);
  const macd: number[] = dif.map((v, i) => 2 * (v - deaArr[i]));
  return {
    dif: dif.map((v) => v),
    dea: deaArr,
    macd,
  };
}

export interface KDJResult {
  k: (number | null)[];
  d: (number | null)[];
  j: (number | null)[];
}

export function calcKDJ(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 9,
): KDJResult {
  const n = closes.length;
  const k: (number | null)[] = new Array(n).fill(null);
  const d: (number | null)[] = new Array(n).fill(null);
  const j: (number | null)[] = new Array(n).fill(null);

  let prevK = 50;
  let prevD = 50;

  for (let i = period - 1; i < n; i++) {
    let highest = highs[i];
    let lowest = lows[i];
    for (let j = i - period + 1; j <= i; j++) {
      if (highs[j] > highest) highest = highs[j];
      if (lows[j] < lowest) lowest = lows[j];
    }
    const rsv = highest === lowest ? 50 : ((closes[i] - lowest) / (highest - lowest)) * 100;
    const curK = (2 * prevK + rsv) / 3;
    const curD = (2 * prevD + curK) / 3;
    const curJ = 3 * curK - 2 * curD;
    k[i] = curK;
    d[i] = curD;
    j[i] = curJ;
    prevK = curK;
    prevD = curD;
  }

  return { k, d, j };
}

export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const n = closes.length;
  const result: (number | null)[] = new Array(n).fill(null);
  if (n < period + 1) return result;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

export interface CrossSignal {
  date: string;
  type: 'golden' | 'death';
  price: number;
  shortMA: number;
  longMA: number;
  index: number;
}

export function detectCrossSignals(
  items: KlineItem[],
  shortPeriod = 5,
  longPeriod = 10,
): CrossSignal[] {
  const signals: CrossSignal[] = [];
  if (items.length < longPeriod + 1) return signals;

  const closes = items.map((item) => item.close);
  const shortMA = calcMA(closes, shortPeriod);
  const longMA = calcMA(closes, longPeriod);

  for (let i = longPeriod; i < items.length; i++) {
    const prevShort = shortMA[i - 1];
    const prevLong = longMA[i - 1];
    const curShort = shortMA[i];
    const curLong = longMA[i];
    if (prevShort === null || prevLong === null || curShort === null || curLong === null) continue;

    if (prevShort <= prevLong && curShort > curLong) {
      signals.push({
        date: items[i].date,
        type: 'golden',
        price: items[i].close,
        shortMA: curShort,
        longMA: curLong,
        index: i,
      });
    } else if (prevShort >= prevLong && curShort < curLong) {
      signals.push({
        date: items[i].date,
        type: 'death',
        price: items[i].close,
        shortMA: curShort,
        longMA: curLong,
        index: i,
      });
    }
  }

  return signals;
}
