import {
  Newspaper,
  Trophy,
  BarChart3,
  BellRing,
  Grid3x3,
  Activity,
  PieChart,
  MoreHorizontal,
} from 'lucide-react';
import MarketHeader from './MarketHeader';
import MarketIndices from './MarketIndices';
import MarketRankList from './MarketRankList';

// ============ 大盘分析模块 ============

const RISE_FALL_DISTRIBUTION = [
  { label: '涨停', count: 15, type: 'up-extreme' as const },
  { label: '>7%', count: 80, type: 'up' as const },
  { label: '7~5%', count: 120, type: 'up' as const },
  { label: '5~2%', count: 250, type: 'up' as const },
  { label: '2~0%', count: 380, type: 'up' as const },
  { label: '平', count: 50, type: 'flat' as const },
  { label: '0~2%', count: 400, type: 'down' as const },
  { label: '2~5%', count: 320, type: 'down' as const },
  { label: '5~7%', count: 180, type: 'down' as const },
  { label: '7%<', count: 90, type: 'down' as const },
  { label: '跌停', count: 10, type: 'down-extreme' as const },
];

const TOTAL_RISE = 845;
const TOTAL_FALL = 1000;
const TOTAL_AMOUNT = '9865'; // mock 成交额 亿

function MarketAnalysis() {
  const maxCount = Math.max(...RISE_FALL_DISTRIBUTION.map((d) => d.count));

  return (
    <div className="mx-4 bg-card border border-border rounded-lg p-4">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">大盘分析</h2>
        <div className="text-xs text-muted-foreground">
          成交额 <span className="font-mono text-foreground">{TOTAL_AMOUNT}</span>亿
        </div>
      </div>

      {/* 涨跌分布柱状图 */}
      <div className="flex items-end justify-between gap-0.5 h-20 mb-2">
        {RISE_FALL_DISTRIBUTION.map((item, i) => {
          const heightPct = (item.count / maxCount) * 100;
          const barColor =
            item.type === 'up' || item.type === 'up-extreme'
              ? 'bg-up/80'
              : item.type === 'down' || item.type === 'down-extreme'
                ? 'bg-down/80'
                : 'bg-muted-foreground/40';
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end"
            >
              <span className="text-[10px] font-mono text-muted-foreground mb-0.5">
                {item.count}
              </span>
              <div
                className={`w-full ${barColor} rounded-sm`}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* 底部标签 */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {RISE_FALL_DISTRIBUTION.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            {d.label}
          </div>
        ))}
      </div>

      {/* 涨跌家数对比 */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-up" />
          <span className="text-xs text-muted-foreground">涨</span>
          <span className="font-mono text-sm text-up font-semibold">
            {TOTAL_RISE}家
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-down font-semibold">
            {TOTAL_FALL}家
          </span>
          <span className="text-xs text-muted-foreground">跌</span>
          <span className="w-2 h-2 rounded-full bg-down" />
        </div>
      </div>
    </div>
  );
}

// ============ 功能入口行 ============

const FEATURE_ENTRIES = [
  { icon: Newspaper, label: '打新日历' },
  { icon: Trophy, label: '龙虎榜' },
  { icon: BarChart3, label: '热门ETF' },
  { icon: BellRing, label: '条件单' },
  { icon: Grid3x3, label: '网格交易' },
  { icon: Activity, label: '资金流向' },
  { icon: PieChart, label: '估值分析' },
  { icon: MoreHorizontal, label: '更多' },
];

function FeatureEntries() {
  return (
    <div className="overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex gap-x-5 gap-y-2 flex-wrap">
        {FEATURE_ENTRIES.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <button
              key={i}
              className="flex flex-col items-center gap-1 py-1 w-12"
            >
              <div className="size-10 rounded-lg bg-card border border-border flex items-center justify-center">
                <Icon className="size-5 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {entry.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ 热门板块模块 ============

interface SectorItem {
  name: string;
  pctChg: number;
  desc: string;
}

const HOT_SECTORS: SectorItem[] = [
  { name: '半导体', pctChg: 3.25, desc: '领涨板块' },
  { name: '新能源', pctChg: 2.18, desc: '资金净流入' },
  { name: 'AI算力', pctChg: 1.95, desc: '领涨' },
  { name: '医药', pctChg: -2.1, desc: '领跌板块' },
  { name: '消费', pctChg: -1.5, desc: '领跌' },
  { name: '金融', pctChg: -0.8, desc: '资金净流出' },
];

function HotSectors() {
  return (
    <div className="mx-4 bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">热门板块</h2>
        <button className="text-xs text-muted-foreground flex items-center">
          更多 <span className="ml-0.5">›</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {HOT_SECTORS.map((sector, i) => {
          const isUp = sector.pctChg >= 0;
          return (
            <div
              key={i}
              className="bg-background border border-border rounded-md p-2.5 active:bg-accent/30"
            >
              <div className="text-sm text-foreground font-medium truncate">
                {sector.name}
              </div>
              <div
                className={`font-mono text-lg font-semibold mt-1 ${
                  isUp ? 'text-up' : 'text-down'
                }`}
              >
                {isUp ? '+' : ''}
                {sector.pctChg.toFixed(2)}%
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {sector.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ 主页面 ============

const MarketPage = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      <MarketHeader />
      <div className="flex-1 overflow-y-auto pb-[24px] [&::-webkit-scrollbar]:hidden">
        {/* 主要指数卡片 */}
        <MarketIndices />

        {/* 大盘分析 */}
        <MarketAnalysis />

        {/* 功能入口 */}
        <FeatureEntries />

        {/* 热门板块 */}
        <HotSectors />

        {/* 股票排行 */}
        <MarketRankList />
      </div>
    </div>
  );
};

export default MarketPage;
