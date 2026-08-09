import { useMemo, useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { ArrowRight, AlertCircle } from 'lucide-react';
import type { FinanceItem, FinanceType } from '@shared/api.interface';

interface FinanceTabsProps {
  data: FinanceItem[] | undefined;
  type: FinanceType;
  onTypeChange: (t: FinanceType) => void;
  loading?: boolean;
  error?: string | null;
}

const TAB_CONFIG: { value: FinanceType; label: string }[] = [
  { value: 'profit', label: '盈利能力' },
  { value: 'operation', label: '营运能力' },
  { value: 'growth', label: '成长能力' },
  { value: 'dupont', label: '杜邦分析' },
];

function formatNumber(value: number | undefined, digits = 2): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '--';
  return value.toFixed(digits);
}

function MetricCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: number | undefined;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-sm p-4 flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`font-mono font-tabular ${
          highlight ? 'text-2xl text-primary' : 'text-xl text-foreground'
        }`}
      >
        {formatNumber(value)}
        <span className="text-sm text-muted-foreground ml-1">{unit}</span>
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <AlertCircle className="size-6 mb-2 opacity-60" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

const FinanceTabs = ({
  data,
  type,
  onTypeChange,
  loading,
  error,
}: FinanceTabsProps) => {
  const years = useMemo(() => {
    if (!data || data.length === 0) {
      const currentYear = new Date().getFullYear();
      return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
    }
    const set = new Set<number>();
    data.forEach((item: FinanceItem) => set.add(item.year));
    return Array.from(set).sort((a: number, b: number) => b - a).slice(0, 4);
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<string>(
    String(years[0] ?? new Date().getFullYear()),
  );

  useEffect(() => {
    const currentNum = Number(selectedYear);
    if (years.length > 0 && !years.includes(currentNum)) {
      setSelectedYear(String(years[0]));
    }
  }, [years, selectedYear]);

  const currentYearNum = Number(selectedYear);

  const yearItem = useMemo(() => {
    if (!data || data.length === 0) return undefined;
    const yearItems = data.filter(
      (item: FinanceItem) => item.year === currentYearNum,
    );
    if (yearItems.length === 0) return undefined;
    return yearItems.sort(
      (a: FinanceItem, b: FinanceItem) => b.quarter - a.quarter,
    )[0];
  }, [data, currentYearNum]);

  const dupontNetMargin = useMemo(() => {
    if (!yearItem || type !== 'dupont') return undefined;
    const roe = yearItem.dupontRoe;
    const turnover = yearItem.dupontAssetTurnover;
    const multiplier = yearItem.dupontEquityMultiplier;
    if (roe === undefined || turnover === undefined || multiplier === undefined) return undefined;
    if (turnover === 0 || multiplier === 0) return undefined;
    return roe / (turnover * multiplier);
  }, [yearItem, type]);

  return (
    <div className="bg-card border border-border rounded-sm">
      <div className="flex items-center justify-between border-b border-border px-4">
        <Tabs
          value={type}
          onValueChange={(v: string) => onTypeChange(v as FinanceType)}
          className="w-full"
        >
          <TabsList className="bg-transparent h-auto p-0 gap-6 rounded-none border-0">
            {TAB_CONFIG.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`
                  data-[state=active]:bg-transparent data-[state=active]:shadow-none
                  data-[state=active]:text-foreground
                  border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent
                  rounded-none px-1 py-3 h-auto text-sm font-medium
                  hover:text-foreground
                `}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger size="sm" className="w-28">
            <SelectValue placeholder="选择年份" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y: number) => (
              <SelectItem key={y} value={String(y)}>
                {y}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4">
        {loading && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            加载中...
          </div>
        )}
        {error && !loading && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {error}
          </div>
        )}
        {!loading && !error && !yearItem && (
          <EmptyState message={`${currentYearNum}年暂无财务数据`} />
        )}
        {!loading && !error && yearItem && (
          <>
            {type === 'profit' && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                data-ai-section-type="card-list"
              >
                <MetricCard label="ROE (净资产收益率)" value={yearItem.roe} unit="%" />
                <MetricCard label="毛利率" value={yearItem.grossMargin} unit="%" />
                <MetricCard label="净利率" value={yearItem.netMargin} unit="%" />
              </div>
            )}
            {type === 'operation' && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                data-ai-section-type="card-list"
              >
                <MetricCard label="总资产周转率" value={yearItem.totalAssetTurnover} unit="次" />
                <MetricCard label="存货周转率" value={yearItem.inventoryTurnover} unit="次" />
              </div>
            )}
            {type === 'growth' && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                data-ai-section-type="card-list"
              >
                <MetricCard label="营收增长率" value={yearItem.revenueGrowth} unit="%" />
                <MetricCard label="净利润增长率" value={yearItem.netProfitGrowth} unit="%" />
              </div>
            )}
            {type === 'dupont' && (
              <div className="flex flex-col gap-6">
                {/* top row: ROE */}
                <div className="flex justify-center">
                  <div className="bg-card border border-primary/50 rounded-sm p-4 min-w-[200px] text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      ROE (净资产收益率)
                    </div>
                    <div className="font-mono font-tabular text-2xl text-primary">
                      {formatNumber(yearItem.dupontRoe)}
                      <span className="text-sm text-muted-foreground ml-1">%</span>
                    </div>
                  </div>
                </div>

                {/* arrow */}
                <div className="flex justify-center text-muted-foreground">
                  <ArrowRight className="size-5 rotate-90" />
                </div>

                {/* bottom: three factors */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="bg-card border border-border rounded-sm p-4 min-w-[140px] text-center">
                     <div className="text-xs text-muted-foreground mb-1">
                       净利率
                     </div>
                     <div className="font-mono font-tabular text-lg text-foreground">
                       {formatNumber(dupontNetMargin)}
                       <span className="text-sm text-muted-foreground ml-1">%</span>
                     </div>
                  </div>

                  <span className="text-muted-foreground text-xl">×</span>

                  <div className="bg-card border border-border rounded-sm p-4 min-w-[140px] text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      总资产周转率
                    </div>
                    <div className="font-mono font-tabular text-lg text-foreground">
                      {formatNumber(yearItem.dupontAssetTurnover)}
                      <span className="text-sm text-muted-foreground ml-1">次</span>
                    </div>
                  </div>

                  <span className="text-muted-foreground text-xl">×</span>

                  <div className="bg-card border border-border rounded-sm p-4 min-w-[140px] text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      权益乘数
                    </div>
                    <div className="font-mono font-tabular text-lg text-foreground">
                      {formatNumber(yearItem.dupontEquityMultiplier)}
                      <span className="text-sm text-muted-foreground ml-1">x</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FinanceTabs;
