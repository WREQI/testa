import { useState } from 'react';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@client/src/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { toast } from 'sonner';
import KLineChart from '@client/src/components/KLineChart/KLineChart';
import type { IndicatorType } from '@client/src/components/KLineChart/KLineChart';
import type { KlineItem } from '@shared/api.interface';
import { AlertTriangle } from 'lucide-react';

export type Period = 'd' | 'w' | 'm';
export type Adjust = 1 | 2 | 3;
export type RangeKey = '1m' | '3m' | '6m' | '1y' | '3y' | 'all';
type KlinePeriodTab = '分时' | '五日' | '日K' | '周K' | '月K' | '更多';

interface KlineSectionProps {
  items: KlineItem[];
  loading: boolean;
  error: boolean;
  period: Period;
  adjust: Adjust;
  range: RangeKey;
  indicator: IndicatorType;
  onPeriodChange: (p: Period) => void;
  onAdjustChange: (a: Adjust) => void;
  onRangeChange: (r: RangeKey) => void;
  onIndicatorChange: (i: IndicatorType) => void;
}

const KlineSection = ({
  items,
  loading,
  error,
  period,
  adjust,
  range,
  indicator,
  onPeriodChange,
  onAdjustChange,
  onRangeChange,
  onIndicatorChange,
}: KlineSectionProps) => {
  const [klineTab, setKlineTab] = useState<KlinePeriodTab>('日K');

  const handleTabChange = (tab: KlinePeriodTab) => {
    setKlineTab(tab);
    if (tab === '日K') onPeriodChange('d');
    else if (tab === '周K') onPeriodChange('w');
    else if (tab === '月K') onPeriodChange('m');
    else if (tab === '更多') {
      toast('更多周期开发中');
    }
    // 分时 / 五日：用当前数据模拟展示
  };

  const showDemoBadge = klineTab === '分时' || klineTab === '五日';

  return (
    <div className="bg-card border border-border rounded-sm p-3 space-y-2">
      {/* 周期 Tab */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(['分时', '五日', '日K', '周K', '月K', '更多'] as KlinePeriodTab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`text-xs px-2 py-1 rounded-sm font-medium transition-colors ${
                klineTab === t
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {showDemoBadge && (
          <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
            演示数据
          </span>
        )}
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">复权</span>
          <ToggleGroup
            type="single"
            value={String(adjust)}
            onValueChange={(v: string) => v && onAdjustChange(Number(v) as Adjust)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="2" className="text-[11px] h-6 px-2">前复权</ToggleGroupItem>
            <ToggleGroupItem value="3" className="text-[11px] h-6 px-2">后复权</ToggleGroupItem>
            <ToggleGroupItem value="1" className="text-[11px] h-6 px-2">不复权</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">指标</span>
          <Select value={indicator} onValueChange={(v: string) => onIndicatorChange(v as IndicatorType)}>
            <SelectTrigger className="w-20 h-6 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">关闭</SelectItem>
              <SelectItem value="macd">MACD</SelectItem>
              <SelectItem value="kdj">KDJ</SelectItem>
              <SelectItem value="rsi">RSI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v: string) => v && onRangeChange(v as RangeKey)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="1m" className="text-[11px] h-6 px-1.5">1月</ToggleGroupItem>
            <ToggleGroupItem value="3m" className="text-[11px] h-6 px-1.5">3月</ToggleGroupItem>
            <ToggleGroupItem value="6m" className="text-[11px] h-6 px-1.5">半年</ToggleGroupItem>
            <ToggleGroupItem value="1y" className="text-[11px] h-6 px-1.5">1年</ToggleGroupItem>
            <ToggleGroupItem value="3y" className="text-[11px] h-6 px-1.5">3年</ToggleGroupItem>
            <ToggleGroupItem value="all" className="text-[11px] h-6 px-1.5">全部</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* K线图 */}
      {error ? (
        <div className="h-[360px] flex items-center justify-center text-destructive text-sm">
          <AlertTriangle className="size-4 mr-2" />
          K线数据加载失败
        </div>
      ) : (
        <KLineChart
          items={items}
          indicator={indicator}
          showMA5
          showMA10
          showMA20
          showMA60
          height={360}
          loading={loading}
        />
      )}
    </div>
  );
};

export default KlineSection;
