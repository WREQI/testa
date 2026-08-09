import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { StockQuote, FinanceItem, FinanceType } from '@shared/api.interface';
import FinanceTabs from '@client/src/components/FinanceTabs/FinanceTabs';
import { Newspaper } from 'lucide-react';

// ============ 资金 Tab ============
export function MoneyTab() {
  const pieOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: '#1a1f2b',
      borderColor: '#2a3040',
      textStyle: { color: '#e2e6eb', fontSize: 12 },
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 2,
          borderColor: '#1a1f2b',
          borderWidth: 2,
        },
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: 28500, name: '主力流入', itemStyle: { color: '#e11d48' } },
          { value: 15200, name: '散户流入', itemStyle: { color: '#f87171' } },
          { value: 22800, name: '主力流出', itemStyle: { color: '#10b981' } },
          { value: 20500, name: '散户流出', itemStyle: { color: '#34d399' } },
        ],
      },
    ],
  };

  const flowItems = [
    { label: '今日主力净流入', value: '+5,700万', color: 'text-up' },
    { label: '今日超大单净流入', value: '+3,200万', color: 'text-up' },
    { label: '今日大单净流入', value: '+2,500万', color: 'text-up' },
    { label: '今日中单净流入', value: '-1,800万', color: 'text-down' },
    { label: '今日小单净流入', value: '-3,900万', color: 'text-down' },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">主力资金流向</h3>
          <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
            演示数据
          </span>
        </div>
        <div className="h-[300px]">
          <ReactECharts option={pieOption} style={{ height: '100%' }} theme="" />
        </div>
        {/* 图例 */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['主力流入', '散户流入', '主力流出', '散户流出'].map((name, i) => (
            <div key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="size-2 rounded-sm"
                style={{
                  backgroundColor: ['#e11d48', '#f87171', '#10b981', '#34d399'][i],
                }}
              />
              {name}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">资金明细</h3>
          <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
            演示数据
          </span>
        </div>
        {flowItems.map((item) => (
          <div key={item.label} className="flex justify-between items-baseline text-xs py-1 border-b border-border/50 last:border-0">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-mono font-tabular ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ 资讯 Tab ============
export function NewsTab() {
  return (
    <div className="bg-card border border-border rounded-sm p-12 text-center">
      <Newspaper className="size-10 mx-auto text-muted-foreground mb-3 opacity-50" />
      <div className="text-sm text-muted-foreground">暂无资讯，敬请期待</div>
    </div>
  );
}

// ============ 简况 Tab ============
export function ProfileTab({ quote }: { quote: StockQuote | null | undefined }) {
  const metrics = [
    { label: '总市值', value: '2,856亿', demo: true },
    { label: '流通市值', value: '2,640亿', demo: true },
    { label: '市盈率TTM', value: quote?.peTTM?.toFixed(2) || '--' },
    { label: '市净率', value: quote?.pbMRQ?.toFixed(2) || '--' },
    { label: '总股本', value: '185.6亿', demo: true },
    { label: '流通股', value: '171.5亿', demo: true },
    { label: '每股收益', value: '1.85', demo: true },
    { label: '每股净资产', value: '12.36', demo: true },
    { label: 'ROE', value: '14.95%', demo: true },
    { label: '毛利率', value: '42.6%', demo: true },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-sm p-4">
        <h3 className="text-sm font-medium text-foreground mb-2">公司简介</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          公司是国内领先的半导体设计企业，专注于高性能芯片的研发、设计与销售。
          主要产品包括处理器芯片、存储控制芯片及相关解决方案，广泛应用于消费电子、
          工业控制、汽车电子等领域。公司拥有完整的自主知识产权体系，研发团队规模
          超过2000人，在先进制程工艺上具备核心竞争力。
          <span className="text-[10px] ml-1 bg-accent px-1 rounded-sm text-muted-foreground">演示</span>
        </p>
      </div>

      <div className="bg-card border border-border rounded-sm p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">主要指标</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex justify-between items-baseline text-xs py-1 border-b border-border/50">
              <span className="text-muted-foreground">{m.label}</span>
              <span className="font-mono font-tabular text-foreground">
                {m.value}
                {m.demo && (
                  <span className="text-[10px] text-muted-foreground bg-accent px-1 rounded-sm ml-1">
                    演示
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ 分析 Tab ============
export function AnalysisTab() {
  const dimensions = [
    { name: '技术面', score: 82, color: 'bg-up' },
    { name: '基本面', score: 75, color: 'bg-primary' },
    { name: '资金面', score: 68, color: 'bg-down' },
    { name: '消息面', score: 70, color: 'bg-yellow-500' },
    { name: '行业对比', score: 85, color: 'bg-purple-500' },
  ];

  const radarOption: EChartsOption = {
    tooltip: {
      backgroundColor: '#1a1f2b',
      borderColor: '#2a3040',
      textStyle: { color: '#e2e6eb', fontSize: 12 },
    },
    radar: {
      indicator: [
        { name: '技术面' },
        { name: '基本面' },
        { name: '资金面' },
        { name: '成长性' },
        { name: '估值' },
      ],
      axisName: { color: '#7d889a', fontSize: 11 },
      splitLine: { lineStyle: { color: '#2a3040' } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisLine: { lineStyle: { color: '#2a3040' } },
      radius: '65%',
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [82, 75, 68, 78, 70],
            name: '综合评分',
            lineStyle: { color: '#0ea5e9', width: 1.5 },
            areaStyle: { color: '#0ea5e933' },
            itemStyle: { color: '#0ea5e9' },
          },
        ],
      },
    ],
  };

  const barOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1f2b',
      borderColor: '#2a3040',
      textStyle: { color: '#e2e6eb', fontSize: 12 },
    },
    legend: {
      data: ['股票', '行业', '大盘'],
      textStyle: { color: '#7d889a', fontSize: 11 },
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '30px', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: ['-5日', '-4日', '-3日', '-2日', '昨日'],
      axisLine: { lineStyle: { color: '#2a3040' } },
      axisLabel: { color: '#7d889a', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: '#7d889a',
        fontSize: 10,
        formatter: '{value}%',
      },
      splitLine: { lineStyle: { color: '#2a3040', type: 'dashed' } },
    },
    series: [
      {
        name: '股票',
        type: 'bar',
        data: [2.1, -0.8, 1.5, 3.2, -1.3],
        itemStyle: { color: '#e11d48', borderRadius: [2, 2, 0, 0] },
        barWidth: 8,
      },
      {
        name: '行业',
        type: 'bar',
        data: [1.2, -0.5, 0.8, 1.9, -0.6],
        itemStyle: { color: '#0ea5e9', borderRadius: [2, 2, 0, 0] },
        barWidth: 8,
      },
      {
        name: '大盘',
        type: 'bar',
        data: [0.5, -0.3, 0.4, 1.1, -0.2],
        itemStyle: { color: '#7d889a', borderRadius: [2, 2, 0, 0] },
        barWidth: 8,
      },
    ],
  };

  const supportLevels = [
    { price: '32.50', strength: '强' },
    { price: '31.80', strength: '中' },
    { price: '30.20', strength: '弱' },
  ];
  const resistanceLevels = [
    { price: '36.20', strength: '弱' },
    { price: '37.50', strength: '中' },
    { price: '39.80', strength: '强' },
  ];

  return (
    <div className="space-y-3">
      {/* 综合评分 */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">综合评分</h3>
          <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
            演示数据
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(220, 15%, 20%)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(195, 70%, 50%)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 42 * 0.78} ${2 * Math.PI * 42}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-primary font-mono font-tabular">78</span>
              <span className="text-[10px] text-muted-foreground">综合评分</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {dimensions.map((d) => (
              <div key={d.name} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-mono font-tabular text-foreground">{d.score}</span>
                </div>
                <div className="h-1.5 bg-accent rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${d.color} rounded-sm`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 雷达图 */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-foreground">五维雷达图</h3>
          <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
            演示数据
          </span>
        </div>
        <div className="h-[300px]">
          <ReactECharts option={radarOption} style={{ height: '100%' }} theme="" />
        </div>
      </div>

      {/* 技术分析文字 */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">技术分析</h3>
          <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
            演示数据
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          短期均线呈多头排列，MACD金叉后持续向上，量能温和放大，技术面偏强。
          建议关注上方压力位突破情况，若放量突破37.50元可考虑加仓；
          下方32.50元为重要支撑位，跌破需止损。
        </p>
      </div>

      {/* 压力位/支撑位 */}
      <div className="bg-card border border-border rounded-sm p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">压力位 / 支撑位</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-down font-medium mb-2">支撑位</div>
            <div className="space-y-1">
              {supportLevels.map((s, i) => (
                <div key={i} className="flex justify-between items-baseline text-xs py-0.5">
                  <span className="font-mono font-tabular text-foreground">{s.price}</span>
                  <span className="text-[10px] text-muted-foreground">{s.strength}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-up font-medium mb-2">压力位</div>
            <div className="space-y-1">
              {resistanceLevels.map((r, i) => (
                <div key={i} className="flex justify-between items-baseline text-xs py-0.5">
                  <span className="font-mono font-tabular text-foreground">{r.price}</span>
                  <span className="text-[10px] text-muted-foreground">{r.strength}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 近5日涨跌幅对比 */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-foreground">近5日涨跌幅对比</h3>
          <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
            演示数据
          </span>
        </div>
        <div className="h-[300px]">
          <ReactECharts option={barOption} style={{ height: '100%' }} theme="" />
        </div>
      </div>
    </div>
  );
}

// ============ 财务 Tab ============
interface FinanceTabProps {
  data: FinanceItem[] | undefined;
  type: FinanceType;
  onTypeChange: (t: FinanceType) => void;
  loading: boolean;
  error: string | null;
}

export function FinanceTab({ data, type, onTypeChange, loading, error }: FinanceTabProps) {
  const [subTab, setSubTab] = useState<'basic' | 'indicators'>('basic');

  const profitBarOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1f2b',
      borderColor: '#2a3040',
      textStyle: { color: '#e2e6eb', fontSize: 12 },
    },
    legend: {
      data: ['营业总收入', '净利润'],
      textStyle: { color: '#7d889a', fontSize: 11 },
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '30px', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: ['24Q3', '24Q4', '25Q1', '25Q2', '25Q3', '25Q4', '26Q1', '26Q2'],
      axisLine: { lineStyle: { color: '#2a3040' } },
      axisLabel: { color: '#7d889a', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#7d889a', fontSize: 10, formatter: '{value}亿' },
      splitLine: { lineStyle: { color: '#2a3040', type: 'dashed' } },
    },
    series: [
      {
        name: '营业总收入',
        type: 'bar',
        data: [320, 368, 315, 352, 385, 420, 398, 445],
        itemStyle: { color: '#0ea5e9', borderRadius: [2, 2, 0, 0] },
        barWidth: 10,
      },
      {
        name: '净利润',
        type: 'bar',
        data: [48, 62, 45, 58, 72, 85, 78, 95],
        itemStyle: { color: '#e11d48', borderRadius: [2, 2, 0, 0] },
        barWidth: 10,
      },
    ],
  };

  const announcements = [
    { title: '2026年半年度报告', date: '2026-08-15' },
    { title: '关于回购公司股份方案的公告', date: '2026-08-08' },
    { title: '2026年第一季度报告', date: '2026-04-28' },
    { title: '关于设立全资子公司的公告', date: '2026-03-15' },
  ];

  return (
    <div className="space-y-3">
      {/* 子 Tab */}
      <div className="bg-card border border-border rounded-sm px-3 flex">
        {(['basic', 'indicators'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`text-xs px-3 py-2.5 font-medium border-b-2 transition-colors ${
              subTab === t
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {t === 'basic' ? '基础数据' : '关键指标'}
          </button>
        ))}
      </div>

      {subTab === 'basic' && (
        <>
          <div className="bg-card border border-border rounded-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">利润表（季度）</h3>
              <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
                演示数据
              </span>
            </div>
            <div className="h-[300px]">
              <ReactECharts option={profitBarOption} style={{ height: '100%' }} theme="" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-sm p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">财务披露</h3>
            <div className="space-y-2">
              {announcements.map((a, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 cursor-pointer hover:text-primary transition-colors"
                >
                  <span className="text-xs text-foreground line-clamp-1">{a.title}</span>
                  <span className="text-[10px] text-muted-foreground font-mono font-tabular ml-2 flex-shrink-0">
                    {a.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {subTab === 'indicators' && (
        <FinanceTabs
          data={data}
          type={type}
          onTypeChange={onTypeChange}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
