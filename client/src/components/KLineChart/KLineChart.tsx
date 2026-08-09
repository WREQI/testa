import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { KlineItem } from '@shared/api.interface';
import {
  calcMA,
  calcMACD,
  calcKDJ,
  calcRSI,
  detectCrossSignals,
  type CrossSignal,
} from '@client/src/utils/technical-indicators';

export type IndicatorType = 'none' | 'macd' | 'kdj' | 'rsi';

interface KLineChartProps {
  items: KlineItem[];
  indicator?: IndicatorType;
  showMA5?: boolean;
  showMA10?: boolean;
  showMA20?: boolean;
  showMA60?: boolean;
  height?: number;
  loading?: boolean;
}

const UP_COLOR = '#ff4d4f';
const DOWN_COLOR = '#52c41a';
const GOLD_COLOR = '#fbbf24';
const GRAY_COLOR = '#9ca3af';

const KLineChart = ({
  items,
  indicator = 'none',
  showMA5 = true,
  showMA10 = true,
  showMA20 = true,
  showMA60 = true,
  height = 500,
  loading = false,
}: KLineChartProps) => {
  const option = useMemo<EChartsOption>(() => {
    const dates = items.map((item) => item.date);
    const klineData = items.map((item) => [
      item.open,
      item.close,
      item.low,
      item.high,
    ]);
    const volumes = items.map((item, i) => ({
      value: item.volume,
      itemStyle: {
        color: item.close >= item.open ? UP_COLOR : DOWN_COLOR,
      },
    }));
    const closes = items.map((item) => item.close);
    const highs = items.map((item) => item.high);
    const lows = items.map((item) => item.low);

    const ma5 = calcMA(closes, 5);
    const ma10 = calcMA(closes, 10);
    const ma20 = calcMA(closes, 20);
    const ma60 = calcMA(closes, 60);

    const signals: CrossSignal[] = detectCrossSignals(items, 5, 10);
    const goldenPoints = signals
      .filter((s) => s.type === 'golden')
      .map((s) => ({
        name: '金叉',
        coord: [s.date, lows[s.index] * 0.97],
        value: lows[s.index] * 0.97,
        itemStyle: { color: GOLD_COLOR },
        symbol: 'triangle',
        symbolSize: 12,
        label: {
          show: false,
        },
      }));
    const deathPoints = signals
      .filter((s) => s.type === 'death')
      .map((s) => ({
        name: '死叉',
        coord: [s.date, highs[s.index] * 1.03],
        value: highs[s.index] * 1.03,
        itemStyle: { color: GRAY_COLOR },
        symbol: 'triangle',
        symbolRotate: 180,
        symbolSize: 12,
        label: {
          show: false,
        },
      }));

    const maSeries: any[] = [];
    if (showMA5) {
      maSeries.push({
        name: 'MA5',
        type: 'line',
        data: ma5,
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 1, color: '#f5f5f5' },
      });
    }
    if (showMA10) {
      maSeries.push({
        name: 'MA10',
        type: 'line',
        data: ma10,
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 1, color: '#facc15' },
      });
    }
    if (showMA20) {
      maSeries.push({
        name: 'MA20',
        type: 'line',
        data: ma20,
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 1, color: '#c084fc' },
      });
    }
    if (showMA60) {
      maSeries.push({
        name: 'MA60',
        type: 'line',
        data: ma60,
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 1, color: '#22c55e' },
      });
    }

    const gridTop = 40;
    const gridBottom = indicator === 'none' ? 50 : 120;
    const volumeHeight = 25;
    const indicatorHeight = indicator === 'none' ? 0 : 70;

    const series: any[] = [
      {
        name: 'K线',
        type: 'candlestick',
        data: klineData,
        itemStyle: {
          color: UP_COLOR,
          color0: DOWN_COLOR,
          borderColor: UP_COLOR,
          borderColor0: DOWN_COLOR,
        },
        markPoint: {
          symbol: 'triangle',
          symbolSize: 12,
          data: [...goldenPoints, ...deathPoints],
          tooltip: {
            formatter: (params: any) => {
              const s = signals.find(
                (sig) =>
                  sig.date === params.data.coord?.[0] &&
                  ((sig.type === 'golden' && params.data.name === '金叉') ||
                    (sig.type === 'death' && params.data.name === '死叉')),
              );
              if (!s) return params.name;
              return `${s.date}<br/>${s.type === 'golden' ? '金叉' : '死叉'}<br/>MA5: ${s.shortMA.toFixed(2)}<br/>MA10: ${s.longMA.toFixed(2)}`;
            },
          },
        },
      },
      ...maSeries,
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
      },
    ];

    if (indicator === 'macd') {
      const { dif, dea, macd } = calcMACD(closes);
      series.push({
        name: 'MACD',
        type: 'bar',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: macd.map((v) => ({
          value: v,
          itemStyle: {
            color: v !== null && v >= 0 ? UP_COLOR : DOWN_COLOR,
          },
        })),
      });
      series.push({
        name: 'DIF',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: dif,
        symbol: 'none',
        lineStyle: { width: 1, color: '#f5f5f5' },
      });
      series.push({
        name: 'DEA',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: dea,
        symbol: 'none',
        lineStyle: { width: 1, color: '#facc15' },
      });
    } else if (indicator === 'kdj') {
      const { k, d, j } = calcKDJ(highs, lows, closes);
      series.push(
        {
          name: 'K',
          type: 'line',
          xAxisIndex: 2,
          yAxisIndex: 2,
          data: k,
          symbol: 'none',
          lineStyle: { width: 1, color: '#f5f5f5' },
        },
        {
          name: 'D',
          type: 'line',
          xAxisIndex: 2,
          yAxisIndex: 2,
          data: d,
          symbol: 'none',
          lineStyle: { width: 1, color: '#facc15' },
        },
        {
          name: 'J',
          type: 'line',
          xAxisIndex: 2,
          yAxisIndex: 2,
          data: j,
          symbol: 'none',
          lineStyle: { width: 1, color: '#c084fc' },
        },
      );
    } else if (indicator === 'rsi') {
      const rsi = calcRSI(closes, 14);
      series.push({
        name: 'RSI',
        type: 'line',
        xAxisIndex: 2,
        yAxisIndex: 2,
        data: rsi,
        symbol: 'none',
        lineStyle: { width: 1, color: '#22c55e' },
      });
    }

    const xAxes: any[] = [
      {
        type: 'category',
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#2f3745' } },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#2f3745' } },
        axisLabel: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ];

    const yAxes: any[] = [
      {
        scale: true,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      },
      {
        scale: true,
        gridIndex: 1,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
    ];

    const grids: any[] = [
      {
        left: '3%',
        right: '3%',
        top: gridTop,
        height: `${100 - gridTop - gridBottom - volumeHeight - indicatorHeight}%`,
      },
      {
        left: '3%',
        right: '3%',
        top: `${100 - gridBottom - volumeHeight - indicatorHeight}%`,
        height: `${volumeHeight - 10}%`,
      },
    ];

    if (indicator !== 'none') {
      xAxes.push({
        type: 'category',
        gridIndex: 2,
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#2f3745' } },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        axisTick: { show: false },
        splitLine: { show: false },
      });
      yAxes.push({
        scale: true,
        gridIndex: 2,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      });
      grids.push({
        left: '3%',
        right: '3%',
        top: `${100 - gridBottom - indicatorHeight + 10}%`,
        height: `${indicatorHeight - 20}%`,
      });
    }

    return {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: { color: '#4b5563' },
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1, indicator !== 'none' ? 2 : 0].filter(
            (v, i, arr) => arr.indexOf(v) === i,
          ),
          start: 30,
          end: 100,
        },
        {
          type: 'slider',
          xAxisIndex: [0],
          start: 30,
          end: 100,
          bottom: 5,
          height: 16,
          borderColor: '#2f3745',
          fillerColor: 'rgba(79, 70, 229, 0.15)',
          handleStyle: { color: '#4f46e5' },
          textStyle: { color: '#6b7280' },
        },
      ],
      grid: grids,
      xAxis: xAxes,
      yAxis: yAxes,
      series,
    };
  }, [items, indicator, showMA5, showMA10, showMA20, showMA60]);

  return (
    <div
      className="w-full bg-card border border-border rounded-sm"
      style={{ height }}
    >
      {loading ? (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          暂无数据
        </div>
      ) : (
        <ReactECharts
          option={option}
          theme="dark"
          style={{ height: '100%', width: '100%' }}
          notMerge
          lazyUpdate
        />
      )}
    </div>
  );
};

export default KLineChart;
