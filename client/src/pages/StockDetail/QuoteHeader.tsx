import type { StockQuote } from '@shared/api.interface';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { AlertTriangle, Star } from 'lucide-react';
import { useWatchlist } from '@client/src/hooks/useWatchlist';
import { Button } from '@client/src/components/ui/button';

function formatNumber(v: number | undefined | null, digits = 2): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '--';
  return v.toFixed(digits);
}

function formatVolume(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '--';
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
  return String(v);
}

function DemoBadge() {
  return (
    <span className="inline-block text-[10px] text-muted-foreground bg-accent px-1 rounded-sm ml-1 align-middle">
      演示
    </span>
  );
}

interface QuoteHeaderProps {
  quote: StockQuote | null | undefined;
  loading: boolean;
  error: boolean;
}

const QuoteHeader = ({ quote, loading, error }: QuoteHeaderProps) => {
  const { isWatched, toggle } = useWatchlist();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-sm p-4" data-ai-section-type="card-stat">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 mt-4">
            {Array.from({ length: 21 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="bg-card border border-border rounded-sm p-4 text-center text-muted-foreground text-sm">
        {error ? (
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="size-4" />
            行情数据获取失败
          </div>
        ) : (
          '暂无行情数据'
        )}
      </div>
    );
  }

  const isUp = quote.change >= 0;
  const changeClass = isUp ? 'text-up' : 'text-down';
  const changePrefix = isUp ? '+' : '';
  const isIndex = /^sh\.000|^sz\.399/.test(quote.code);
  const marketSuffix = isIndex
    ? ''
    : quote.code.startsWith('sh.') || quote.code.startsWith('6')
      ? '.SH'
      : '.SZ';

  // 模拟行业涨跌幅
  const industryPct = 0.65 + Math.random() * 0.5;

  // 三列行情指标
  const leftCol: Array<{ label: string; value: string; demo?: boolean }> = [
    { label: '今开', value: formatNumber(quote.open) },
    { label: '成交量', value: formatVolume(quote.volume) },
    { label: '换手率', value: quote.turn !== undefined ? `${formatNumber(quote.turn)}%` : '--' },
    { label: '最高', value: formatNumber(quote.high) },
    { label: '成交额', value: formatVolume(quote.amount) },
    { label: '量比', value: '1.28', demo: true },
    ...(isIndex ? [] : [{ label: '涨停价', value: formatNumber(quote.preClose * 1.1), demo: true }]),
  ];

  const midCol: Array<{ label: string; value: string; demo?: boolean }> = [
    { label: '昨收', value: formatNumber(quote.preClose) },
    { label: '最低', value: formatNumber(quote.low) },
    ...(isIndex
      ? []
      : [
          { label: '市盈TTM', value: formatNumber(quote.peTTM) },
          { label: '市净率', value: formatNumber(quote.pbMRQ) },
        ]),
    { label: '总市值', value: isIndex ? '--' : '2856亿', demo: !isIndex },
    { label: '流通市值', value: isIndex ? '--' : '2640亿', demo: !isIndex },
    { label: '52周高', value: formatNumber(quote.high * 1.25), demo: true },
  ];

  const rightCol: Array<{ label: string; value: string; demo?: boolean }> = [
    { label: '均价', value: formatNumber((quote.high + quote.low + quote.close) / 3), demo: true },
    { label: '振幅', value: `${formatNumber(((quote.high - quote.low) / quote.preClose) * 100)}%` },
    { label: '内盘', value: formatVolume(quote.volume * 0.45), demo: true },
    { label: '外盘', value: formatVolume(quote.volume * 0.55), demo: true },
    { label: '委比', value: '+12.5%', demo: true },
    ...(isIndex ? [] : [{ label: '市盈动', value: '28.6', demo: true }]),
    { label: '52周低', value: formatNumber(quote.low * 0.75), demo: true },
  ];

  const renderCol = (items: Array<{ label: string; value: string; demo?: boolean }>) => (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between items-baseline text-xs">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-mono font-tabular text-foreground">
            {item.value}
            {item.demo && <DemoBadge />}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-sm p-4 space-y-4" data-ai-section-type="card-stat">
      {/* 股票名称 + 代码 + 自选 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold text-foreground flex items-center gap-2">
            {quote.name}
            <Button
              size="sm"
              variant={isWatched(quote.code) ? 'default' : 'outline'}
              className="h-6 px-2 text-[11px] gap-1"
              onClick={() => toggle(quote.code, quote.name)}
            >
              <Star
                className={`size-3 ${isWatched(quote.code) ? 'fill-current' : ''}`}
              />
              {isWatched(quote.code) ? '已加' : '加自选'}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground font-mono font-tabular mt-0.5">
            {quote.code}{marketSuffix}
          </div>
        </div>
        {/* 行业 */}
        <div className="text-right text-xs">
          <div className="text-muted-foreground">
            半导体
            <DemoBadge />
          </div>
          <div className="font-mono font-tabular text-up mt-0.5">+{industryPct.toFixed(2)}%</div>
        </div>
      </div>

      {/* 价格 + 涨跌 */}
      <div>
        <div className={`text-5xl font-bold font-mono font-tabular leading-tight ${changeClass}`}>
          {formatNumber(quote.close)}
        </div>
        <div className={`text-sm font-mono font-tabular mt-1 ${changeClass}`}>
          {changePrefix}
          {formatNumber(quote.change)}
          <span className="ml-2">
            {changePrefix}
            {formatNumber(quote.pctChg)}%
          </span>
        </div>
      </div>

      {/* 状态 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block size-1.5 rounded-full bg-muted-foreground" />
        <span>已休市</span>
        <span className="font-mono font-tabular">{quote.updateTime || '2026-08-08 15:00'}</span>
      </div>

      {/* 三列行情数据网格 */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-0 pt-1 border-t border-border">
        {renderCol(leftCol)}
        {renderCol(midCol)}
        {renderCol(rightCol)}
      </div>
    </div>
  );
};

export default QuoteHeader;
