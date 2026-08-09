import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { ScrollArea } from '@client/src/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { Play, RefreshCw, TrendingUp, DollarSign, BarChart3, ArrowUpDown, AlertCircle } from 'lucide-react';
import type { GridSimulateRequest, GridSimulateResult } from '@shared/api.interface';
import { simulateGrid } from '@client/src/api/stock';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface GridSimulatorProps {
  code: string;
  klineItems: Array<{ date: string; open: number; high: number; low: number; close: number }>;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatNum(v: number | undefined, digits = 2): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '--';
  return v.toFixed(digits);
}

function formatPct(v: number | undefined): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '--';
  const prefix = v > 0 ? '+' : '';
  return `${prefix}${v.toFixed(2)}%`;
}

function calcGridCount(
  basePrice: number,
  upperPercent: number,
  lowerPercent: number,
  spacingPercent: number,
): number {
  if (basePrice <= 0 || spacingPercent <= 0) return 0;
  const ratio = 1 + spacingPercent / 100;
  const upperPrice = basePrice * (1 + upperPercent / 100);
  const lowerPrice = basePrice * (1 - lowerPercent / 100);

  let upperCount = 0;
  let price = basePrice * ratio;
  while (price <= upperPrice + 1e-8) {
    upperCount++;
    price *= ratio;
  }

  let lowerCount = 0;
  price = basePrice / ratio;
  while (price >= lowerPrice - 1e-8) {
    lowerCount++;
    price /= ratio;
  }

  return upperCount + lowerCount;
}

const GridSimulator = ({ code, klineItems }: GridSimulatorProps) => {
  const today = useMemo(() => formatDate(new Date()), []);
  const oneYearAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 365);
    return formatDate(d);
  }, []);

  const currentPrice = useMemo(() => {
    if (klineItems.length === 0) return 0;
    return klineItems[klineItems.length - 1].close || 0;
  }, [klineItems]);

  const [startDate, setStartDate] = useState(oneYearAgo);
  const [endDate, setEndDate] = useState(today);
  const [basePrice, setBasePrice] = useState('');
  const [upperPercent, setUpperPercent] = useState(30);
  const [lowerPercent, setLowerPercent] = useState(30);
  const [gridSpacingPercent, setGridSpacingPercent] = useState(5);
  const [sharesPerGrid, setSharesPerGrid] = useState(100);
  const [initialShares, setInitialShares] = useState(0);
  const [commissionRate, setCommissionRate] = useState(0.025);
  const [minCommission, setMinCommission] = useState(5);
  const [stampDutyRate, setStampDutyRate] = useState(0.1);
  const [transferFeeRate, setTransferFeeRate] = useState(0.001);

  useEffect(() => {
    if (currentPrice > 0 && !basePrice) {
      setBasePrice(String(currentPrice.toFixed(2)));
    }
  }, [currentPrice, basePrice]);

  const [result, setResult] = useState<GridSimulateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bp = parseFloat(basePrice) || 0;
  const upperPrice = bp * (1 + upperPercent / 100);
  const lowerPrice = bp * (1 - lowerPercent / 100);
  const gridCount = calcGridCount(bp, upperPercent, lowerPercent, gridSpacingPercent);

  const handleUseCurrentPrice = useCallback(() => {
    if (currentPrice > 0) {
      setBasePrice(String(currentPrice.toFixed(2)));
    }
  }, [currentPrice]);

  const handleSimulate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GridSimulateRequest = {
        startDate,
        endDate,
        basePrice: parseFloat(basePrice),
        upperPercent,
        lowerPercent,
        gridSpacingPercent,
        sharesPerGrid,
        initialShares,
        commissionRate: commissionRate / 100,
        minCommission,
        stampDutyRate: stampDutyRate / 100,
        transferFeeRate: transferFeeRate / 100,
      };
      const data = await simulateGrid(code, params);
      setResult(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '模拟失败';
      setError(msg);
      logger.error('grid simulate failed', err);
    } finally {
      setLoading(false);
    }
  }, [code, startDate, endDate, basePrice, upperPercent, lowerPercent, gridSpacingPercent, sharesPerGrid, initialShares, commissionRate, minCommission, stampDutyRate, transferFeeRate]);

  const klineChartData = useMemo(() => {
    if (!result || klineItems.length === 0) return [];
    const gridLines = result.gridLines;
    return klineItems
      .filter((k) => k.date >= startDate && k.date <= endDate)
      .map((k) => ({
        date: k.date.slice(5),
        close: k.close,
        high: k.high,
        low: k.low,
        upperLine: gridLines[gridLines.length - 1],
        lowerLine: gridLines[0],
        baseLine: bp,
      }));
  }, [result, klineItems, startDate, endDate, bp]);

  const equityData = useMemo(() => {
    if (!result) return [];
    return result.equityCurve.map((p) => ({
      date: p.date.slice(5),
      网格策略: p.value,
      持有不动: p.holdValue,
    }));
  }, [result]);

  const isPositive = (result?.totalReturn ?? 0) >= 0;
  const holdPositive = (result?.holdReturn ?? 0) >= 0;
  const excessPositive = (result?.excessReturn ?? 0) >= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-3">
      {/* 参数配置区 */}
      <div className="bg-card border border-border rounded-sm p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">参数配置</h3>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-medium">回测时间范围</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">开始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">结束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-medium">基准价</div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              onClick={handleUseCurrentPrice}
            >
              <RefreshCw className="size-3 mr-1" />
              使用当前价
            </Button>
          </div>
          <div className="space-y-1">
            <Input
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="h-8 text-xs font-mono font-tabular"
              placeholder="输入基准价"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-medium">价格区间</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">上方涨幅(%)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                value={upperPercent}
                onChange={(e) => setUpperPercent(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-tabular text-up"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">下方跌幅(%)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                value={lowerPercent}
                onChange={(e) => setLowerPercent(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-tabular text-down"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-medium">网格设置</div>
          <div className="space-y-1">
            <Label className="text-xs">每格间距(%)</Label>
            <Input
              type="number"
              step="0.5"
              min="0.1"
              value={gridSpacingPercent}
              onChange={(e) => setGridSpacingPercent(parseFloat(e.target.value) || 0.5)}
              className="h-8 text-xs font-mono font-tabular"
            />
          </div>
          <div className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-sm space-y-0.5">
            <div className="flex justify-between">
              <span>对应上限价</span>
              <span className="font-mono font-tabular text-foreground">¥{formatNum(upperPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>对应下限价</span>
              <span className="font-mono font-tabular text-foreground">¥{formatNum(lowerPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>网格总数</span>
              <span className="font-mono font-tabular text-foreground">{gridCount} 格</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">每格买入(股)</Label>
          <Input
            type="number"
            min={1}
            value={sharesPerGrid}
            onChange={(e) => setSharesPerGrid(parseInt(e.target.value, 10) || 100)}
            className="h-8 text-xs font-mono font-tabular"
          />
        </div>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-medium">初始设置</div>
          <div className="space-y-1">
            <Label className="text-xs">初始持仓(股)</Label>
            <Input
              type="number"
              min={0}
              value={initialShares}
              onChange={(e) => setInitialShares(parseInt(e.target.value, 10) || 0)}
              className="h-8 text-xs font-mono font-tabular"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-medium">交易费用</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">佣金率(%)</Label>
              <Input
                type="number"
                step="0.001"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-tabular"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">最低佣金(元)</Label>
              <Input
                type="number"
                step="0.1"
                value={minCommission}
                onChange={(e) => setMinCommission(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-tabular"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">印花税(%)</Label>
              <Input
                type="number"
                step="0.01"
                value={stampDutyRate}
                onChange={(e) => setStampDutyRate(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-tabular"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">过户费(%)</Label>
              <Input
                type="number"
                step="0.001"
                value={transferFeeRate}
                onChange={(e) => setTransferFeeRate(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-tabular"
              />
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleSimulate}
          disabled={loading || !basePrice || parseFloat(basePrice) <= 0}
        >
          {loading ? (
            <RefreshCw className="size-4 mr-2 animate-spin" />
          ) : (
            <Play className="size-4 mr-2" />
          )}
          {loading ? '模拟中...' : '开始模拟'}
        </Button>

        {error && (
          <div className="text-xs text-destructive flex items-center gap-1.5 bg-destructive/10 px-2 py-1.5 rounded-sm">
            <AlertCircle className="size-3.5" />
            {error}
          </div>
        )}
      </div>

      {/* 结果展示区 */}
      <div className="space-y-3">
        {!result && !loading && !error && (
          <div className="bg-card border border-border rounded-sm p-12 text-center text-muted-foreground">
            <BarChart3 className="size-10 mx-auto mb-3 opacity-40" />
            <div className="text-sm">配置参数后点击「开始模拟」</div>
            <div className="text-xs mt-1 opacity-70">基于历史K线数据回测网格策略收益</div>
          </div>
        )}

        {loading && (
          <div className="bg-card border border-border rounded-sm p-12 text-center text-muted-foreground">
            <RefreshCw className="size-10 mx-auto mb-3 opacity-40 animate-spin" />
            <div className="text-sm">模拟计算中...</div>
          </div>
        )}

        {result && !loading && (
          <>
            {/* 核心指标卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" data-ai-section-type="card-list">
              <div className="bg-card border border-border rounded-sm p-3">
                <div className="text-xs text-muted-foreground mb-1">总收益率</div>
                <div className={`text-xl font-bold font-mono font-tabular ${isPositive ? 'text-up' : 'text-down'}`}>
                  {formatPct(result.totalReturn)}
                </div>
              </div>
              <div className="bg-card border border-border rounded-sm p-3">
                <div className="text-xs text-muted-foreground mb-1">总收益</div>
                <div className={`text-lg font-semibold font-mono font-tabular ${isPositive ? 'text-up' : 'text-down'}`}>
                  {isPositive ? '+' : ''}{formatNum(result.totalProfit)}
                  <span className="text-xs ml-1">元</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-sm p-3">
                <div className="text-xs text-muted-foreground mb-1">交易笔数</div>
                <div className="text-lg font-semibold font-mono font-tabular text-foreground">
                  {result.totalTrades}
                  <span className="text-xs text-muted-foreground ml-1">笔</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  买 {result.buyTrades} / 卖 {result.sellTrades}
                </div>
              </div>
              <div className="bg-card border border-border rounded-sm p-3">
                <div className="text-xs text-muted-foreground mb-1">总手续费</div>
                <div className="text-lg font-semibold font-mono font-tabular text-foreground">
                  {formatNum(result.totalFee)}
                  <span className="text-xs ml-1">元</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-sm p-3">
                <div className="text-xs text-muted-foreground mb-1">最大回撤</div>
                <div className="text-lg font-semibold font-mono font-tabular text-down">
                  -{formatNum(result.maxDrawdown)}%
                </div>
              </div>
              <div className="bg-card border border-border rounded-sm p-3">
                <div className="text-xs text-muted-foreground mb-1">超额收益</div>
                <div className={`text-lg font-semibold font-mono font-tabular ${excessPositive ? 'text-up' : 'text-down'}`}>
                  {formatPct(result.excessReturn)}
                </div>
              </div>
            </div>

            {/* 收益对比 */}
            <div className="bg-card border border-border rounded-sm p-4 flex items-center justify-around">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">网格策略收益</div>
                <div className={`text-2xl font-bold font-mono font-tabular ${isPositive ? 'text-up' : 'text-down'}`}>
                  {formatPct(result.totalReturn)}
                </div>
              </div>
              <div className="text-3xl text-muted-foreground">VS</div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">持有不动收益</div>
                <div className={`text-2xl font-bold font-mono font-tabular ${holdPositive ? 'text-up' : 'text-down'}`}>
                  {formatPct(result.holdReturn)}
                </div>
              </div>
            </div>

            {/* 图表 - 价格走势+网格线 */}
            <div className="bg-card border border-border rounded-sm p-4">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                价格走势与网格区间
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={klineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }}
                      axisLine={{ stroke: 'hsl(220 15% 20%)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }}
                      axisLine={{ stroke: 'hsl(220 15% 20%)' }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(220 20% 12%)',
                        border: '1px solid hsl(220 15% 20%)',
                        borderRadius: 2,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="close"
                      name="收盘价"
                      stroke="hsl(195 70% 50%)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <ReferenceLine
                      y={result.gridLines[result.gridLines.length - 1]}
                      stroke="hsl(0 75% 55%)"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                      label={{ value: '上限', fill: 'hsl(0 75% 55%)', fontSize: 10, position: 'right' }}
                    />
                    <ReferenceLine
                      y={bp}
                      stroke="hsl(42 90% 55%)"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      label={{ value: '基准', fill: 'hsl(42 90% 55%)', fontSize: 10, position: 'right' }}
                    />
                    <ReferenceLine
                      y={result.gridLines[0]}
                      stroke="hsl(145 60% 45%)"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                      label={{ value: '下限', fill: 'hsl(145 60% 45%)', fontSize: 10, position: 'right' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 图表 - 累计收益曲线 */}
            <div className="bg-card border border-border rounded-sm p-4">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                累计收益对比
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }}
                      axisLine={{ stroke: 'hsl(220 15% 20%)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }}
                      axisLine={{ stroke: 'hsl(220 15% 20%)' }}
                      tickFormatter={(v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : String(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(220 20% 12%)',
                        border: '1px solid hsl(220 15% 20%)',
                        borderRadius: 2,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [value.toFixed(2), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="网格策略"
                      stroke="hsl(195 70% 50%)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="持有不动"
                      stroke="hsl(215 15% 55%)"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 交易明细表 */}
            <div className="bg-card border border-border rounded-sm">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <ArrowUpDown className="size-4 text-primary" />
                <span className="text-sm font-semibold">交易明细</span>
                <span className="text-xs text-muted-foreground ml-1">
                  共 {result.trades.length} 笔
                </span>
              </div>
              <ScrollArea className="h-72">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="h-9 text-xs">日期</TableHead>
                      <TableHead className="h-9 text-xs">方向</TableHead>
                      <TableHead className="h-9 text-xs text-right">价格</TableHead>
                      <TableHead className="h-9 text-xs text-right">数量</TableHead>
                      <TableHead className="h-9 text-xs text-right">金额</TableHead>
                      <TableHead className="h-9 text-xs text-right">手续费</TableHead>
                      <TableHead className="h-9 text-xs text-right">持仓</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.trades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                          暂无交易记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      result.trades.map((t, i) => (
                        <TableRow key={i} className="h-8">
                          <TableCell className="py-1 text-xs font-mono font-tabular">{t.date}</TableCell>
                          <TableCell className={`py-1 text-xs font-medium ${t.type === 'buy' ? 'text-down' : 'text-up'}`}>
                            {t.type === 'buy' ? '买入' : '卖出'}
                          </TableCell>
                          <TableCell className="py-1 text-xs text-right font-mono font-tabular">
                            {formatNum(t.price, 3)}
                          </TableCell>
                          <TableCell className="py-1 text-xs text-right font-mono font-tabular">
                            {t.shares}
                          </TableCell>
                          <TableCell className="py-1 text-xs text-right font-mono font-tabular">
                            {formatNum(t.amount, 2)}
                          </TableCell>
                          <TableCell className="py-1 text-xs text-right font-mono font-tabular text-muted-foreground">
                            {formatNum(t.fee, 2)}
                          </TableCell>
                          <TableCell className="py-1 text-xs text-right font-mono font-tabular">
                            {t.holding}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GridSimulator;
