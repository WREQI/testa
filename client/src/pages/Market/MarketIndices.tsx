import { useState, useEffect } from 'react';
import { getQuote } from '@client/src/api/stock';
import type { IndexQuote } from '@shared/api.interface';

const INDEX_LIST = [
  { code: 'sh.000001', name: '上证指数' },
  { code: 'sz.399001', name: '深证成指' },
  { code: 'sz.399006', name: '创业板指' },
];

function safeQuote(code: string, name: string, data: any): IndexQuote {
  const close = Number(data?.close) || 0;
  const change = Number(data?.change) || 0;
  const pctChg = Number(data?.pctChg) || 0;
  return { code, name, close, change, pctChg };
}

// 生成10个点的迷你走势模拟数据
function generateMiniPoints(base: number, pctChg: number): number[] {
  const points: number[] = [];
  const start = base / (1 + pctChg / 100);
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    // 基础线性 + 正弦波动，模拟日内走势
    const noise = Math.sin(t * Math.PI * 2.3) * 0.3 + Math.sin(t * Math.PI * 5) * 0.15;
    const val = start + (base - start) * t + noise * (base - start) * 0.3;
    points.push(val);
  }
  return points;
}

function MiniChart({
  points,
  color,
}: {
  points: number[];
  color: string;
}) {
  const width = 120;
  const height = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const stepX = width / (points.length - 1);
  const pathData = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  // 填充区域
  const areaData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaData} fill={`url(#grad-${color})`} />
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface IndexCardProps {
  quote: IndexQuote;
}

function IndexCard({ quote }: IndexCardProps) {
  const isUp = quote.pctChg >= 0;
  const color = isUp
    ? 'hsl(0, 75%, 55%)'
    : 'hsl(145, 60%, 45%)';
  const points = generateMiniPoints(quote.close, quote.pctChg);

  return (
    <div className="w-[85vw] flex-shrink-0 snap-start">
      <div className="bg-card border border-border rounded-lg px-4 py-3 h-full">
        <div className="text-xs text-muted-foreground mb-1">{quote.name}</div>
        <div className={`font-mono font-bold text-xl leading-tight ${
          isUp ? 'text-up' : 'text-down'
        }`}>
          {quote.close.toFixed(2)}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`font-mono text-xs ${isUp ? 'text-up' : 'text-down'}`}>
            {quote.change >= 0 ? '+' : ''}
            {quote.change.toFixed(2)}
          </span>
          <span className={`font-mono text-xs ${isUp ? 'text-up' : 'text-down'}`}>
            {quote.pctChg >= 0 ? '+' : ''}
            {quote.pctChg.toFixed(2)}%
          </span>
        </div>
        <div className="mt-2 -mx-1">
          <MiniChart points={points} color={color} />
        </div>
      </div>
    </div>
  );
}

const MarketIndices = () => {
  const [quotes, setQuotes] = useState<IndexQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const results = await Promise.all(
          INDEX_LIST.map(async (idx) => {
            try {
              const data = await getQuote(idx.code);
              return safeQuote(idx.code, idx.name, data);
            } catch {
              return safeQuote(idx.code, idx.name, null);
            }
          }),
        );
        if (!cancelled) setQuotes(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="snap-x snap-mandatory flex gap-3 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-[85vw] flex-shrink-0 snap-start bg-card border border-border rounded-lg px-4 py-3 h-28 animate-pulse"
          />
        ))}
      {!loading &&
        quotes.map((q) => <IndexCard key={q.code} quote={q} />)}
    </div>
  );
};

export default MarketIndices;
