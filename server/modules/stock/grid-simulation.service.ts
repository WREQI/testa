import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type {
  GridSimulateRequest,
  GridSimulateResult,
  GridTrade,
  GridEquityPoint,
} from '@shared/api.interface';

interface KlineRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

@Injectable()
export class GridSimulationService {
  private readonly logger = new Logger(GridSimulationService.name);

  simulate(
    params: GridSimulateRequest,
    klines: KlineRow[],
  ): GridSimulateResult {
    this.validateParams(params);

    const {
      basePrice,
      upperPercent,
      lowerPercent,
      gridSpacingPercent,
      sharesPerGrid,
      initialShares,
      initialPrice,
      commissionRate,
      minCommission,
      stampDutyRate,
      transferFeeRate,
    } = params;

    const gridLines = this.calcGeometricGridLines(
      basePrice,
      upperPercent,
      lowerPercent,
      gridSpacingPercent,
    );

    if (klines.length < 2) {
      return {
        totalReturn: 0,
        totalProfit: 0,
        totalTrades: 0,
        buyTrades: 0,
        sellTrades: 0,
        totalFee: 0,
        maxDrawdown: 0,
        holdReturn: 0,
        excessReturn: 0,
        trades: [],
        equityCurve: [],
        gridLines,
      };
    }

    const startPrice = initialPrice ?? klines[0].close;
    let holding = initialShares;
    let cash = 0;
    let totalFee = 0;
    const trades: GridTrade[] = [];

    let currentGrid = this.getGridIndex(startPrice, gridLines);

    for (const bar of klines) {
      const { open, high, low, close, date } = bar;

      const openGrid = this.getGridIndex(open, gridLines);

      if (openGrid > currentGrid) {
        for (let g = currentGrid + 1; g <= openGrid; g++) {
          const price = gridLines[g];
          if (holding >= sharesPerGrid) {
            const amount = price * sharesPerGrid;
            const fee = this.calcFee(
              amount,
              'sell',
              commissionRate,
              minCommission,
              stampDutyRate,
              transferFeeRate,
            );
            holding -= sharesPerGrid;
            cash += amount - fee;
            totalFee += fee;
            trades.push({
              date,
              type: 'sell',
              price,
              shares: sharesPerGrid,
              amount,
              fee,
              holding,
            });
          }
        }
      } else if (openGrid < currentGrid) {
        for (let g = currentGrid - 1; g >= openGrid; g--) {
          const price = gridLines[g];
          const amount = price * sharesPerGrid;
          const fee = this.calcFee(
            amount,
            'buy',
            commissionRate,
            minCommission,
            stampDutyRate,
            transferFeeRate,
          );
          holding += sharesPerGrid;
          cash -= amount + fee;
          totalFee += fee;
          trades.push({
            date,
            type: 'buy',
            price,
            shares: sharesPerGrid,
            amount,
            fee,
            holding,
          });
        }
      }
      currentGrid = openGrid;

      const highGrid = this.getGridIndex(high, gridLines);
      const lowGrid = this.getGridIndex(low, gridLines);

      if (highGrid > currentGrid) {
        for (let g = currentGrid + 1; g <= highGrid; g++) {
          const price = gridLines[g];
          if (holding >= sharesPerGrid) {
            const amount = price * sharesPerGrid;
            const fee = this.calcFee(
              amount,
              'sell',
              commissionRate,
              minCommission,
              stampDutyRate,
              transferFeeRate,
            );
            holding -= sharesPerGrid;
            cash += amount - fee;
            totalFee += fee;
            trades.push({
              date,
              type: 'sell',
              price,
              shares: sharesPerGrid,
              amount,
              fee,
              holding,
            });
          }
        }
        currentGrid = highGrid;
      }

      if (lowGrid < currentGrid) {
        for (let g = currentGrid - 1; g >= lowGrid; g--) {
          const price = gridLines[g];
          const amount = price * sharesPerGrid;
          const fee = this.calcFee(
            amount,
            'buy',
            commissionRate,
            minCommission,
            stampDutyRate,
            transferFeeRate,
          );
          holding += sharesPerGrid;
          cash -= amount + fee;
          totalFee += fee;
          trades.push({
            date,
            type: 'buy',
            price,
            shares: sharesPerGrid,
            amount,
            fee,
            holding,
          });
        }
        currentGrid = lowGrid;
      }
    }

    const lastClose = klines[klines.length - 1].close;
    const finalValue = cash + holding * lastClose;

    let peakInvested = 0;
    let netInvested = initialShares * startPrice;
    if (netInvested > peakInvested) peakInvested = netInvested;
    for (const t of trades) {
      if (t.type === 'buy') {
        netInvested += t.amount + t.fee;
        if (netInvested > peakInvested) peakInvested = netInvested;
      } else {
        netInvested -= t.amount - t.fee;
      }
    }

    const totalProfit = finalValue - Math.max(0, netInvested);
    const investedBase = peakInvested > 0 ? peakInvested : 1;
    const totalReturn = (totalProfit / investedBase) * 100;

    const equityCurve = this.buildEquityCurve(
      klines,
      trades,
      initialShares,
      startPrice,
    );

    const maxDrawdown = this.calcMaxDrawdown(equityCurve);

    const firstClose = klines[0].close;
    const lastCloseVal = klines[klines.length - 1].close;
    const holdReturn = firstClose > 0
      ? ((lastCloseVal - firstClose) / firstClose) * 100
      : 0;

    const buyTrades = trades.filter((t) => t.type === 'buy').length;
    const sellTrades = trades.filter((t) => t.type === 'sell').length;

    return {
      totalReturn: Number(totalReturn.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      totalTrades: trades.length,
      buyTrades,
      sellTrades,
      totalFee: Number(totalFee.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      holdReturn: Number(holdReturn.toFixed(2)),
      excessReturn: Number((totalReturn - holdReturn).toFixed(2)),
      trades,
      equityCurve,
      gridLines,
    };
  }

  private validateParams(params: GridSimulateRequest) {
    if (!params.startDate || !params.endDate) {
      throw new BadRequestException('请选择回测时间范围');
    }
    if (params.basePrice <= 0) {
      throw new BadRequestException('基准价必须大于 0');
    }
    if (params.upperPercent < 0) {
      throw new BadRequestException('上方涨幅不能为负');
    }
    if (params.lowerPercent < 0) {
      throw new BadRequestException('下方跌幅不能为负');
    }
    if (params.upperPercent === 0 && params.lowerPercent === 0) {
      throw new BadRequestException('上方涨幅和下方跌幅不能同时为 0');
    }
    if (params.gridSpacingPercent <= 0) {
      throw new BadRequestException('网格间距必须大于 0');
    }
    if (params.sharesPerGrid <= 0) {
      throw new BadRequestException('每格买入股数必须大于 0');
    }
    if (params.initialShares < 0) {
      throw new BadRequestException('初始持仓不能为负');
    }
    if (params.commissionRate < 0) {
      throw new BadRequestException('佣金费率不能为负');
    }
    if (params.stampDutyRate < 0) {
      throw new BadRequestException('印花税率不能为负');
    }
    if (params.transferFeeRate < 0) {
      throw new BadRequestException('过户费率不能为负');
    }
  }

  private calcGeometricGridLines(
    basePrice: number,
    upperPercent: number,
    lowerPercent: number,
    spacingPercent: number,
  ): number[] {
    const upperPrice = basePrice * (1 + upperPercent / 100);
    const lowerPrice = basePrice * (1 - lowerPercent / 100);
    const ratio = 1 + spacingPercent / 100;

    const lines: number[] = [basePrice];

    let price = basePrice * ratio;
    while (price <= upperPrice + 1e-8) {
      lines.push(Number(price.toFixed(4)));
      price *= ratio;
    }
    if (lines[lines.length - 1] < upperPrice) {
      lines.push(Number(upperPrice.toFixed(4)));
    }

    price = basePrice / ratio;
    while (price >= lowerPrice - 1e-8) {
      lines.unshift(Number(price.toFixed(4)));
      price /= ratio;
    }
    if (lines[0] > lowerPrice) {
      lines.unshift(Number(lowerPrice.toFixed(4)));
    }

    return lines;
  }

  private getGridIndex(price: number, gridLines: number[]): number {
    if (price <= gridLines[0]) return 0;
    if (price >= gridLines[gridLines.length - 1]) {
      return gridLines.length - 1;
    }
    for (let i = 0; i < gridLines.length - 1; i++) {
      if (price >= gridLines[i] && price < gridLines[i + 1]) {
        return i;
      }
    }
    return gridLines.length - 1;
  }

  private calcFee(
    amount: number,
    side: 'buy' | 'sell',
    commissionRate: number,
    minCommission: number,
    stampDutyRate: number,
    transferFeeRate: number,
  ): number {
    const commission = Math.max(amount * commissionRate, minCommission);
    const stampDuty = side === 'sell' ? amount * stampDutyRate : 0;
    const transferFee = amount * transferFeeRate;
    return Number((commission + stampDuty + transferFee).toFixed(4));
  }

  private buildEquityCurve(
    klines: KlineRow[],
    trades: GridTrade[],
    initialShares: number,
    startPrice: number,
  ): GridEquityPoint[] {
    const curve: GridEquityPoint[] = [];
    let holding = initialShares;
    let cash = 0;

    const tradesByDate = new Map<string, GridTrade[]>();
    for (const trade of trades) {
      const list = tradesByDate.get(trade.date) || [];
      list.push(trade);
      tradesByDate.set(trade.date, list);
    }

    let tradeIdx = 0;

    for (const bar of klines) {
      const dayTrades = tradesByDate.get(bar.date);
      if (dayTrades) {
        for (const t of dayTrades) {
          if (t.type === 'buy') {
            holding += t.shares;
            cash -= t.amount + t.fee;
          } else {
            holding -= t.shares;
            cash += t.amount - t.fee;
          }
          tradeIdx++;
        }
      }

      const value = cash + holding * bar.close;
      const holdValue = initialShares * bar.close;

      curve.push({
        date: bar.date,
        value: Number(value.toFixed(2)),
        holdValue: Number(holdValue.toFixed(2)),
      });
    }

    return curve;
  }

  private calcMaxDrawdown(curve: GridEquityPoint[]): number {
    if (curve.length === 0) return 0;
    let peak = curve[0].value;
    let maxDd = 0;
    for (const p of curve) {
      if (p.value > peak) peak = p.value;
      if (peak > 0) {
        const dd = ((peak - p.value) / peak) * 100;
        if (dd > maxDd) maxDd = dd;
      }
    }
    return maxDd;
  }
}
